import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import CanchaCard from '../../components/CanchaCard'; // Ajusta la ruta si tu componente está en otra carpeta

export default function HomeScreen() {
  const router = useRouter();
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState('Jugador');

  useEffect(() => {
    fetchCanchas();
    obtenerDatosUsuario();
  }, []);

  const obtenerDatosUsuario = async () => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      if (token) {
        const decodedToken: any = jwtDecode(token);
        setNickname(decodedToken.nickname || 'Jugador'); 
      }
    } catch (e) { console.log(e); }
  };

  const fetchCanchas = async () => {
    try {
      const response = await fetch('http://192.168.1.2:3000/api/canchas');
      const data = await response.json();
      setCanchas(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('jwt_token');
      router.replace('/login');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#007bff" style={{marginTop: 50}} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Futbrow!</Text>
          <Text style={styles.headerTitle}>¡Hola, {nickname}!</Text>
          <Text style={styles.headerSubtitle}>Encuentra tu cancha ideal</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={canchas}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }) => <CanchaCard cancha={item} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#fff', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666' },
  logoutBtn: { backgroundColor: '#dc3545', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});