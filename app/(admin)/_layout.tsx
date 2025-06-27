import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { AdminsAPI } from '@/lib/api/admins';
import AdminAuthScreen from '@/components/admin/AdminAuthScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const userRole = await AsyncStorage.getItem('userRole');
      const currentAdmin = await AsyncStorage.getItem('currentAdmin');

      if (!userRole || userRole !== 'admin' || !currentAdmin) {
        router.replace('/(tabs)');
        return;
      }

      // Verify admin exists in database
      const admin = JSON.parse(currentAdmin);
      const adminData = await AdminsAPI.getAdminByCredentials(admin.id, admin.name);
      
      if (!adminData) {
        await AsyncStorage.removeItem('currentAdmin');
        await AsyncStorage.removeItem('userRole');
        router.replace('/');
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error checking admin auth:', error);
      router.replace('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <AdminAuthScreen onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2c3e50' },
        headerTintColor: '#fff',
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Panel de Administración',
        }}
      />
      <Stack.Screen
        name="inventory"
        options={{
          title: 'Gestión de Inventario',
        }}
      />
      <Stack.Screen
        name="vendors"
        options={{
          title: 'Gestión de Vendedores',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Configuración',
        }}
      />
    </Stack>
  );
}