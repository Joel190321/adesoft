import { StyleSheet, View, Modal, FlatList } from 'react-native';
import { Client } from '@/types/firebase';
import ThemedText from '../ui/ThemedText';
import Card from '../ui/Card';
import { SearchInput } from '../ui/Input';
import { useState } from 'react';
import Button from '../ui/Button';

interface ClientSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
  clients: Client[];
}

export default function ClientSearchModal({
  visible,
  onClose,
  onSelect,
  clients
}: ClientSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText variant="title">Seleccionar Cliente</ThemedText>
            <Button
              title="Cerrar"
              variant="ghost"
              onPress={onClose}
            />
          </View>

          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar cliente..."
          />

          <FlatList
            data={filteredClients}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card 
                style={styles.clientItem}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <ThemedText bold>{item.name}</ThemedText>
                {item.phone && (
                  <ThemedText variant="caption">{item.phone}</ThemedText>
                )}
                <ThemedText variant="caption">ID: {item.id}</ThemedText>
              </Card>
            )}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>
                No se encontraron clientes
              </ThemedText>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientItem: {
    marginBottom: 8,
    padding: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});