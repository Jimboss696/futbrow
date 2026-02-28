import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { ActivityIndicator, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkTokenAndRole();
  }, []);

  const checkTokenAndRole = async () => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      
      if (!token) {
        // SI NO HAY TOKEN, LO MANDAMOS A INICIAR SESIÓN INMEDIATAMENTE
        router.replace('/login');
        return;
      }

      // Si hay token, vemos si es admin para mostrarle la pestaña extra
      const decodedToken: any = jwtDecode(token);
      if (decodedToken.rol === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error leyendo el token", error);
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  } 

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007bff' }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Canchas',
          headerShown: false 
        }} 
      />
      <Tabs.Screen 
        name="admin" 
        options={{ 
          title: 'Panel',
          headerShown: false,
          href: isAdmin ? '/admin' : null, // Magia: Oculta la pestaña si no es admin
        }} 
      />
    </Tabs>
  );
}