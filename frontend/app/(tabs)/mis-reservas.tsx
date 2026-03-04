import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

export default function MisReservasScreen() {
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombreCliente, setNombreCliente] = useState('Cliente');

  // Extraemos el nombre del token para que parezca un ticket real
  useEffect(() => {
    const obtenerNombre = async () => {
      const token = await SecureStore.getItemAsync('jwt_token');
      if (token) {
        const decodedToken: any = jwtDecode(token);
        setNombreCliente(decodedToken.nickname || decodedToken.nombre.split(' ')[0]);  // se agrego una parte para cambiar el estado de pago 
      }
    };
    obtenerNombre();
  }, []);

  const fetchMisReservas = async () => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      const response = await fetch('http://192.168.1.2:3000/api/reservas/cliente/mis-reservas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setReservas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMisReservas();
    }, [])
  );

  const renderReserva = ({ item }: { item: any }) => {
    let badgeColor = '#ffc107'; 
    if (item.estado_pago === 'validado') badgeColor = '#28a745'; 
    if (item.estado_pago === 'rechazado') badgeColor = '#dc3545'; 

    // CALCULAMOS EL TOTAL A PAGAR EN LA VISTA DEL CLIENTE
    const inicio = parseInt(item.hora_inicio.split(':')[0]);
    const fin = parseInt(item.hora_fin.split(':')[0]);
    const totalPagar = (fin - inicio) * 5;

    // para cambiar el estado de pago en el menu de cliente
    const isPagado = item.estado_pago === 'validado';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.canchaName}>{item.cancha_nombre}</Text>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{item.estado_pago.toUpperCase()}</Text>
          </View>
        </View>
        
        {/* Agregamos el diseño tipo Ticket */}
        <View style={styles.ticketSection}>
          <Text style={styles.textRow}>👤 A nombre de: <Text style={styles.boldText}>{nombreCliente}</Text></Text>
          <Text style={styles.textRow}>📅 Fecha: <Text style={styles.boldText}>{new Date(item.fecha_reserva).toLocaleDateString()}</Text></Text>
          <Text style={styles.textRow}>⏰ Horario: <Text style={styles.boldText}>{item.hora_inicio} - {item.hora_fin}</Text></Text>
          <Text style={styles.textRow}>💳 Método: <Text style={styles.boldText}>{item.metodo_pago.toUpperCase()}</Text></Text>
        </View>

        <View style={styles.totalSection}>
          <View>
            <Text style={styles.totalText}>{isPagado ? 'Total Pagado:' : 'Total a Pagar:'}</Text>
            {isPagado && <Text style={styles.juegoLimpioText}>⚽ ¡Disfruta del juego limpio!</Text>}
          </View>
          <Text style={styles.totalAmount}>${totalPagar.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#007bff" style={{marginTop: 50}} />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Mis Reservas</Text>
      <FlatList
        data={reservas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReserva}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 50}}>No tienes reservas aún.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#333', marginLeft: 20, marginTop: 40, marginBottom: 10 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: {width: 0, height: 2} },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  canchaName: { fontSize: 18, fontWeight: 'bold', color: '#007bff' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  ticketSection: { marginBottom: 10 },
  textRow: { fontSize: 15, color: '#555', marginBottom: 6 },
  boldText: { fontWeight: 'bold', color: '#333' },
  totalSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: '#ccc' },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  juegoLimpioText: { fontSize: 12, color: '#28a745', fontStyle: 'italic', marginTop: 2, fontWeight: '600' },
  totalAmount: { fontSize: 22, fontWeight: '900', color: '#28a745' }
});