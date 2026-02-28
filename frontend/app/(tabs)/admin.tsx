import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Alert, SafeAreaView } from 'react-native';
// CORRECCIÓN: Importamos useFocusEffect desde su origen correcto en versiones modernas
import { useFocusEffect } from '@react-navigation/native';

export default function AdminDashboardScreen() {
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservas = async () => {
    try {
      const response = await fetch('http://192.168.1.2:3000/api/reservas');
      const data = await response.json();
      setReservas(data);
      setLoading(false);
    } catch (error) {
      console.error("Error obteniendo reservas:", error);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchReservas();
    }, [])
  );

  const actualizarEstado = async (id: number, nuevoEstado: string) => {
    try {
      const response = await fetch(`http://192.168.1.2:3000/api/reservas/${id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado_pago: nuevoEstado }),
      });

      if (response.ok) {
        Alert.alert('Éxito', `Reserva marcada como ${nuevoEstado}`);
        fetchReservas();
      } else {
        Alert.alert('Error', 'No se pudo actualizar la reserva');
      }
    } catch (error) {
      console.error("Error actualizando estado:", error);
      Alert.alert('Error', 'Fallo de conexión con el servidor');
    }
  };

  const renderReserva = ({ item }: { item: any }) => {
    let badgeColor = '#ffc107'; 
    if (item.estado_pago === 'validado') badgeColor = '#28a745'; 
    if (item.estado_pago === 'rechazado') badgeColor = '#dc3545'; 

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.canchaName}>{item.cancha_nombre}</Text>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{item.estado_pago.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Cliente:</Text>
          <Text style={styles.value}>{item.usuario_nombre}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Fecha:</Text>
          <Text style={styles.value}>{new Date(item.fecha_reserva).toLocaleDateString()}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Horario:</Text>
          <Text style={styles.value}>{item.hora_inicio} - {item.hora_fin}</Text>
        </View>

        <Text style={styles.sectionTitle}>Comprobante adjunto:</Text>
        <Image 
          source={{ uri: `http://192.168.1.2:3000${item.comprobante_url}` }} 
          style={styles.comprobanteImage} 
        />

        {item.estado_pago === 'pendiente' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnReject]} 
              onPress={() => actualizarEstado(item.id, 'rechazado')}
            >
              <Text style={styles.btnText}>❌ Rechazar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnValidate]} 
              onPress={() => actualizarEstado(item.id, 'validado')}
            >
              <Text style={styles.btnText}>✅ Validar Pago</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Panel de Control</Text>
      <Text style={styles.headerSubtitle}>Gestión de reservas</Text>

      <FlatList
        data={reservas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReserva}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 50}}>No hay reservas aún.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#333', marginLeft: 20, marginTop: 40 },
  headerSubtitle: { fontSize: 16, color: '#666', marginLeft: 20, marginBottom: 10 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  canchaName: { fontSize: 18, fontWeight: 'bold', color: '#007bff' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  label: { width: 70, fontWeight: 'bold', color: '#555' },
  value: { flex: 1, color: '#333' },
  sectionTitle: { marginTop: 15, marginBottom: 10, fontWeight: 'bold', color: '#555' },
  comprobanteImage: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover', backgroundColor: '#e9ecef', marginBottom: 15 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnReject: { backgroundColor: '#dc3545' },
  btnValidate: { backgroundColor: '#28a745' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});