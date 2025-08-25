import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Pressable } from 'react-native';
import { ThemedCheckbox } from '@/components/ThemedCheckbox';
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedInput } from '@/components/ThemedInput';
import { apiUrl } from '@/config';

export default function Inicio() {
  const [remember, setRemember] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState<'success' | 'error' | ''>('');
  const router = useRouter();

  // Load saved username and remember me preference on component mount
  React.useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('savedUsername');
        const rememberMe = await AsyncStorage.getItem('rememberMe');
        
        if (savedUsername && rememberMe === 'true') {
          setCodigo(savedUsername);
          setRemember(true);
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    };

    loadSavedCredentials();
  }, []);

  // Función para cargar datos de configuración
  const loadConfigData = async () => {
    try {
      const response = await fetch(`${apiUrl}configs`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          // Guardar la configuración en AsyncStorage para uso posterior
          await AsyncStorage.setItem('configData', JSON.stringify(data[0]));
          return data[0];
        }
      } else {
        console.error('Error loading config:', response.status);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    return null;
  };

  const toggleRememberMe = async () => {
    const newValue = !remember;
    setRemember(newValue);
    
    try {
      if (newValue) {
        // Save username and remember preference
        await AsyncStorage.setItem('savedUsername', codigo);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        // Clear saved username if remember me is unchecked
        await AsyncStorage.removeItem('savedUsername');
        await AsyncStorage.removeItem('rememberMe');
      }
    } catch (error) {
      console.error('Error updating remember me preference:', error);
      // Revert state if there's an error
      setRemember(!newValue);
    }
  };

  const handleLogin = async () => {
    if (!codigo) {
      setMensaje('Debes ingresar tu código de acceso');
      setMensajeTipo('error');
      return;
    }
    setLoading(true);
    setMensaje('');
    setMensajeTipo('');
    try {
      const res = await fetch(`${apiUrl}vendedores/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigo })
      });
      const data = await res.json();
      if (!res.ok) {
        setMensaje(data.message || 'El código es incorrecto.');
        setMensajeTipo('error');
        return;
      }
      // Guardar vendedor en AsyncStorage
      await AsyncStorage.setItem('currentVendor', JSON.stringify(data.vendedor));
      if (remember) {
        await AsyncStorage.setItem('rememberVendor', 'true');
      } else {
        await AsyncStorage.removeItem('rememberVendor');
      }
      
      // Preload de la configuración de la compañía
      setMensaje('Cargando configuración...');
      const configData = await loadConfigData();
      
      setMensaje(data.mensaje || '¡Acceso correcto!');
      setMensajeTipo('success');
      setTimeout(() => {
        router.replace('/(tabs)/(menu_tabs)/Dashboard');
      }, 1200);
    } catch (err: any) {
      setMensaje(err.message);
      setMensajeTipo('error');
    } finally {
      setLoading(false);
    }

    const handleKeyPress = (e: any) => {
      if (e.nativeEvent.key === 'Enter') {
        handleLogin();
      }
    };


  };

  return (
    <>
      <Stack.Screen options={{ title: 'Inicio', headerShown: false }} />
      <ThemedView style={styles.container}>
      <ThemedText type="default" style={styles.label}>Código de Acceso</ThemedText>
      <ThemedInput
        placeholder="Ingresa tu código"
        icon
        value={codigo}
        onChangeText={async (text) => {
          setCodigo(text);
          if (remember) {
            try {
              await AsyncStorage.setItem('savedUsername', text);
            } catch (error) {
              console.error('Error guardando usuario recordado:', error);
            }
          }
        }}
        onSubmitEditing={handleLogin}
        returnKeyType="go"
        autoCapitalize="none"
        autoComplete="username"
        autoCorrect={false}
        editable={!loading}
        
              />
      {mensaje ? (
        <ThemedText
          style={{
            color: mensajeTipo === 'error' ? '#e74c3c' : '#27ae60',
            marginVertical: 8,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {mensaje}
        </ThemedText>
      ) : null}
      <ThemedCheckbox
        checked={remember}
        onPress={toggleRememberMe}
        label="Recordarme"
        style={{ marginBottom: 14 }}
      />
      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        <ThemedText style={styles.buttonText}>{loading ? 'Ingresando...' : 'Ingresar'}</ThemedText>
      </Pressable>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  label: {
    marginBottom: 10,
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'center',
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: 'red',
    color: 'black',
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,  
    borderWidth: 1,
    backgroundColor: '#215b98ff',
    textTransform: 'uppercase',
    marginBottom: 10,
    fontSize: 16,
    alignSelf: 'center',
    position: 'relative',
    justifyContent: 'center',
    color: '#fff',
    borderColor: 'transparent',
    borderRadius: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
    textTransform: 'uppercase',
  }
});
