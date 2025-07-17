import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SettingsAPI } from '@/lib/api/settings';
import ThemedText from '@/components/ui/ThemedText';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ToastProvider, useToast } from '@/components/ToastProvider';
import { Settings } from '@/types/database';
import Checkbox from '@/components/ui/Checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';

function SettingsScreen() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Settings>({
    id: 'global',
    companyName: '',
    taxRate: 18,
    defaultCredit: 1000,
    orderPrefix: 'FA',
    address: '',
    phone: '',
    rnc: '',
    email: '',
    logo: '',
    taxIncluded: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    loadVendor();
  }, []);

  const loadVendor = async () => {
    try {
      const vendor = await AsyncStorage.getItem('currentVendor');
      if (vendor) {
        setCurrentVendor(JSON.parse(vendor));
      }
    } catch (error) {
      console.error('Error loading vendor:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await SettingsAPI.getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('Error cargando configuración', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      await SettingsAPI.updateSettings({
        companyName: settings.companyName,
        taxRate: settings.taxRate,
        defaultCredit: settings.defaultCredit,
        orderPrefix: settings.orderPrefix,
        address: settings.address,
        phone: settings.phone,
        rnc: settings.rnc,
        email: settings.email,
        logo: settings.logo,
        taxIncluded: settings.taxIncluded,
      });

      // Trigger a settings refresh event for other components
      const event = new CustomEvent('settingsUpdated', { 
        detail: settings 
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(event);
      }

      showToast('Configuración guardada exitosamente', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Error guardando configuración', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('currentVendor');
      await AsyncStorage.removeItem('userRole');
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Configuración',
          }}
        />
        <View style={styles.loadingContainer}>
          <ThemedText>Cargando configuración...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Configuración',
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

      <ScrollView style={styles.scrollView}>
        {/* Vendor Info Card */}
        <Card style={styles.vendorCard}>
          <View style={styles.vendorHeader}>
            <Ionicons name="person-circle-outline" size={32} color="#3498db" />
            <View style={styles.vendorInfo}>
              <ThemedText variant="subtitle">Vendedor Actual</ThemedText>
              <ThemedText variant="caption">ID: {currentVendor?.id}</ThemedText>
              <ThemedText>{currentVendor?.name} {currentVendor?.lastname}</ThemedText>
            </View>
          </View>
        </Card>

        {/* Company Settings */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business-outline" size={24} color="#3498db" />
            <ThemedText variant="subtitle">Información de la Empresa</ThemedText>
          </View>
          
          <Input
            label="Nombre de la Empresa"
            value={settings.companyName}
            onChangeText={(text) => setSettings({ ...settings, companyName: text })}
            placeholder="Nombre de su empresa"
          />

          <Input
            label="RNC"
            value={settings.rnc}
            onChangeText={(text) => setSettings({ ...settings, rnc: text })}
            placeholder="RNC de la empresa"
          />

          <Input
            label="Dirección"
            value={settings.address}
            onChangeText={(text) => setSettings({ ...settings, address: text })}
            placeholder="Dirección de la empresa"
            multiline
          />

          <Input
            label="Teléfono"
            value={settings.phone}
            onChangeText={(text) => setSettings({ ...settings, phone: text })}
            placeholder="Teléfono de contacto"
            keyboardType="phone-pad"
          />

          <Input
            label="Correo Electrónico"
            value={settings.email}
            onChangeText={(text) => setSettings({ ...settings, email: text })}
            placeholder="Email de contacto"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="URL del Logo"
            value={settings.logo}
            onChangeText={(text) => setSettings({ ...settings, logo: text })}
            placeholder="URL de la imagen del logo"
            autoCapitalize="none"
          />
        </Card>

        {/* Sales Settings */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator-outline" size={24} color="#2ecc71" />
            <ThemedText variant="subtitle">Configuración de Ventas</ThemedText>
          </View>

          <Input
            label="Tasa de Impuesto (%)"
            value={settings.taxRate.toString()}
            onChangeText={(text) => setSettings({ ...settings, taxRate: parseFloat(text) || 0 })}
            keyboardType="numeric"
            placeholder="18"
          />

          <View style={styles.taxOptions}>
            <ThemedText variant="label" style={styles.taxLabel}>Tipo de ITBIS:</ThemedText>
            <ThemedText variant="caption" style={styles.taxDescription}>
              {settings.taxIncluded 
                ? "ITBIS Incluida: El precio ya incluye el impuesto" 
                : "ITBIS Aplicada: El impuesto se suma al precio base"
              }
            </ThemedText>
            <View style={styles.checkboxContainer}>
              <Checkbox
                label="ITBIS Aplicada"
                checked={!settings.taxIncluded}
                onPress={() => setSettings({ ...settings, taxIncluded: false })}
              />
              <Checkbox
                label="ITBIS Incluida"
                checked={settings.taxIncluded}
                onPress={() => setSettings({ ...settings, taxIncluded: true })}
              />
            </View>
          </View>

          <Input
            label="Crédito Predeterminado"
            value={settings.defaultCredit.toString()}
            onChangeText={(text) => setSettings({ ...settings, defaultCredit: parseFloat(text) || 0 })}
            keyboardType="numeric"
            placeholder="1000"
          />

          <Input
            label="Prefijo de Factura"
            value={settings.orderPrefix}
            onChangeText={(text) => setSettings({ ...settings, orderPrefix: text })}
            placeholder="FA"
            autoCapitalize="characters"
          />
        </Card>

        {/* Actions */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="options-outline" size={24} color="#9b59b6" />
            <ThemedText variant="subtitle">Acciones</ThemedText>
          </View>

          <Button
            title="Guardar Configuración"
            onPress={handleSave}
            loading={isSaving}
            icon={<Ionicons name="save-outline" size={18} color="white" />}
            style={styles.saveButton}
          />

          <Button
            title="Cerrar Sesión"
            variant="danger"
            onPress={handleLogout}
            icon={<Ionicons name="log-out-outline" size={18} color="white" />}
            style={styles.logoutButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function SettingsScreenWithProviders() {
  return (
    <ToastProvider>
      <SettingsScreen />
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  vendorCard: {
    margin: 16,
    marginBottom: 8,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  taxOptions: {
    marginBottom: 16,
  },
  taxLabel: {
    marginBottom: 4,
  },
  taxDescription: {
    marginBottom: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  checkboxContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  saveButton: {
    marginBottom: 12,
  },
  logoutButton: {
    marginBottom: 8,
  },
});