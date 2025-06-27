import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { VendorsAPI } from '@/lib/api/vendors';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ui/ThemedText';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ToastProvider, useToast } from '@/components/ToastProvider';
import { Vendor } from '@/types/database';
import { generateId } from '@/lib/storage';

function VendorManagement() {
  const { showToast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    lastname: '',
    cedula: '',
    phone: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const vendorsData = await VendorsAPI.getAllVendors();
      setVendors(vendorsData);
    } catch (error) {
      console.error('Error loading vendors:', error);
      showToast('Error cargando vendedores', 'error');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingVendor) {
        await VendorsAPI.updateVendor(editingVendor.id, {
          name: formData.name,
          lastname: formData.lastname,
          cedula: formData.cedula,
          phone: formData.phone,
        });
        showToast('Vendedor actualizado exitosamente', 'success');
      } else {
        await VendorsAPI.createVendor({
          id: formData.id,
          name: formData.name,
          lastname: formData.lastname,
          cedula: formData.cedula,
          phone: formData.phone,
        });
        showToast('Vendedor agregado exitosamente', 'success');
      }
      
      setShowForm(false);
      setEditingVendor(null);
      setFormData({ id: '', name: '', lastname: '', cedula: '', phone: '' });
      loadVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
      showToast('Error guardando vendedor', 'error');
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      id: vendor.id,
      name: vendor.name,
      lastname: vendor.lastname || '',
      cedula: vendor.cedula || '',
      phone: vendor.phone || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (vendorId: string) => {
    try {
      await VendorsAPI.deleteVendor(vendorId);
      showToast('Vendedor eliminado exitosamente', 'success');
      loadVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      showToast('Error eliminando vendedor', 'error');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="title">Gestión de Vendedores</ThemedText>
        <Button
          title="Nuevo Vendedor"
          icon={<Ionicons name="add" size={18} color="white" />}
          onPress={() => {
            setEditingVendor(null);
            setFormData({ id: '', name: '', lastname: '', cedula: '', phone: '' });
            setShowForm(true);
          }}
        />
      </View>

      {showForm && (
        <Card style={styles.form}>
          <ThemedText variant="subtitle">
            {editingVendor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
          </ThemedText>

          <Input
            label="ID de Vendedor"
            value={formData.id}
            onChangeText={(text) => setFormData({ ...formData, id: text })}
            placeholder="Ej: V001"
            autoCapitalize="characters"
            editable={!editingVendor}
          />

          <Input
            label="Nombre"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Nombre del vendedor"
          />

          <Input
            label="Apellido"
            value={formData.lastname}
            onChangeText={(text) => setFormData({ ...formData, lastname: text })}
            placeholder="Apellido del vendedor"
          />

          <Input
            label="Cédula"
            value={formData.cedula}
            onChangeText={(text) => setFormData({ ...formData, cedula: text })}
            placeholder="Número de cédula"
          />

          <Input
            label="Teléfono"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Número de teléfono"
          />

          <View style={styles.formButtons}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => {
                setShowForm(false);
                setEditingVendor(null);
              }}
              style={styles.formButton}
            />
            <Button
              title={editingVendor ? 'Actualizar' : 'Guardar'}
              onPress={handleSubmit}
              style={styles.formButton}
            />
          </View>
        </Card>
      )}

      <View style={styles.vendorsList}>
        {vendors.map((vendor) => (
          <Card key={vendor.id} style={styles.vendorCard}>
            <View style={styles.vendorInfo}>
              <ThemedText variant="subtitle">
                {vendor.name} {vendor.lastname}
              </ThemedText>
              <ThemedText variant="caption">ID: {vendor.id}</ThemedText>
              {vendor.cedula && (
                <ThemedText variant="caption">Cédula: {vendor.cedula}</ThemedText>
              )}
              {vendor.phone && (
                <ThemedText variant="caption">Teléfono: {vendor.phone}</ThemedText>
              )}
            </View>

            <View style={styles.vendorActions}>
              <Button
                title="Editar"
                variant="outline"
                size="small"
                icon={<Ionicons name="create-outline" size={16} color="#3498db" />}
                onPress={() => handleEdit(vendor)}
                style={styles.actionButton}
              />
              <Button
                title="Eliminar"
                variant="danger"
                size="small"
                icon={<Ionicons name="trash-outline" size={16} color="white" />}
                onPress={() => handleDelete(vendor.id)}
              />
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

export default function VendorManagementWithProviders() {
  return (
    <ToastProvider>
      <VendorManagement />
    </ToastProvider>
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
  form: {
    margin: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  formButton: {
    minWidth: 100,
  },
  vendorsList: {
    padding: 16,
  },
  vendorCard: {
    marginBottom: 16,
  },
  vendorInfo: {
    marginBottom: 16,
  },
  vendorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    minWidth: 100,
  },
});