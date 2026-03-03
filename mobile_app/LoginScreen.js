import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // THEME COLORS (Consistent with App.js)
  const THEME = {
    primary: '#10b981',    // Green for Login
    secondary: '#3b82f6',  // Blue for Sign Up
    bg: '#0f172a',
    card: '#1a1f2e',
    border: '#2d3748',
    text: '#e5e7eb',
    textMuted: '#9ca3af',
    danger: '#ef4444'
  };

  const activeColor = isSignUp ? THEME.secondary : THEME.primary;

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert('Error', 'Por favor ingresa email y contraseña');
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('¡Bienvenido!', 'Usuario creado exitosamente.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      let msg = err.message;
      if (err.code === 'auth/invalid-email') msg = 'Email inválido';
      if (err.code === 'auth/user-not-found') msg = 'Usuario no encontrado';
      if (err.code === 'auth/wrong-password') msg = 'Contraseña incorrecta';
      if (err.code === 'auth/email-already-in-use') msg = 'Este email ya está registrado';
      Alert.alert('Error de Autenticación', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: THEME.bg }]}>
      <View style={[styles.card, { backgroundColor: THEME.card, borderColor: THEME.border }]}>

        {/* TAB SELECTOR */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tab, !isSignUp && { borderBottomColor: THEME.primary, borderBottomWidth: 3 }]}
            onPress={() => setIsSignUp(false)}
          >
            <Text style={[styles.tabText, !isSignUp ? { color: THEME.primary } : { color: THEME.textMuted }]}>
              👤 Entrar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, isSignUp && { borderBottomColor: THEME.secondary, borderBottomWidth: 3 }]}
            onPress={() => setIsSignUp(true)}
          >
            <Text style={[styles.tabText, isSignUp ? { color: THEME.secondary } : { color: THEME.textMuted }]}>
              ✨ Registrarse
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: THEME.text, marginTop: 20 }]}>
          {isSignUp ? 'Crear Cuenta' : 'Bienvenido de nuevo'}
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: THEME.bg, color: THEME.text, borderColor: THEME.border }]}
          placeholder="Email"
          placeholderTextColor={THEME.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 25 }}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: THEME.bg, color: THEME.text, borderColor: THEME.border }]}
            placeholder="Contraseña"
            placeholderTextColor={THEME.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={{ padding: 10, marginLeft: 5 }}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={{ fontSize: 20 }}>{showPassword ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={activeColor} style={{ marginVertical: 20 }} />
        ) : (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: activeColor }]}
            onPress={handleAuth}
          >
            <Text style={[styles.btnText, { color: THEME.bg }]}>
              {isSignUp ? 'Empezar ahora' : 'Ingresar'}
            </Text>
          </TouchableOpacity>
        )}

      </View>
      <Text style={[styles.footerText, { color: THEME.textMuted }]}>
        Mi Progreso v2.5.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 25,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tabSelector: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    fontSize: 16,
  },
  btn: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  btnText: {
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 12,
    opacity: 0.5,
  }
});
