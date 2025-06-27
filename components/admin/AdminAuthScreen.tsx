import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AdminsAPI } from '@/lib/api/admins';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ui/ThemedText';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminAuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AdminAuthScreen({ onAuthSuccess }: AdminAuthScreenProps) {
  const [adminId, setAdminId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!adminId || !name) {
      setError('Por favor complete todos los campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const admin = await AdminsAPI.getAdminByCredentials(adminId, name);
      
      if (!admin) {
        setError('Credenciales de administrador incorrectas');
        return;
      }

      await AsyncStorage.setItem('currentAdmin', JSON.stringify(admin));
      await AsyncStorage.setItem('userRole', 'admin');
      onAuthSuccess();
    } catch (error) {
      console.error('Error during admin login:', error);
      setError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.authCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed-outline" size={48} color="#2c3e50" />
        </View>

        <ThemedText variant="title" style={styles.title}>
          Acceso Administrativo
        </ThemedText>

        <ThemedText style={styles.description}>
          Esta área está restringida solo para administradores
        </ThemedText>

        <View style={styles.form}>
          <Input
            label="Código de Administrador"
            value={adminId}
            onChangeText={(text) => {
              setError('');
              setAdminId(text);
            }}
            placeholder="Ej: ADMIN"
            autoCapitalize="characters"
          />

          <Input
            label="Nombre"
            value={name}
            onChangeText={(text) => {
              setError('');
              setName(text);
            }}
            placeholder="Ingrese su nombre"
            autoCapitalize="words"
          />

          {error ? (
            <ThemedText style={styles.error} color="#e74c3c">
              {error}
            </ThemedText>
          ) : null}

          <Button
            title="Ingresar"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.button}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
  },
  authCard: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  error: {
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
  },
});