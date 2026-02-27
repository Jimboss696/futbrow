import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface CanchaProps {
  cancha: {
    id: number;
    nombre: string;
    direccion: string;
    precio_hora: string;
    imagen_url: string;
  };
}

export default function CanchaCard({ cancha }: CanchaProps) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => router.push(`/cancha/${cancha.id}`)}
    >
      <Image source={{ uri: cancha.imagen_url }} style={styles.image} />
      
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{cancha.nombre}</Text>
        <Text style={styles.address}>📍 {cancha.direccion}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.price}>${cancha.precio_hora} / hora</Text>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Ver Detalles</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#e1e4e8', // Un color gris por si la imagen de unsplash falla
  },
  infoContainer: {
    padding: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});