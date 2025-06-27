import { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, Modal, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { ClientsAPI } from '@/lib/api/clients';
import { TransactionsAPI } from '@/lib/api/transactions';
import { PaymentsAPI } from '@/lib/api/payments';
import { Client, Transaction, Vendor, PaymentReference } from '@/types/database';
import { ToastProvider, useToast } from '@/components/ToastProvider';
import { Portal, Surface, List, Button, Text, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import PaymentModal from '@/components/receipts/PaymentModal';
import PaymentsList from '@/components/receipts/PaymentsList';
import ReceiptPrint from '@/components/receipts/ReceiptPrint';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/lib/storage';

function ReceiptsScreen() {
  const { showToast } = useToast();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentsList, setShowPaymentsList] = useState(false);
  const [showReceiptPrint, setShowReceiptPrint] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentPayment, setCurrentPayment] = useState<PaymentReference | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<PaymentReference[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  useEffect(() => {
    loadVendor();
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadTransactions();
      loadPayments();
    }
  }, [selectedClient]);

  const loadVendor = async () => {
    try {
      const vendorData = await AsyncStorage.getItem('currentVendor');
      if (vendorData) {
        setCurrentVendor(JSON.parse(vendorData));
      }
    } catch (error) {
      console.error('Error loading vendor:', error);
    }
  };

  const loadClients = async () => {
    try {
      const clientsData = await ClientsAPI.getAllClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadTransactions = async () => {
    if (!selectedClient) return;
    
    try {
      const transactionsData = await TransactionsAPI.getPendingTransactions(selectedClient.id);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadPayments = async () => {
    if (!selectedClient) return;
    
    try {
      const paymentsData = await PaymentsAPI.getPaymentsByClient(selectedClient.id);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handlePayment = async (amount: number) => {
    if (!selectedClient || !selectedTransaction || !currentVendor) return;

    try {
      const control = `RC${Date.now().toString().slice(-6)}`;
      
      const payment: Omit<PaymentReference, 'createdAt' | 'updatedAt'> = {
        id: generateId('payment_'),
        controlRc: control,
        typeRc: 'RC',
        controlFa: selectedTransaction.control,
        typeFa: 'FA',
        clientId: selectedClient.id,
        vendorId: currentVendor.id,
        paymentAmount: amount,
      };

      const createdPayment = await PaymentsAPI.createPayment(payment);
      
      const newPendingValue = Math.max(0, selectedTransaction.pendingValue - amount);
      await TransactionsAPI.updateTransaction(selectedTransaction.id, {
        pendingValue: newPendingValue,
      });

      await ClientsAPI.updateClient(selectedClient.id, {
        debit: Math.max(0, (selectedClient.debit || 0) - amount),
      });

      setCurrentPayment(createdPayment);
      setShowPaymentModal(false);
      setShowReceiptPrint(true);
      
      // Reload data
      loadTransactions();
      loadPayments();
      
      showToast('Pago registrado exitosamente', 'success');
    } catch (error) {
      console.error('Error processing payment:', error);
      showToast('Error procesando el pago', 'error');
    }
  };

  const getPaymentsForInvoice = (controlFa: string) => {
    return payments.filter(payment => payment.controlFa === controlFa);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Recibo de Ingresos',
        }}
      />

      <ScrollView style={styles.content}>
        <Surface style={styles.selectionSection} elevation={1}>
          <View style={styles.selectionField}>
            <Text variant="titleMedium">Cliente</Text>
            {selectedClient ? (
              <View style={styles.selectedItem}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <View style={styles.selectedInfo}>
                  <Text variant="bodyLarge">{selectedClient.name}</Text>
                  <Text variant="bodySmall">ID: {selectedClient.id}</Text>
                </View>
                <Button 
                  mode="outlined"
                  onPress={() => setShowClientModal(true)}
                >
                  Cambiar
                </Button>
              </View>
            ) : (
              <Button
                mode="contained"
                icon={() => <Ionicons name="person-outline" size={18} color="white" />}
                onPress={() => setShowClientModal(true)}
              >
                Seleccionar Cliente
              </Button>
            )}
          </View>

          {currentVendor && (
            <View style={styles.vendorInfo}>
              <Text variant="bodySmall" style={styles.vendorLabel}>Vendedor:</Text>
              <Text variant="bodyMedium">
                {currentVendor.name} {currentVendor.lastname}
              </Text>
            </View>
          )}
        </Surface>

        {selectedClient && (
          <>
            <Searchbar
              placeholder="Buscar facturas..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />

            <Surface style={styles.transactionsList} elevation={1}>
              {transactions
                .filter(t => t.document.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((transaction) => (
                  <List.Item
                    key={transaction.id}
                    title={`Factura: ${transaction.document}`}
                    description={`Pendiente: $${transaction.pendingValue.toFixed(2)}`}
                    left={props => <List.Icon {...props} icon={() => <Ionicons name="receipt-outline" size={24} color="#666" />} />}
                    right={props => (
                      <View style={styles.actionButtons}>
                        <Button
                          mode="text"
                          icon={() => <Ionicons name="eye-outline" size={20} color="#666" />}
                          onPress={() => {
                            setSelectedTransaction(transaction);
                            setShowPaymentsList(true);
                          }}
                        >
                          Ver
                        </Button>
                        <Button
                          mode="contained"
                          icon={() => <Ionicons name="cash-outline" size={20} color="white" />}
                          onPress={() => {
                            setSelectedTransaction(transaction);
                            setShowPaymentModal(true);
                          }}
                        >
                          Pagar
                        </Button>
                      </View>
                    )}
                  />
              ))}
              {transactions.length === 0 && (
                <List.Item
                  title="No hay facturas pendientes"
                  description="Todas las facturas están pagadas"
                  left={props => <List.Icon {...props} icon={() => <Ionicons name="receipt-outline" size={24} color="#666" />} />}
                />
              )}
            </Surface>
          </>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={showClientModal}
          onDismiss={() => {
            setShowClientModal(false);
            setClientSearchQuery('');
          }}
        >
          <View style={styles.modalContainer}>
            <Surface style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge">Seleccionar Cliente</Text>
                <Button onPress={() => {
                  setShowClientModal(false);
                  setClientSearchQuery('');
                }}>
                  Cerrar
                </Button>
              </View>

              <Searchbar
                placeholder="Buscar cliente..."
                onChangeText={setClientSearchQuery}
                value={clientSearchQuery}
                style={styles.modalSearch}
              />

              <FlatList
                data={clients.filter(client => 
                  client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
                )}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedClient(item);
                      setShowClientModal(false);
                      setClientSearchQuery('');
                    }}
                  >
                    <List.Item
                      title={item.name}
                      description={`ID: ${item.id}`}
                      left={props => <List.Icon {...props} icon={() => <Ionicons name="person-outline" size={24} color="#666" />} />}
                    />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.modalList}
              />
            </Surface>
          </View>
        </Modal>
      </Portal>

      <PaymentModal
        visible={showPaymentModal}
        transaction={selectedTransaction}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePayment}
      />

      <PaymentsList
        visible={showPaymentsList}
        onClose={() => setShowPaymentsList(false)}
        payments={selectedTransaction ? getPaymentsForInvoice(selectedTransaction.control) : []}
      />

      {currentPayment && selectedTransaction && (
        <ReceiptPrint
          visible={showReceiptPrint}
          onClose={() => setShowReceiptPrint(false)}
          transaction={selectedTransaction}
          payment={currentPayment}
        />
      )}
    </SafeAreaView>
  );
}

export default function ReceiptsScreenWithProviders() {
  return (
    <ToastProvider>
      <ReceiptsScreen />
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  selectionSection: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectionField: {
    marginBottom: 16,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  selectedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vendorInfo: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  vendorLabel: {
    color: '#666',
    marginBottom: 4,
  },
  searchbar: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  transactionsList: {
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalSearch: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalList: {
    maxHeight: 400,
  },
});