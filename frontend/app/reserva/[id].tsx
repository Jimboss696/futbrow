import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
// Importamos el recolector de imágenes de Expo
import * as ImagePicker from 'expo-image-picker';

export default function ReservaScreen() {
  const { id } = useLocalSearchParams(); // Este es el ID de la cancha
  const router = useRouter();

  // Estados del formulario
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función para abrir la galería
  const pickImage = async () => {
    // Pedimos permiso y abrimos la galería
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7, // Comprimimos un poco la imagen para no saturar tu servidor
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Función para enviar todo al backend
  const enviarReserva = async () => {
    // Validaciones básicas del lado del cliente
    if (!fecha || !horaInicio || !horaFin || !imageUri) {
      Alert.alert('Error', 'Por favor llena todos los campos y adjunta tu comprobante.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Usamos FormData para empaquetar textos y la imagen juntos
      const formData = new FormData();
      formData.append('cancha_id', id as string);
      formData.append('fecha_reserva', fecha);
      formData.append('hora_inicio', horaInicio);
      formData.append('hora_fin', horaFin);
      
      // Magia de React Native: Así se adjunta un archivo en FormData
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;
      
      formData.append('comprobante', {
        uri: imageUri,
        name: filename || 'comprobante.jpg',
        type: type,
      } as any);

      // Hacemos el POST a tu IP local
      const response = await fetch('http://192.168.1.2:3000/api/reservas', {
        method: 'POST',
        body: formData,
        // OJO: No enviamos headers de 'Content-Type'. fetch lo calcula automáticamente al usar FormData
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('¡Éxito!', 'Tu reserva está pendiente de validación.');
        router.push('/'); // Volvemos al inicio
      } else {
        // Aquí atraparemos si intentan reservar a las 08:00 o 23:00
        Alert.alert('Aviso', data.error || 'Ocurrió un problema');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No pudimos conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Completar Reserva</Text>
      <Text style={styles.subtitle}>Cancha #{id}</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Fecha (YYYY-MM-DD):</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej: 2026-03-05" 
          value={fecha}
          onChangeText={setFecha}
        />

        <Text style={styles.label}>Hora de Inicio (HH:MM):</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej: 14:00" 
          value={horaInicio}
          onChangeText={setHoraInicio}
        />

        <Text style={styles.label}>Hora de Fin (HH:MM):</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej: 15:00" 
          value={horaFin}
          onChangeText={setHoraFin}
        />

        <Text style={styles.label}>Comprobante de Transferencia ($5.00):</Text>
        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
          <Text style={styles.imagePickerText}>
            {imageUri ? 'Cambiar Imagen' : '📸 Seleccionar de la Galería'}
          </Text>
        </TouchableOpacity>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        )}

        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
          onPress={enviarReserva}
          disabled={isSubmitting}
        >
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Enviando...' : 'Confirmar Reserva'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  form: { marginTop: 10 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  imagePickerBtn: { backgroundColor: '#e9ecef', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#ced4da', borderStyle: 'dashed' },
  imagePickerText: { color: '#495057', fontWeight: 'bold' },
  previewImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 20, resizeMode: 'cover' },
  submitBtn: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#8bd39c' },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});