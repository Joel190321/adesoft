import { StyleSheet, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ui/ThemedText';
import Card from '@/components/ui/Card';
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

export default function AdminDashboard() {
  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentAdmin');
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="title">Panel de Administración</ThemedText>
        <Card
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          <ThemedText style={styles.logoutText} color="#e74c3c">
            Cerrar Sesión
          </ThemedText>
        </Card>
      </View>

      <View style={styles.menuGrid}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff5f5',
  },
  logoutText: {
    marginLeft: 8,
  },
  menuGrid: {
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