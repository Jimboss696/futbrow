import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
// useLocalSearchParams nos permite atrapar el ID que viene en la URL
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function CanchaDetalleScreen() {
  const { id } = useLocalSearchParams(); // Atrapamos el ID
  const router = useRouter();
  
  const [cancha, setCancha] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCanchaDetalle();
  }, [id]);

  const fetchCanchaDetalle = async () => {
    try {
      // Usamos tu IP local y le pegamos el ID específico al final
      const response = await fetch(`http://192.168.1.2:3000/api/canchas/${id}`);
      const data = await response.json();
      setCancha(data);
      setLoading(false);
    } catch (error) {
      console.error("Error obteniendo detalles:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!cancha) {
    return (
      <View style={styles.center}>
        <Text>Cancha no encontrada.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: cancha.imagen_url }} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.title}>{cancha.nombre}</Text>
        <Text style={styles.address}>📍 {cancha.direccion}</Text>
        
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>{cancha.descripcion}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Precio por hora:</Text>
          <Text style={styles.priceValue}>${cancha.precio_hora}</Text>
        </View>

        {/* Botón flotante para la Fase 4 */}
        <TouchableOpacity 
          style={styles.reserveButton}
          onPress={() => router.push(`/reserva/${id}` as any)}
        >
          <Text style={styles.reserveButtonText}>Agendar Horario</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 10,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  priceLabel: {
    fontSize: 16,
    color: '#333',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  reserveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});