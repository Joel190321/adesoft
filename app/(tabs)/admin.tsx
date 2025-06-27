import { StyleSheet, View, SafeAreaView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ui/ThemedText';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';

const adminMenuItems = [
  {
    title: 'Gestión de Inventario',
    description: 'Administrar productos, categorías y stock',
    icon: <Ionicons name="cube-outline" size={24} color="#3498db" />,
    route: '/admin/inventory',
  },
  {
    title: 'Gestión de Vendedores',
    description: 'Administrar vendedores y permisos',
    icon: <Ionicons name="people-outline" size={24} color="#2ecc71" />,
    route: '/admin/vendors',
  },
  {
    title: 'Configuración',
    description: 'Configuración general de la aplicación',
    icon: <Ionicons name="settings-outline" size={24} color="#9b59b6" />,
    route: '/admin/settings',
  },
];

export default function AdminScreen() {
  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentAdmin');
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <ThemedText variant="title">Panel de Administración</ThemedText>
          ),
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          headerRight: () => (
            <Button
              title="Salir"
              variant="ghost"
              size="small"
              icon={<Ionicons name="log-out-outline" size={18} color="#666" />}
              onPress={handleLogout}
            />
          ),
        }}
      />

      <View style={styles.content}>
        {adminMenuItems.map((item) => (
          <Card
            key={item.title}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            {item.icon}
            <ThemedText variant="subtitle" style={styles.menuTitle}>
              {item.title}
            </ThemedText>
            <ThemedText variant="caption" style={styles.menuDescription}>
              {item.description}
            </ThemedText>
          </Card>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  menuItem: {
    marginBottom: 16,
    padding: 20,
  },
  menuTitle: {
    marginTop: 12,
    marginBottom: 4,
  },
  menuDescription: {
    color: '#666',
  },
});