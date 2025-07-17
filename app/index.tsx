import { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, ImageBackground, Platform } from 'react-native';
import { router } from 'expo-router';
import { VendorsAPI } from '@/lib/api/vendors';
import { Ionicons } from '@expo/vector-icons';
import { Surface, TextInput, Button, Text, Portal, Dialog } from 'react-native-paper';
import { ToastProvider, useToast } from '@/components/ToastProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

function LoginScreen() {
  const { showToast } = useToast();
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const currentVendor = await AsyncStorage.getItem('currentVendor');
      if (currentVendor) {
        // Si ya hay un vendedor logueado, ir directamente a las tabs
        if (Platform.OS === 'web') {
          router.replace('/(tabs)');
        } else {
          // Para móvil, usar push en lugar de replace
          router.push('/(tabs)');
        }
      }
    } catch (error) {
      console.error('Error checking existing auth:', error);
    }
  };

  const handleLogin = async () => {
    if (!userId || !name) {
      setError('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    try {
      await AsyncStorage.removeItem('currentVendor');

      const vendor = await VendorsAPI.getVendorByCredentials(userId, name);
      
      if (vendor) {
        await AsyncStorage.setItem('currentVendor', JSON.stringify(vendor));
        
        // Navegación específica para móvil
        if (Platform.OS === 'web') {
          router.replace('/(tabs)');
        } else {
          // Para móvil, usar push y luego reset
          router.push('/(tabs)');
          // Limpiar el stack de navegación
          setTimeout(() => {
            router.dismissAll();
          }, 100);
        }
        return;
      }

      setError('Credenciales inválidas');
    } catch (error) {
      console.error('Error during login:', error);
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg' }}
        style={styles.background}
        blurRadius={5}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <Surface style={styles.loginCard} elevation={4}>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name="people-outline" size={48} color="#2196F3" />
                </View>
                <Text variant="displaySmall" style={styles.title}>
                  Bienvenido
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                  Inicie sesión para continuar
                </Text>
              </View>

              <View style={styles.form}>
                <TextInput
                  label="ID de Usuario"
                  value={userId}
                  onChangeText={(text) => {
                    setError('');
                    setUserId(text);
                  }}
                  mode="outlined"
                  autoCapitalize="characters"
                  placeholder="Ej: V001"
                  left={<TextInput.Icon icon={() => <Ionicons name="lock-closed-outline" size={20} color="#666" />} />}
                  error={!!error}
                  style={styles.input}
                />

                <TextInput
                  label="Nombre"
                  value={name}
                  onChangeText={(text) => {
                    setError('');
                    setName(text);
                  }}
                  mode="outlined"
                  autoCapitalize="words"
                  placeholder="Ingrese su nombre"
                  left={<TextInput.Icon icon={() => <Ionicons name="person-outline" size={20} color="#666" />} />}
                  error={!!error}
                  style={styles.input}
                />

                {error ? (
                  <Text variant="bodySmall" style={styles.error}>
                    {error}
                  </Text>
                ) : null}

                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={loading}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  Ingresar
                </Button>

                <Button
                  mode="text"
                  onPress={() => setShowHelp(true)}
                  style={styles.helpButton}
                >
                  ¿Necesita ayuda?
                </Button>
              </View>
            </Surface>
          </View>
        </View>
      </ImageBackground>

      <Portal>
        <Dialog visible={showHelp} onDismiss={() => setShowHelp(false)}>
          <Dialog.Title>Ayuda de Acceso</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Para acceder al sistema necesita:
            </Text>
            <Text variant="bodyMedium" style={styles.helpText}>
              • ID de Usuario (proporcionado por su administrador)
            </Text>
            <Text variant="bodyMedium" style={styles.helpText}>
              • Su nombre exactamente como está registrado
            </Text>
            <Text variant="bodyMedium" style={styles.helpText}>
              Si tiene problemas para acceder, contacte a su administrador.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowHelp(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

export default function LoginScreenWithProviders() {
  return (
    <ToastProvider>
      <LoginScreen />
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  loginCard: {
    borderRadius: 12,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#1976D2',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  error: {
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  helpButton: {
    marginTop: 16,
  },
  helpText: {
    marginTop: 8,
  },
});