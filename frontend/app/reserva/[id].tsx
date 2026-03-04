import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker from '@react-native-community/datetimepicker';

// Ahora son 24 horas!
const HORARIOS_BASE = Array.from({ length: 24 }, (_, i) => `${i < 10 ? '0' : ''}${i}:00`);

export default function ReservaScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [fechaObj, setFechaObj] = useState(new Date()); 
  const [showPicker, setShowPicker] = useState(false);
  
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [horasSeleccionadas, setHorasSeleccionadas] = useState<string[]>([]);
  
  const [metodoPago, setMetodoPago] = useState('transferencia'); 
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  // 🚨 CORRECCIÓN ARQUITECTÓNICA: Usar hora local en lugar de toISOString() para evitar desfase de días en Ecuador
  const getFechaFormateada = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchDisponibilidad(getFechaFormateada(fechaObj));
    setHorasSeleccionadas([]); 
  }, [fechaObj]);

  const fetchDisponibilidad = async (fechaStr: string) => {
    setLoadingHorarios(true);
    try {
      const response = await fetch(`http://192.168.1.2:3000/api/reservas/disponibilidad/${id}/${fechaStr}`);
      const data = await response.json();
      
      if (response.ok) {
        let ocupadosArr: string[] = [];
        data.forEach((reserva: any) => {
          let inicio = parseInt(reserva.hora_inicio.split(':')[0]);
          let fin = parseInt(reserva.hora_fin.split(':')[0]);
          for(let i = inicio; i < fin; i++) {
            ocupadosArr.push(`${i < 10 ? '0' : ''}${i}:00`);
          }
        });
        setHorariosOcupados(ocupadosArr);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const toggleHora = (hora: string) => {
    if (horasSeleccionadas.includes(hora)) {
      setHorasSeleccionadas(horasSeleccionadas.filter(h => h !== hora).sort());
    } else {
      setHorasSeleccionadas([...horasSeleccionadas, hora].sort());
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios'); 
    if (selectedDate) {
      setFechaObj(selectedDate);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const enviarReserva = async () => {
    if (horasSeleccionadas.length === 0) {
      Alert.alert('Aviso', 'Selecciona al menos una hora.');
      return;
    }

// Verificar que sean consecutivas
    for (let i = 0; i < horasSeleccionadas.length - 1; i++) {
      const actual = parseInt(horasSeleccionadas[i].split(':')[0]);
      const siguiente = parseInt(horasSeleccionadas[i + 1].split(':')[0]);
      if (siguiente !== actual + 1) {
        Alert.alert('Aviso', 'Por favor selecciona bloques de horas consecutivos.');
        return;
      }
    }

    if (metodoPago === 'transferencia' && !imageUri) {
      Alert.alert('Aviso', 'Debes adjuntar el comprobante de transferencia.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      const formData = new FormData();
      
      formData.append('cancha_id', id as string);
      formData.append('fecha_reserva', getFechaFormateada(fechaObj));
      formData.append('hora_inicio', horasSeleccionadas[0]);
      
      const ultimaHora = parseInt(horasSeleccionadas[horasSeleccionadas.length - 1].split(':')[0]);
      const horaFinNum = ultimaHora + 1;
      formData.append('hora_fin', horaFinNum === 24 ? '24:00' : `${horaFinNum < 10 ? '0' : ''}${horaFinNum}:00`);
      
      formData.append('metodo_pago', metodoPago);

      if (metodoPago === 'transferencia' && imageUri) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('comprobante', { uri: imageUri, name: filename || 'comprobante.jpg', type } as any);
      }

      const response = await fetch('http://192.168.1.2:3000/api/reservas', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('¡Éxito!', metodoPago === 'transferencia' ? 'Tu reserva está pendiente de validación.' : 'Reserva guardada. Paga en efectivo al llegar.');
        router.push('/(tabs)');
      } else {
        Alert.alert('Aviso', data.error || 'Ocurrió un problema');
        if (response.status === 409) fetchDisponibilidad(getFechaFormateada(fechaObj));
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No pudimos conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPagar = horasSeleccionadas.length * 5;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Reservar Cancha</Text>
      
      <Text style={styles.sectionTitle}>1. Elige la Fecha</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateButtonText}>📅 {getFechaFormateada(fechaObj)}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={fechaObj}
          mode="date"
          display="default"
          minimumDate={new Date()} 
          onChange={onChangeDate}
        />
      )}

      <Text style={styles.sectionTitle}>2. Elige la Hora (24h)</Text>
      {loadingHorarios ? (
        <ActivityIndicator size="small" color="#007bff" style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.horariosGrid}>
          {HORARIOS_BASE.map((hora) => {
            const isOcupado = horariosOcupados.includes(hora);
            const isSelected = horasSeleccionadas.includes(hora);

            return (
              <TouchableOpacity
                key={hora}
                disabled={isOcupado}
                onPress={() => toggleHora(hora)}
                style={[
                  styles.horaBlock,
                  isOcupado && styles.horaBlockOcupado,
                  isSelected && styles.horaBlockSelected
                ]}
              >
                <Text style={[
                  styles.horaText,
                  isOcupado && styles.horaTextOcupado,
                  isSelected && styles.horaTextSelected
                ]}>
                  {hora}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.sectionTitle}>3. Método de Pago (${totalPagar.toFixed(2)})</Text>
      <View style={styles.pagoContainer}>
        <TouchableOpacity 
          style={[styles.pagoBtn, metodoPago === 'transferencia' && styles.pagoBtnActivo]}
          onPress={() => setMetodoPago('transferencia')}
        >
          <Text style={[styles.pagoBtnText, metodoPago === 'transferencia' && styles.pagoBtnTextActivo]}>🏦 Transferencia</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.pagoBtn, metodoPago === 'efectivo' && styles.pagoBtnActivo]}
          onPress={() => setMetodoPago('efectivo')}
        >
          <Text style={[styles.pagoBtnText, metodoPago === 'efectivo' && styles.pagoBtnTextActivo]}>💵 Efectivo (Local)</Text>
        </TouchableOpacity>
      </View>

      {metodoPago === 'transferencia' && (
        <View style={styles.fotoContainer}>
          <Text style={styles.label}>Sube tu comprobante de pago:</Text>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
            <Text style={styles.imagePickerText}>{imageUri ? 'Cambiar Imagen' : '📸 Seleccionar de la Galería'}</Text>
          </TouchableOpacity>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}
        </View>
      )}
     
      <TouchableOpacity 
        style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
        onPress={enviarReserva}
        disabled={isSubmitting}
      >
        <Text style={styles.submitBtnText}>{isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#444', marginTop: 10, marginBottom: 15 },
  dateButton: { backgroundColor: '#f0f4f8', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#dce4ec', alignItems: 'center' },
  dateButtonText: { fontSize: 18, fontWeight: 'bold', color: '#007bff' },
  horariosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  horaBlock: { width: '30%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#007bff', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  horaBlockOcupado: { backgroundColor: '#e9ecef', borderColor: '#e9ecef' },
  horaBlockSelected: { backgroundColor: '#007bff' },
  horaText: { fontSize: 16, fontWeight: 'bold', color: '#007bff' },
  horaTextOcupado: { color: '#adb5bd', textDecorationLine: 'line-through' },
  horaTextSelected: { color: '#fff' },
  pagoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  pagoBtn: { flex: 1, padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  pagoBtnActivo: { backgroundColor: '#28a745', borderColor: '#28a745' },
  pagoBtnText: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  pagoBtnTextActivo: { color: '#fff' },
  infoAlert: { backgroundColor: '#fff3cd', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ffeeba', marginBottom: 20 },
  infoAlertText: { color: '#856404', fontSize: 14, lineHeight: 20 },
  fotoContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#555' },
  imagePickerBtn: { backgroundColor: '#e9ecef', padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ced4da', borderStyle: 'dashed', marginBottom: 10 },
  imagePickerText: { color: '#495057', fontWeight: 'bold' },
  previewImage: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover' },
  submitBtn: { backgroundColor: '#007bff', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitBtnDisabled: { backgroundColor: '#80bdff' },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});