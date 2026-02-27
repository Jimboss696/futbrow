import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
// Importamos nuestro nuevo componente
import CanchaCard from '../../components/CanchaCard';

export default function HomeScreen() {
  // Estados para manejar los datos y la pantalla de carga
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect ejecuta esta función automáticamente al abrir la pantalla
  useEffect(() => {
    fetchCanchas();
  }, []);

  const fetchCanchas = async () => {
    try {
      // Usamos tu IP local para conectar con el backend
      const response = await fetch('http://192.168.1.2:3000/api/canchas');
      const data = await response.json();
      
      // Guardamos los datos y quitamos el estado de carga
      setCanchas(data);
      setLoading(false);
    } catch (error) {
      console.error("Error conectando al backend:", error);
      setLoading(false);
    }
  };

  // Si está cargando, mostramos un spinner
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Cargando canchas...</Text>
      </View>
    );
  }

  return (
    // SafeAreaView evita que la UI choque con el notch o la barra de estado del celular
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Futbrow!</Text>
        <Text style={styles.headerSubtitle}>Encuentra tu cancha ideal</Text>
      </View>

      <FlatList
        data={canchas}
        keyExtractor={(item) => item.id.toString()}
        // renderItem define cómo se dibuja cada elemento de la lista
        renderItem={({ item }) => <CanchaCard cancha={item} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#007bff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
});