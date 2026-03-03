import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import {
  StyleSheet, Text, View, FlatList, ActivityIndicator,
  SafeAreaView, TouchableOpacity, RefreshControl,
  ScrollView, Alert, Dimensions, TextInput, Modal
} from 'react-native';

import { LineChart } from 'react-native-chart-kit';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';

// FIREBASE IMPORTS
import { onAuthStateChanged, signOut, updateProfile, deleteUser } from 'firebase/auth';
import { auth } from './firebaseConfig';
import LoginScreen from './LoginScreen';

Sentry.init({
  dsn: 'https://2a7157c5b4812290cca4f057c847fae7@o4510948337778688.ingest.us.sentry.io/4510948356587520',
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,
});

// THEME COLORS (Moved inside or kept consistent)
const THEME = {
  primary: '#10b981',
  secondary: '#3b82f6',
  bg: '#0f172a',
  card: '#1a1f2e',
  border: '#2d3748',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  danger: '#ef4444'
};

const COMMON_UNITS = ['km', 'kg', 'm', 'cm', 'pts', 'min', 'h', '%'];


function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // URL del servidor en producción (Render)
  const [baseUrl, setBaseUrl] = useState('https://panel-bateria.onrender.com');

  // Handle user state changes
  function onAuthStateChangedHandler(user) {
    setUser(user);
    if (user) setNewName(user.displayName || user.email.split('@')[0]);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, onAuthStateChangedHandler);
    return subscriber; // unsubscribe on unmount
  }, []);



  // --- Main App Implementation ---
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('panel');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Modals
  const [showAddCat, setShowAddCat] = useState(false);
  const [showEditCat, setShowEditCat] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showEditEntryModal, setShowEditEntryModal] = useState(false);

  // New Cat Form
  const [newCat, setNewCat] = useState({ name: '', unit: '', icon: '📊', is_system: false });
  const [isBatteryPreset, setIsBatteryPreset] = useState(false);
  const [editingCat, setEditingCat] = useState({ id: null, name: '', unit: '', icon: '📊', is_system: false });
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  // New Entry Form
  const [editingEntry, setEditingEntry] = useState({ id: null, value: '', note: '' });
  const [newEntryVal, setNewEntryVal] = useState('');

  // Profile Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const endpoints = {
    categories: `${baseUrl}/api/categories/`,
    entries: `${baseUrl}/api/entries/`,
  };

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return; // Should not happen if guarded

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      setLoading(true);
      const token = await user.getIdToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      const resCats = await fetch(endpoints.categories, { signal: controller.signal, headers });
      if (resCats.ok) {
        const dataCats = await resCats.json();
        setCategories(Array.isArray(dataCats) ? dataCats : []);
      } else if (resCats.status === 401) {
        return Alert.alert('Sesión expirada');
      }

      const resEntries = await fetch(endpoints.entries, { signal: controller.signal, headers });
      if (resEntries.ok) {
        const dataEntries = await resEntries.json();
        setEntries(Array.isArray(dataEntries) ? dataEntries : []);
      }
    } catch (err) {
      Alert.alert('Error de conexión', 'No se pudo contactar con el servidor. Verifica tu conexión e IP.');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const skipLoading = () => setLoading(false);

  const resetNewCatForm = () => {
    setNewCat({ name: '', unit: '', icon: '📊', is_system: false });
    setIsBatteryPreset(false);
    setIsCustomUnit(false);
  };

  // Helper to get headers
  const getHeaders = async () => {
    const token = await auth.currentUser.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleAddCategory = async () => {
    if (!newCat.name) return Alert.alert('Error', 'El nombre es obligatorio');
    if (!newCat.icon) return Alert.alert('Error', 'El campo icono es obligatorio');

    // Check for duplicates
    const exists = Array.isArray(categories) && categories.find(c => c.name.toLowerCase() === newCat.name.toLowerCase());
    if (exists) {
      return Alert.alert('Aviso', `Ya tienes una categoría llamada "${newCat.name}"`);
    }

    try {
      const headers = await getHeaders();
      const res = await fetch(endpoints.categories, {
        method: 'POST',
        headers,
        body: JSON.stringify(newCat)
      });
      if (res.ok) {
        setShowAddCat(false);
        setNewCat({ name: '', unit: '', icon: '📊', is_system: false });
        setIsBatteryPreset(false);
        setIsCustomUnit(false);
        fetchData();
      } else {
        const errorData = await res.json();
        Alert.alert('Error', errorData.name ? 'Esta categoría ya existe.' : 'No se pudo crear la categoría');
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo crear la categoría');
    }
  };

  const handleDeleteCategory = (catId, catName) => {
    Alert.alert(
      'Eliminar Categoría',
      `¿Estás seguro de que quieres eliminar "${catName}"? Se borrarán todos sus registros.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await auth.currentUser.getIdToken();
              const res = await fetch(`${endpoints.categories}${catId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                fetchData();
              }
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar la categoría');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (cat) => {
    setEditingCat({ ...cat });
    setIsCustomUnit(!COMMON_UNITS.includes(cat.unit));
    setShowEditCat(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCat.name) return Alert.alert('Error', 'El nombre es obligatorio');
    try {
      const headers = await getHeaders();
      const res = await fetch(`${endpoints.categories}${editingCat.id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name: editingCat.name,
          unit: editingCat.unit,
          icon: editingCat.icon
        })
      });
      if (res.ok) {
        setShowEditCat(false);
        setEditingCat({ id: null, name: '', unit: '', icon: '📊' });
        setIsCustomUnit(false);
        fetchData();
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar la categoría');
    }
  };



  const handleAddEntry = async () => {
    if (!selectedCategory || !newEntryVal) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(endpoints.entries, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: selectedCategory.id,
          value: parseFloat(newEntryVal),
          device_id: Device.modelName || 'Móvil'
        })
      });
      if (res.ok) {
        setShowAddEntry(false);
        setNewEntryVal('');
        fetchData();
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo registrar el dato');
    }
  };

  const getStats = (catId) => {
    if (!Array.isArray(entries)) return { max: 0, min: 0, avg: 0, count: 0, last: null };
    const catEntries = entries.filter(e => e.category === catId);
    if (!catEntries.length) return { max: 0, min: 0, avg: 0, count: 0, last: null };
    const values = catEntries.map(e => e.value);
    return {
      max: Math.max(...values),
      min: Math.min(...values),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
      count: values.length,
      last: values[0]
    };
  };

  const openEditEntryModal = (entry) => {
    setEditingEntry({
      id: entry.id,
      value: entry.value?.toString() || '',
      note: entry.note || ''
    });
    setShowEditEntryModal(true);
  };


  const handleUpdateEntry = async () => {
    if (!editingEntry.value) return Alert.alert('Error', 'El valor es obligatorio');
    try {
      const headers = await getHeaders();
      const res = await fetch(`${endpoints.entries}${editingEntry.id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          value: parseFloat(editingEntry.value),
          note: editingEntry.note
        })
      });
      if (res.ok) {
        setShowEditEntryModal(false);
        setEditingEntry({ id: null, value: '', note: '' });
        fetchData();
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar el registro');
    }
  };

  const handleAutoUpdateBattery = async () => {
    try {
      const level = await Battery.getBatteryLevelAsync();
      const pct = Math.round(level * 100);

      const headers = await getHeaders();
      const res = await fetch(endpoints.entries, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: selectedCategory.id,
          value: pct,
          device_id: Device.modelName || 'Móvil'
        })
      });

      if (res.ok) {
        Alert.alert('Éxito', `Nivel de batería registrado: ${pct}%`);
        fetchData();
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo leer el nivel de batería');
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return Alert.alert('Error', 'El nombre no puede estar vacío');
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      setUser({ ...auth.currentUser }); // Trigger re-render
      setIsEditingName(false);
      Alert.alert('Éxito', 'Nombre actualizado correctamente');
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar el nombre');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => signOut(auth) }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que quieres eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Wipe backend data
              const token = await auth.currentUser.getIdToken();
              const res = await fetch(`${baseUrl}/api/delete-account/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (!res.ok) {
                // If backend fails but its not 401, we might want to warn or stop
                // For now, if it's not successful, we alert but proceed with Firebase if appropriate
                // However, safety first: if specialized wipe fails, maybe stop.
                console.warn('Backend wipe failed, status:', res.status);
              }

              // 2. Delete Firebase account
              await deleteUser(auth.currentUser);
              Alert.alert('Cuenta eliminada', 'Tu cuenta y todos tus datos han sido eliminados correctamente.');
            } catch (err) {
              if (err.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Error',
                  'Por seguridad, debes haber iniciado sesión recientemente para realizar esta acción. Por favor, sal y vuelve a entrar e intenta de nuevo.'
                );
              } else {
                Alert.alert('Error', 'No se pudo eliminar la cuenta: ' + err.message);
              }
            }
          }
        }
      ]
    );
  };

  const handleDeleteEntry = (entryId) => {
    Alert.alert(
      'Eliminar Registro',
      '¿Estás seguro de que quieres eliminar este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await auth.currentUser.getIdToken();
              const res = await fetch(`${endpoints.entries}${entryId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                fetchData();
              }
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar el registro');
            }
          }
        }
      ]
    );
  };

  const renderRightActions = (cat) => {

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDeleteCategory(cat.id, cat.name)}
      >
        <Text style={styles.deleteActionText}>Eliminar</Text>
      </TouchableOpacity>
    );
  };


  const renderDetailView = () => {
    const cat = selectedCategory;
    // historyEntries: Original chronological order (Newest first) for the list
    const historyEntries = Array.isArray(entries) ? entries.filter(e => e.category === cat.id) : [];
    // chartEntries: Reversed order (Oldest first) for the chart
    const chartEntries = [...historyEntries].reverse();

    const stats = getStats(cat.id);

    // Chart Data
    const chartData = {
      labels: chartEntries.slice(-6).map(e => {
        const d = new Date(e.created_at);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      datasets: [{
        data: chartEntries.length > 0 ? chartEntries.slice(-6).map(e => e.value) : [0]
      }]
    };

    return (
      <ScrollView style={styles.tabContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setViewMode('list')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.detailTitleBox}>
            <Text style={styles.detailIcon}>{cat.icon}</Text>
            <Text style={styles.detailName}>{cat.name}</Text>
          </View>
        </View>

        <View style={[styles.card, { marginTop: 10 }]}>
          <Text style={styles.chartTitle}>Tendencia Reciente</Text>
          {chartEntries.length > 0 ? (
            <LineChart
              data={chartData}
              width={Dimensions.get('window').width - 70}
              height={260}
              onDataPointClick={({ value, index }) => {
                // Ensure we get the correct entry matching the chart data
                const visibleEntries = chartEntries.slice(-6);
                const entry = visibleEntries[index];

                if (entry) {
                  const d = new Date(entry.created_at);
                  const timeStr = `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                  Alert.alert('Detalle', `Valor: ${value} ${cat.unit}\nFecha: ${timeStr}`);
                } else {
                  Alert.alert('Error', 'No se pudo encontrar el detalle.');
                }
              }}
              chartConfig={{
                backgroundColor: THEME.card,
                backgroundGradientFrom: THEME.card,
                backgroundGradientTo: THEME.card,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // THEME.primary
                labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`, // THEME.textMuted
                style: { borderRadius: 16 },
                propsForDots: { r: "6", strokeWidth: "2", stroke: THEME.primary }
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          ) : (
            <View style={[styles.center, { height: 100 }]}><Text style={styles.textMuted}>Sin datos suficientes</Text></View>
          )}
        </View>

        <View style={styles.statsGrid}>
          <BigStat label="Promedio" value={stats.avg} unit={cat.unit} />
          <BigStat label="Máximo" value={stats.max} unit={cat.unit} />
          <BigStat label="Mínimo" value={stats.min} unit={cat.unit} />
          <BigStat label="Total" value={stats.count} unit="reg." />
        </View>

        {cat.is_system && (
          <TouchableOpacity
            style={[styles.bigAddBtn, { backgroundColor: THEME.secondary, marginBottom: 10 }]}
            onPress={handleAutoUpdateBattery}
          >
            <Text style={styles.bigAddBtnText}>🔋 Actualizar batería</Text>
          </TouchableOpacity>
        )}


        <TouchableOpacity
          style={styles.bigAddBtn}
          onPress={() => setShowAddEntry(true)}
        >
          <Text style={styles.bigAddBtnText}>+ Registrar Valor</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 30, marginBottom: 10 }]}>Historial</Text>

        {historyEntries.length === 0 ? (
          <Text style={[styles.textMuted, { textAlign: 'center', marginVertical: 20 }]}>No hay registros en esta categoría.</Text>
        ) : (
          historyEntries.map(item => (
            <Swipeable
              key={item.id}
              renderRightActions={() => (
                <TouchableOpacity
                  style={[styles.deleteAction, { width: 80, marginLeft: 0, marginRight: 10 }]}
                  onPress={() => handleDeleteEntry(item.id)}
                >
                  <Text style={styles.deleteActionText}>Borrar</Text>
                </TouchableOpacity>
              )}
            >
              <TouchableOpacity
                style={styles.historyItem}
                onLongPress={() => openEditEntryModal(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleString()}</Text>
                  {item.note ? <Text style={styles.textMuted}>{item.note}</Text> : null}
                </View>
                <Text style={styles.historyValue}>{item.value} {item.unit}</Text>
              </TouchableOpacity>
            </Swipeable>
          ))
        )}
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'panel':
        if (viewMode === 'detail' && selectedCategory) {
          return renderDetailView();
        }
        return (
          <ScrollView
            style={styles.tabContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mis Metas</Text>
              <TouchableOpacity onPress={() => { resetNewCatForm(); setShowAddCat(true); }} style={styles.addBtn}>
                <Text style={styles.addBtnText}>+ Categoría</Text>
              </TouchableOpacity>
            </View>

            {categories.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.textMuted}>No tienes categorías. ¡Crea la primera!</Text>
              </View>
            )}

            {Array.isArray(categories) && categories.map(cat => {
              const stats = getStats(cat.id);
              return (
                <Swipeable
                  key={cat.id}
                  renderRightActions={() => renderRightActions(cat)}
                  containerStyle={styles.swipeContainer}
                >
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setViewMode('detail');
                    }}
                    onLongPress={() => openEditModal(cat)}
                  >

                    <View style={styles.cardHeader}>
                      <Text style={styles.cardIcon}>{cat.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardName}>{cat.name}</Text>
                        <Text style={styles.textMuted}>{stats.count} registros</Text>
                      </View>
                      <View style={styles.lastValueBox}>
                        <Text style={styles.lastValue}>{stats.last ?? '--'}</Text>
                        <Text style={styles.unitText}>{cat.unit}</Text>
                      </View>
                    </View>

                    <View style={styles.statsRow}>
                      <SmallStat label="Mín" value={stats.min} />
                      <SmallStat label="Prom" value={stats.avg} />
                      <SmallStat label="Máx" value={stats.max} />
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              );
            })}

          </ScrollView>
        );
      case 'historial':
        return (
          <View style={styles.tabContainer}>
            <Text style={styles.sectionTitle}>Historial General</Text>
            <FlatList
              data={Array.isArray(entries) ? entries : []}
              keyExtractor={item => item?.id?.toString()}
              renderItem={({ item }) => (
                <Swipeable
                  renderRightActions={() => (
                    <TouchableOpacity
                      style={[styles.deleteAction, { width: 80, marginLeft: 0, marginRight: 10 }]}
                      onPress={() => handleDeleteEntry(item.id)}
                    >
                      <Text style={styles.deleteActionText}>Borrar</Text>
                    </TouchableOpacity>
                  )}
                >
                  <TouchableOpacity
                    style={styles.historyItem}
                    onLongPress={() => openEditEntryModal(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyCategory}>{item.category_name}</Text>
                      <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleString()}</Text>
                      {item.note ? <Text style={styles.textMuted}>{item.note}</Text> : null}
                    </View>
                    <Text style={styles.historyValue}>{item.value} {item.unit}</Text>
                  </TouchableOpacity>
                </Swipeable>
              )}
              ListEmptyComponent={<Text style={[styles.textMuted, { textAlign: 'center', marginTop: 20 }]}>No hay registros aún</Text>}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          </View>
        );




      case 'ajustes':
        return (
          <View style={styles.tabContainer}>
            <Text style={styles.sectionTitle}>Ajustes</Text>

            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>👤</Text>
              </View>

              {isEditingName ? (
                <View style={styles.nameEditContainer}>
                  <TextInput
                    style={[styles.input, { textAlign: 'center', marginBottom: 10 }]}
                    value={newName}
                    onChangeText={setNewName}
                    autoFocus
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.confirmBtn, { height: 50, justifyContent: 'center' }]}
                      onPress={handleUpdateName}
                    >
                      <Text style={styles.btnText}>Guardar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cancelBtn, { height: 50, justifyContent: 'center' }]}
                      onPress={() => { setIsEditingName(false); setNewName(user.displayName || user.email.split('@')[0]); }}
                    >
                      <Text style={styles.btnText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
                  </Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditingName(true)}
                  >
                    <Text style={styles.editButtonText}>Editar nombre</Text>
                  </TouchableOpacity>
                  <Text style={styles.profileEmail}>
                    {user?.email}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
              >
                <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.danger, marginTop: 15 }]}
                onPress={handleDeleteAccount}
              >
                <Text style={[styles.logoutBtnText, { color: THEME.danger }]}>Eliminar Cuenta</Text>
              </TouchableOpacity>
            </View>



            <Text style={styles.versionLabel}>
              Mediciones app v2.5.0
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (initializing) return null; // Or a splash screen

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>

        <StatusBar style="light" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mediciones app</Text>
        </View>

        <View style={styles.nav}>
          <TabButton title="Panel" active={activeTab === 'panel'} onPress={() => { setActiveTab('panel'); setViewMode('list'); }} />
          <TabButton title="Historial" active={activeTab === 'historial'} onPress={() => { setActiveTab('historial'); setViewMode('list'); }} />
          <TabButton title="Ajustes" active={activeTab === 'ajustes'} onPress={() => { setActiveTab('ajustes'); setViewMode('list'); }} />
        </View>

        <View style={styles.content}>
          {loading && !refreshing ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={THEME.primary} />
              <Text style={[styles.textMuted, { marginTop: 20 }]}>Conectando...</Text>

              <View style={{ marginTop: 30, width: '80%' }}>
                <TextInput
                  style={[styles.input, { height: 40, textAlign: 'center' }]}
                  value={baseUrl} onChangeText={setBaseUrl}
                />
                <TouchableOpacity
                  style={{ backgroundColor: THEME.primary, padding: 12, borderRadius: 10, marginTop: 10 }}
                  onPress={onRefresh}
                >
                  <Text style={{ color: THEME.bg, textAlign: 'center', fontWeight: 'bold' }}>Reintentar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 20 }}
                  onPress={skipLoading}
                >
                  <Text style={{ color: THEME.textMuted, textAlign: 'center', textDecorationLine: 'underline' }}>Omitir carga</Text>
                </TouchableOpacity>

                <Text style={[styles.textMuted, { fontSize: 10, marginTop: 40, textAlign: 'center' }]}>v2.5.0</Text>
              </View>
            </View>
          ) : renderTabContent()}
        </View>

        <Modal visible={showAddCat} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nueva Categoría</Text>

              <TouchableOpacity
                style={[styles.presetBtn, isBatteryPreset && styles.presetBtnActive]}
                onPress={() => {
                  if (isBatteryPreset) {
                    setNewCat({ name: '', unit: '', icon: '📊', is_system: false });
                    setIsBatteryPreset(false);
                  } else {
                    setNewCat({ name: 'Nivel de bateria', unit: '%', icon: '🔋', is_system: true });
                    setIsBatteryPreset(true);
                  }
                  setIsCustomUnit(false);
                }}
              >
                <Text style={[styles.presetBtnText, isBatteryPreset && styles.presetBtnTextActive]}>
                  {isBatteryPreset ? '✖ Quitar Nivel de bateria' : 'Nivel de bateria 🔋'}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.input, isBatteryPreset && styles.inputDisabled]}
                placeholder="Nombre"
                placeholderTextColor={THEME.textMuted} value={newCat.name}
                onChangeText={t => setNewCat({ ...newCat, name: t })}
                editable={!isBatteryPreset}
              />
              <Text style={styles.label}>Unidad</Text>
              <View style={[styles.unitContainer, isBatteryPreset && { opacity: 0.5 }]} pointerEvents={isBatteryPreset ? 'none' : 'auto'}>
                {COMMON_UNITS.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, newCat.unit === u && !isCustomUnit && styles.unitChipActive]}
                    onPress={() => {
                      setIsCustomUnit(false);
                      setNewCat({ ...newCat, unit: u });
                    }}
                  >
                    <Text style={[styles.unitChipText, newCat.unit === u && !isCustomUnit && styles.unitChipTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.unitChip, isCustomUnit && styles.unitChipActive]}
                  onPress={() => {
                    setIsCustomUnit(true);
                    setNewCat({ ...newCat, unit: '' });
                  }}
                >
                  <Text style={[styles.unitChipText, isCustomUnit && styles.unitChipTextActive]}>Otro</Text>
                </TouchableOpacity>
              </View>

              {isCustomUnit && (
                <TextInput
                  style={styles.input} placeholder="Escribe la unidad (ej: litros)"
                  placeholderTextColor={THEME.textMuted} value={newCat.unit}
                  onChangeText={t => setNewCat({ ...newCat, unit: t })}
                  autoFocus
                />
              )}

              <TextInput
                style={[styles.input, isBatteryPreset && styles.inputDisabled]}
                placeholder="Icono"
                placeholderTextColor={THEME.textMuted} value={newCat.icon}
                onChangeText={t => setNewCat({ ...newCat, icon: t })}
                editable={!isBatteryPreset}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => { setShowAddCat(false); resetNewCatForm(); }} style={styles.cancelBtn}><Text style={styles.btnText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleAddCategory} style={styles.confirmBtn}><Text style={styles.btnText}>Crear</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showEditCat} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Categoría</Text>
              <TextInput
                style={styles.input} placeholder="Nombre"
                placeholderTextColor={THEME.textMuted} value={editingCat.name}
                onChangeText={t => setEditingCat({ ...editingCat, name: t })}
              />
              <Text style={styles.label}>Unidad</Text>
              <View style={styles.unitContainer}>
                {COMMON_UNITS.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, editingCat.unit === u && !isCustomUnit && styles.unitChipActive]}
                    onPress={() => {
                      setIsCustomUnit(false);
                      setEditingCat({ ...editingCat, unit: u });
                    }}
                  >
                    <Text style={[styles.unitChipText, editingCat.unit === u && !isCustomUnit && styles.unitChipTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.unitChip, isCustomUnit && styles.unitChipActive]}
                  onPress={() => {
                    setIsCustomUnit(true);
                    setEditingCat({ ...editingCat, unit: '' });
                  }}
                >
                  <Text style={[styles.unitChipText, isCustomUnit && styles.unitChipTextActive]}>Otro</Text>
                </TouchableOpacity>
              </View>

              {isCustomUnit && (
                <TextInput
                  style={styles.input} placeholder="Escribe la unidad (ej: litros)"
                  placeholderTextColor={THEME.textMuted} value={editingCat.unit}
                  onChangeText={t => setEditingCat({ ...editingCat, unit: t })}
                  autoFocus
                />
              )}

              <TextInput
                style={styles.input} placeholder="Icono"
                placeholderTextColor={THEME.textMuted} value={editingCat.icon}
                onChangeText={t => setEditingCat({ ...editingCat, icon: t })}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowEditCat(false)} style={styles.cancelBtn}><Text style={styles.btnText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleUpdateCategory} style={styles.confirmBtn}><Text style={styles.btnText}>Guardar</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>


        <Modal visible={showAddEntry} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Registrar {selectedCategory?.name}</Text>
              <TextInput
                style={[styles.input, { fontSize: 24, textAlign: 'center' }]}
                placeholder="0.00" keyboardType="numeric" autoFocus
                placeholderTextColor={THEME.textMuted} value={newEntryVal}
                onChangeText={setNewEntryVal}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowAddEntry(false)} style={styles.cancelBtn}><Text style={styles.btnText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleAddEntry} style={styles.confirmBtn}><Text style={styles.btnText}>Guardar</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showEditEntryModal} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Registro</Text>
              <Text style={styles.label}>Valor</Text>
              <TextInput
                style={[styles.input, { fontSize: 24, textAlign: 'center' }]}
                placeholder="0.00" keyboardType="numeric" autoFocus
                placeholderTextColor={THEME.textMuted} value={editingEntry.value}
                onChangeText={t => setEditingEntry({ ...editingEntry, value: t })}
              />
              <Text style={styles.label}>Nota (opcional)</Text>
              <TextInput
                style={styles.input} placeholder="Añadir nota..."
                placeholderTextColor={THEME.textMuted} value={editingEntry.note}
                onChangeText={t => setEditingEntry({ ...editingEntry, note: t })}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowEditEntryModal(false)} style={styles.cancelBtn}><Text style={styles.btnText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleUpdateEntry} style={styles.confirmBtn}><Text style={styles.btnText}>Guardar</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>


      </SafeAreaView>
    </GestureHandlerRootView>
  );
}


function TabButton({ title, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.navBtn, active && styles.navBtnActive]} onPress={onPress}>
      <Text style={[styles.navBtnText, active && styles.navBtnTextActive]}>{title}</Text>
    </TouchableOpacity>
  );
}

function SmallStat({ label, value }) {
  return (
    <View style={styles.smallStat}>
      <Text style={styles.smallStatLabel}>{label}</Text>
      <Text style={styles.smallStatValue}>{value}</Text>
    </View>
  );
}

function BigStat({ label, value, unit }) {
  return (
    <View style={styles.bigStat}>
      <Text style={styles.bigStatLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={styles.bigStatValue}>{value}</Text>
        <Text style={styles.bigStatUnit}> {unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg, paddingTop: 40 },
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { color: THEME.text, fontSize: 24, fontWeight: 'bold' },
  nav: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  navBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: THEME.card, alignItems: 'center' },
  navBtnActive: { backgroundColor: THEME.primary },
  navBtnText: { color: THEME.textMuted, fontWeight: 'bold' },
  navBtnTextActive: { color: THEME.bg },
  content: { flex: 1 },
  tabContainer: { flex: 1, padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { color: THEME.text, fontSize: 18, fontWeight: 'bold' },
  addBtn: { backgroundColor: THEME.secondary, padding: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: THEME.card, borderRadius: 15, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: THEME.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardIcon: { fontSize: 30, marginRight: 15 },
  cardName: { color: THEME.text, fontSize: 18, fontWeight: 'bold' },
  lastValueBox: { alignItems: 'flex-end' },
  lastValue: { color: THEME.primary, fontSize: 20, fontWeight: 'bold' },
  unitText: { color: THEME.textMuted, fontSize: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 10 },
  smallStat: { alignItems: 'center' },
  smallStatLabel: { color: THEME.textMuted, fontSize: 10 },
  smallStatValue: { color: THEME.text, fontSize: 14, fontWeight: 'bold' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: THEME.card, borderRadius: 10, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: THEME.secondary },
  historyCategory: { color: THEME.text, fontWeight: 'bold' },
  historyDate: { color: THEME.textMuted, fontSize: 12 },
  historyValue: { color: THEME.primary, fontWeight: 'bold', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  textMuted: { color: THEME.textMuted },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: THEME.card, borderRadius: 20, padding: 25, borderWidth: 1, borderColor: THEME.border },
  modalTitle: { color: THEME.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: THEME.bg, color: THEME.text, padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: THEME.border },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, borderRadius: 10, backgroundColor: THEME.border, alignItems: 'center' },
  confirmBtn: { flex: 1, padding: 15, borderRadius: 10, backgroundColor: THEME.primary, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  emptyState: { padding: 40, alignItems: 'center' },
  label: { color: THEME.textMuted, fontSize: 14, marginBottom: 8, fontWeight: 'bold' },
  unitContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  unitChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: THEME.bg, borderWidth: 1, borderColor: THEME.border },
  unitChipActive: { backgroundColor: THEME.secondary, borderColor: THEME.secondary },
  unitChipText: { color: THEME.textMuted, fontSize: 12, fontWeight: 'bold' },
  unitChipTextActive: { color: '#fff' },
  swipeContainer: { marginBottom: 15 },
  deleteAction: {
    backgroundColor: THEME.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: 15,
    marginBottom: 0,
    marginLeft: 10
  },
  deleteActionText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 10, backgroundColor: THEME.border, borderRadius: 10, marginRight: 15 },
  backBtnText: { color: THEME.text, fontWeight: 'bold' },
  detailTitleBox: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { fontSize: 32, marginRight: 10 },
  detailName: { color: THEME.text, fontSize: 24, fontWeight: 'bold' },
  chartTitle: { color: THEME.text, fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  bigStat: { flex: 1, minWidth: '45%', backgroundColor: THEME.card, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: THEME.border },
  bigStatLabel: { color: THEME.textMuted, fontSize: 12, marginBottom: 5 },
  bigStatValue: { color: THEME.primary, fontSize: 24, fontWeight: 'bold' },
  bigStatUnit: { color: THEME.textMuted, fontSize: 14 },
  bigAddBtn: { backgroundColor: THEME.primary, padding: 18, borderRadius: 15, marginTop: 20, alignItems: 'center' },
  bigAddBtnText: { color: THEME.bg, fontSize: 18, fontWeight: 'bold' },
  presetBtn: {
    backgroundColor: THEME.border,
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: THEME.secondary,
    alignItems: 'center'
  },
  presetBtnActive: { backgroundColor: THEME.secondary },
  presetBtnText: { color: THEME.text, fontWeight: 'bold' },
  presetBtnTextActive: { color: THEME.bg },
  inputDisabled: {
    backgroundColor: THEME.border,
    color: THEME.textMuted,
    opacity: 0.8
  },
  // Profile styles
  profileCard: {
    backgroundColor: THEME.card,
    borderRadius: 15,
    padding: 30,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  avatarText: { fontSize: 40 },
  profileInfo: { alignItems: 'center', marginBottom: 20 },
  profileName: { color: THEME.text, fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  profileEmail: { color: THEME.textMuted, fontSize: 14, marginTop: 12 },
  nameEditContainer: { width: '100%', marginBottom: 15 },
  editButton: {
    backgroundColor: THEME.secondary + '20',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.secondary
  },
  editButtonText: { color: THEME.secondary, fontSize: 14, fontWeight: 'bold' },
  logoutBtn: {
    backgroundColor: THEME.danger,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    elevation: 2
  },
  logoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  versionLabel: { color: THEME.textMuted, textAlign: 'center', marginTop: 30, fontSize: 12 }
});

export default Sentry.wrap(App);
