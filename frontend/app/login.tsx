import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && (!nombre || !telefono))) {
      Alert.alert('Error', 'Por favor llena todos los campos');
      return;
    }

    setIsLoading(true);
    const url = isLogin 
      ? 'http://192.168.1.2:3000/api/auth/login' 
      : 'http://192.168.1.2:3000/api/auth/registro';

    const bodyData = isLogin 
      ? { email, password } 
      : { nombre, email, telefono, password, rol: 'cliente' };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          // Guardamos el token
          await SecureStore.setItemAsync('jwt_token', data.token);
          // Redirigimos al Layout principal
          router.replace('/(tabs)');
        } else {
          Alert.alert('¡Éxito!', 'Cuenta creada. Ahora inicia sesión.');
          setIsLogin(true); 
        }
      } else {
        Alert.alert('Error', data.error || 'Ocurrió un problema');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</Text>
        <Text style={styles.subtitle}>Futbrow! - Tu cancha a un toque</Text>

       {!isLogin && (
          <>
            <TextInput 
              style={styles.input} 
              placeholder="Nombre completo" 
              placeholderTextColor="#999" 
              value={nombre} 
              onChangeText={setNombre} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Teléfono" 
              placeholderTextColor="#999" 
              value={telefono} 
              onChangeText={setTelefono} 
              keyboardType="phone-pad" 
            />
          </>
        )}

        <TextInput 
          style={styles.input} 
          placeholder="Correo electrónico" 
          placeholderTextColor="#999"
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address"
          autoCapitalize="none" 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Contraseña" 
          placeholderTextColor="#999"
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />

        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? 'Cargando...' : (isLogin ? 'Entrar' : 'Registrarse')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
          <Text style={styles.switchText}>
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, marginBottom: 15, fontSize: 16, backgroundColor: '#fafafa' },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#007bff', fontSize: 15, fontWeight: '600' }
});