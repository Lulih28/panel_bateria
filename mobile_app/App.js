import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, RefreshControl, ScrollView, Switch, Alert, Dimensions } from 'react-native';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import { LineChart } from 'react-native-chart-kit';

// CONFIG: CHANGE IP HERE
const API_URL = 'http://192.168.1.38:8000/api/battery/';

// THEME COLORS (Matches battery_simple.html)
const THEME = {
  primary: '#10b981',
  bg: '#0f172a',
  card: '#1a1f2e',
  border: '#2d3748',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
};

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('panel'); // 'panel', 'historial', 'ajustes'
  const [syncing, setSyncing] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    notifications: true,
    lowPower: false,
    doNotDisturb: false,
    theme: 'dark'
  });

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Error de conexión');
      const jsonData = await response.json();
      // Handle potential pagination if Django adds it later
      const result = Array.isArray(jsonData) ? jsonData : jsonData.results;
      setData(result || []);
    } catch (err) {
      console.error(err);
      // Don't clear data on error to keep showing what we have
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSyncing(false);
    }
  };

  const syncBattery = async () => {
    setSyncing(true);
    try {
      const level = await Battery.getBatteryLevelAsync();
      const levelPercent = Math.round(level * 100);
      const deviceName = Device.modelName || 'Dispositivo Móvil';

      console.log('Sending battery:', levelPercent, deviceName);

      // Send to API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: levelPercent,
          device_id: deviceName
        }),
      });

      if (!response.ok) throw new Error('Falló el envío de datos');

      Alert.alert('✅ Sincronizado', `Batería: ${levelPercent}%`);
      fetchData(); // reload data
    } catch (err) {
      Alert.alert('❌ Error', 'No se pudo leer o enviar la batería. ' + err.message);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // derived stats
  const stats = useMemo(() => {
    if (!data.length) return { max: 0, min: 0, avg: 0, count: 0 };
    const levels = data.map(d => d.level);
    const sum = levels.reduce((a, b) => a + b, 0);
    return {
      max: Math.max(...levels),
      min: Math.min(...levels),
      avg: Math.round(sum / levels.length),
      count: data.length
    };
  }, [data]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'panel':
        return <PanelTab data={data} stats={stats} refreshing={refreshing} onRefresh={onRefresh} onSync={syncBattery} syncing={syncing} />;
      case 'historial':
        return <HistorialTab data={data} refreshing={refreshing} onRefresh={onRefresh} />;
      case 'ajustes':
        return <AjustesTab settings={settings} toggleSetting={toggleSetting} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔋 Panel de Batería</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Text style={styles.refreshBtnText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      {/* NAV TABS */}
      <View style={styles.nav}>
        <TabButton title="Panel" active={activeTab === 'panel'} onPress={() => setActiveTab('panel')} />
        <TabButton title="Historial" active={activeTab === 'historial'} onPress={() => setActiveTab('historial')} />
        <TabButton title="Ajustes" active={activeTab === 'ajustes'} onPress={() => setActiveTab('ajustes')} />
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          {renderTabContent()}
        </View>
      )}
    </SafeAreaView>
  );
}

// COMPONENTS

function TabButton({ title, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.navBtn, active && styles.navBtnActive]}
      onPress={onPress}
    >
      <Text style={[styles.navBtnText, active && styles.navBtnTextActive]}>{title}</Text>
    </TouchableOpacity>
  );
}

function PanelTab({ data, stats, refreshing, onRefresh, onSync, syncing }) {
  // Chart Data Preparation
  // We need to reverse data to show chronological order (left to right) if api returns date desc
  // Taking last 10 points for readability
  const chartDataPoints = useMemo(() => {
    if (data.length === 0) return [0];
    return data.slice(0, 10).reverse().map(d => d.level);
  }, [data]);

  const chartData = {
    labels: [], // No labels to keep it clean, or could add time
    datasets: [
      {
        data: chartDataPoints,
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // primary color
        strokeWidth: 2
      }
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: THEME.card,
    backgroundGradientTo: THEME.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`, // textMuted
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: THEME.primary
    },
    propsForBackgroundLines: {
      stroke: THEME.border
    }
  };

  const screenWidth = Dimensions.get("window").width;

  return (
    <ScrollView
      style={styles.tabContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
    >
      {/* SYNC BUTTON */}
      <TouchableOpacity style={styles.syncBtn} onPress={onSync} disabled={syncing}>
        {syncing ? <ActivityIndicator color="#fff" /> : <Text style={styles.syncBtnText}>🔄 Leer batería de este celular</Text>}
      </TouchableOpacity>

      {/* STATS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estadísticas</Text>
        <View style={styles.statsGrid}>
          <StatBox label="Máximo" value={`${stats.max}%`} />
          <StatBox label="Mínimo" value={`${stats.min}%`} />
          <StatBox label="Promedio" value={`${stats.avg}%`} />
          <StatBox label="Registros" value={stats.count} />
        </View>
      </View>

      {/* CHART HEADER */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Historial de Batería</Text>
        {data.length > 0 ? (
          <View style={{ alignItems: 'center', marginLeft: -20 }}>
            <LineChart
              data={chartData}
              width={screenWidth - 60} // card padding consideration
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 8
              }}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              fromZero={true}
              yAxisSuffix="%"
            />
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={styles.textMuted}>No hay datos suficientes para el gráfico</Text>
          </View>
        )}
      </View>

      {/* RECENT LIST */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Últimos Registros</Text>
        {data.slice(0, 5).map(item => (
          <View key={item.id} style={styles.recordRow}>
            <View>
              <Text style={styles.recordDevice}>{item.device_id || 'Dispositivo'}</Text>
              <Text style={styles.recordDate}>{new Date(item.created_at).toLocaleTimeString()}</Text>
            </View>
            <Text style={styles.recordLevel}>{item.level}%</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function HistorialTab({ data, refreshing, onRefresh }) {
  return (
    <View style={styles.tabContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Historial Completo</Text>
        <FlatList
          data={data}
          keyExtractor={item => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
          renderItem={({ item }) => (
            <View style={styles.recordRow}>
              <View>
                <Text style={styles.recordDevice}>{item.device_id || 'N/A'}</Text>
                <Text style={styles.recordDate}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
              <Text style={[styles.recordLevel, { color: item.level < 20 ? '#ef4444' : THEME.primary }]}>
                {item.level}%
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

function AjustesTab({ settings, toggleSetting }) {
  return (
    <ScrollView style={styles.tabContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Configuración de Aplicación</Text>

        <SettingRow
          icon="🔔"
          label="Notificaciones"
          value={settings.notifications}
          onToggle={() => toggleSetting('notifications')}
        />
        <SettingRow
          icon="🍃"
          label="Modo Ahorro"
          value={settings.lowPower}
          onToggle={() => toggleSetting('lowPower')}
        />
        <SettingRow
          icon="🌙"
          label="No Molestar"
          value={settings.doNotDisturb}
          onToggle={() => toggleSetting('doNotDisturb')}
        />

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>🎨 Tema</Text>
          <Text style={{ color: THEME.textMuted }}>Oscuro (Fijo)</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>⏱️ Intervalo</Text>
          <Text style={{ color: THEME.textMuted }}>30 seg</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function SettingRow({ icon, label, value, onToggle }) {
  return (
    <View style={styles.settingItem}>
      <Text style={styles.settingLabel}>{icon} {label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: THEME.primary }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    paddingTop: 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  refreshBtnText: {
    color: THEME.bg,
    fontWeight: 'bold',
    fontSize: 12,
  },
  nav: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  navBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: THEME.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
  },
  navBtnActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  navBtnText: {
    color: THEME.text,
    fontWeight: '500',
  },
  navBtnTextActive: {
    color: THEME.bg,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 20,
  },
  cardTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1, // takes available space
    minWidth: '45%', // 2 per row
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: THEME.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    color: THEME.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  chartContainer: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: THEME.border,
    borderRadius: 8,
    padding: 10,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    backgroundColor: THEME.primary,
    borderRadius: 4,
    marginBottom: 4,
  },
  barLabel: {
    color: THEME.textMuted,
    fontSize: 10,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  recordDevice: {
    color: THEME.text,
    fontWeight: '600',
    fontSize: 14,
  },
  recordDate: {
    color: THEME.textMuted,
    fontSize: 12,
  },
  recordLevel: {
    color: THEME.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  textMuted: {
    color: THEME.textMuted,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  settingLabel: {
    color: THEME.text,
    fontSize: 16,
  },
  syncBtn: {
    backgroundColor: THEME.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  syncBtnText: {
    color: THEME.bg,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
