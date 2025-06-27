import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Client } from '@/types/database';
import { generateId } from '@/lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: Client) => void;
  onCancel: () => void;
}

export default function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState<Partial<Client>>(
    client || {
      name: '',
      rnc: '',
      phone: '',
      address1: '',
      address2: '',
      isExempt: false,
      debit: 0,
      credit: 0,
      vendorId: '',
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        const currentVendor = await AsyncStorage.getItem('currentVendor');
        const vendor = currentVendor ? JSON.parse(currentVendor) : {};
        
        // Generate a unique ID for new clients
        const newClient: Client = {
          id: client?.id || generateId('client_'),
          name: formData.name || '',
          rnc: formData.rnc,
          phone: formData.phone,
          address1: formData.address1,
          address2: formData.address2,
          isExempt: formData.isExempt || false,
          debit: formData.debit || 0,
          credit: formData.credit || 0,
          vendorId: formData.vendorId || vendor.id,
          createdAt: client?.createdAt || new Date(),
          updatedAt: new Date(),
        };

        onSubmit(newClient);
      } catch (error) {
        console.error('Error getting vendor data:', error);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Nombre"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        error={errors.name}
        autoCapitalize="words"
      />

      <Input
        label="RNC"
        value={formData.rnc}
        onChangeText={(text) => setFormData({ ...formData, rnc: text })}
        keyboardType="number-pad"
      />

      <Input
        label="Teléfono"
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
        keyboardType="phone-pad"
      />

      <Input
        label="Dirección 1"
        value={formData.address1}
        onChangeText={(text) => setFormData({ ...formData, address1: text })}
      />

      <Input
        label="Dirección 2"
        value={formData.address2}
        onChangeText={(text) => setFormData({ ...formData, address2: text })}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Cancelar"
          variant="outline"
          onPress={onCancel}
          style={styles.cancelButton}
        />
        <Button
          title={client ? 'Actualizar' : 'Guardar'}
          onPress={handleSubmit}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  cancelButton: {
    marginRight: 12,
  },
});