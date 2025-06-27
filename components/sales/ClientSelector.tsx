import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Client } from '@/types/firebase';
import { Surface, Portal, Modal, Text, Button, List, Searchbar } from 'react-native-paper';
import ClientForm from './ClientForm';

interface ClientSelectorProps {
  clients: Client[];
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  onAddClient: (client: Client) => void;
}

export default function ClientSelector({
  clients,
  selectedClient,
  onSelectClient,
  onAddClient,
}: ClientSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    setModalVisible(false);
  };

  const handleAddClient = (client: Client) => {
    onAddClient(client);
    setShowAddForm(false);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface} elevation={1}>
        <Text variant="titleMedium">Cliente</Text>
        
        {selectedClient ? (
          <View style={styles.selectedClient}>
            <Ionicons name="person-outline" size={20} color="#2196F3" />
            <View style={styles.clientInfo}>
              <Text variant="bodyLarge">{selectedClient.name}</Text>
              {selectedClient.phone && (
                <Text variant="bodySmall" style={styles.phoneText}>
                  {selectedClient.phone}
                </Text>
              )}
            </View>
            <Button 
              mode="outlined"
              onPress={() => setModalVisible(true)}
            >
              Cambiar
            </Button>
          </View>
        ) : (
          <Button
            mode="contained"
            icon={() => <Ionicons name="person-outline" size={18} color="white" />}
            onPress={() => setModalVisible(true)}
            style={styles.selectButton}
          >
            Seleccionar Cliente
          </Button>
        )}
      </Surface>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            setShowAddForm(false);
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            {!showAddForm ? (
              <>
                <View style={styles.modalHeader}>
                  <Text variant="headlineSmall">Seleccionar Cliente</Text>
                  <Button onPress={() => setModalVisible(false)}>
                    Cerrar
                  </Button>
                </View>

                <Searchbar
                  placeholder="Buscar cliente..."
                  onChangeText={setSearchQuery}
                  value={searchQuery}
                  style={styles.searchBar}
                />

                <View style={styles.clientsList}>
                  {filteredClients.map((client) => (
                    <List.Item
                      key={client.id}
                      title={client.name}
                      description={client.phone || client.address1}
                      left={props => <List.Icon {...props} icon={() => <Ionicons name="person-outline" size={24} color="#666" />} />}
                      onPress={() => handleSelectClient(client)}
                      style={styles.clientItem}
                    />
                  ))}
                  {filteredClients.length === 0 && (
                    <Text variant="bodyMedium" style={styles.emptyText}>
                      No hay clientes que coincidan
                    </Text>
                  )}
                </View>

                <Button
                  mode="contained"
                  icon={() => <Ionicons name="add" size={18} color="white" />}
                  onPress={() => setShowAddForm(true)}
                  style={styles.addButton}
                >
                  Nuevo Cliente
                </Button>
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text variant="headlineSmall">Nuevo Cliente</Text>
                  <Button onPress={() => setShowAddForm(false)}>
                    Volver
                  </Button>
                </View>

                <ClientForm 
                  onSubmit={handleAddClient} 
                  onCancel={() => setShowAddForm(false)} 
                />
              </>
            )}
          </Surface>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  surface: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  selectedClient: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  clientInfo: {
    flex: 1,
    marginLeft: 12,
  },
  phoneText: {
    color: '#666',
    marginTop: 2,
  },
  selectButton: {
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  clientsList: {
    flex: 1,
  },
  clientItem: {
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  addButton: {
    marginTop: 16,
  },
});