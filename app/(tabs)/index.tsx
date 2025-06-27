import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { ClientsAPI } from '@/lib/api/clients';
import { ProductsAPI } from '@/lib/api/products';
import { TransactionsAPI } from '@/lib/api/transactions';
import { SettingsAPI } from '@/lib/api/settings';
import { Client, Product, Transaction, OrderItem, Settings } from '@/types/database';
import { Surface, Text, Portal, Dialog, Button, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import ClientSelector from '@/components/sales/ClientSelector';
import ProductSelector from '@/components/sales/ProductSelector';
import OrderSummary from '@/components/sales/OrderSummary';
import InvoicePreview from '@/components/sales/InvoicePreview';
import { ToastProvider, useToast } from '@/components/ToastProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/lib/storage';

function OrderScreen() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<
    Map<string, { product: Product; quantity: number }>
  >(new Map());
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [currentVendor, setCurrentVendor] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    loadData();
    loadVendor();

    // Listen for settings updates
    const handleSettingsUpdate = (event: any) => {
      setSettings(event.detail);
      showToast('Configuración actualizada', 'info');
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
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

  const loadData = async () => {
    try {
      const [clientsData, productsData, settingsData] = await Promise.all([
        ClientsAPI.getAllClients(),
        ProductsAPI.getAllProducts(),
        SettingsAPI.getSettings()
      ]);

      setClients(clientsData);
      setProducts(productsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error cargando datos', 'error');
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let tax = 0;

    Array.from(selectedProducts.values()).forEach(({ product, quantity }) => {
      const itemTotal = product.price * quantity;
      
      if (settings?.taxIncluded) {
        const basePrice = itemTotal / (1 + (product.tax / 100));
        subtotal += basePrice;
        tax += itemTotal - basePrice;
      } else {
        subtotal += itemTotal;
        tax += itemTotal * (product.tax / 100);
      }
    });

    return { subtotal, tax, total: subtotal + tax };
  };

  const handleCreateOrder = async () => {
    if (!selectedClient || !settings || !currentVendor) {
      showToast('Error: Faltan datos requeridos', 'error');
      return;
    }

    try {
      const { subtotal, tax, total } = calculateTotals();

      const items: OrderItem[] = Array.from(selectedProducts.values()).map(
        ({ product, quantity }) => ({
          id: generateId('item_'),
          productId: product.id,
          product,
          quantity,
          price: product.price,
          tax: product.tax
        })
      );

      const prefix = settings.orderPrefix || 'FA';
      const control = `${prefix}${Date.now().toString().slice(-6)}`;
      
      const transaction: Omit<Transaction, 'createdAt' | 'updatedAt'> = {
        id: generateId('trans_'),
        control,
        document: control,
        type: 'FA',
        date: new Date(),
        clientId: selectedClient.id,
        client: selectedClient,
        vendorId: currentVendor.id,
        vendor: currentVendor,
        value: total,
        pendingValue: total,
        items,
        subtotal,
        tax,
      };

      const createdTransaction = await TransactionsAPI.createTransaction(transaction);
      
      setCurrentTransaction(createdTransaction);
      setShowInvoice(true);
      
      setSelectedProducts(new Map());
      setSelectedClient(null);
      
      showToast('Pedido creado exitosamente', 'success');
    } catch (error) {
      console.error('Error creating order:', error);
      showToast('Error creando pedido', 'error');
    }
  };

  const handleSelectProduct = (product: Product, quantity: number) => {
    setSelectedProducts(new Map(selectedProducts.set(product.id, { product, quantity })));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const existing = selectedProducts.get(productId);
    if (existing) {
      setSelectedProducts(
        new Map(selectedProducts.set(productId, { ...existing, quantity }))
      );
    }
  };

  const handleRemoveProduct = (productId: string) => {
    selectedProducts.delete(productId);
    setSelectedProducts(new Map(selectedProducts));
  };

  const handleAddClient = async (client: Client) => {
    try {
      const newClient = await ClientsAPI.createClient(client);
      setClients([...clients, newClient]);
      setSelectedClient(newClient);
      showToast('Cliente agregado exitosamente', 'success');
    } catch (error) {
      console.error('Error adding client:', error);
      showToast('Error agregando cliente', 'error');
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      const newProduct = await ProductsAPI.createProduct(product);
      setProducts([...products, newProduct]);
      showToast('Producto agregado exitosamente', 'success');
    } catch (error) {
      console.error('Error adding product:', error);
      showToast('Error agregando producto', 'error');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Nuevo Pedido',
          headerRight: () => (
            <Button
              mode="text"
              onPress={() => setShowHelp(true)}
              icon={() => <Ionicons name="help-circle-outline" size={20} color="#666" />}
            >
              Ayuda
            </Button>
          ),
        }}
      />

      <View style={styles.content}>
        <Surface style={styles.vendorCard} elevation={2}>
          <View style={styles.vendorHeader}>
            <Text variant="titleMedium">Información del Vendedor</Text>
            <Ionicons name="person-outline" size={24} color="#2196F3" />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.vendorInfo}>
            <Text variant="bodyLarge">ID: {currentVendor?.id}</Text>
            <Text variant="bodyLarge" style={styles.vendorName}>
              {currentVendor?.name} {currentVendor?.lastname}
            </Text>
          </View>
        </Surface>

        <ClientSelector
          clients={clients}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          onAddClient={handleAddClient}
        />

        <ProductSelector
          products={products}
          selectedProducts={selectedProducts}
          onSelectProduct={handleSelectProduct}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveProduct={handleRemoveProduct}
          onAddProduct={handleAddProduct}
        />

        <OrderSummary
          selectedClient={selectedClient}
          selectedProducts={selectedProducts}
          onCreateOrder={handleCreateOrder}
          settings={settings}
        />
      </View>

      <Portal>
        <Dialog visible={showHelp} onDismiss={() => setShowHelp(false)}>
          <Dialog.Title>Ayuda</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Para crear un nuevo pedido:</Text>
            <Text variant="bodyMedium" style={styles.helpText}>
              1. Seleccione un cliente o cree uno nuevo
            </Text>
            <Text variant="bodyMedium" style={styles.helpText}>
              2. Agregue productos al pedido
            </Text>
            <Text variant="bodyMedium" style={styles.helpText}>
              3. Verifique el resumen y montos
            </Text>
            <Text variant="bodyMedium" style={styles.helpText}>
              4. Presione "Procesar Pedido" para finalizar
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowHelp(false)}>Entendido</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <InvoicePreview
        visible={showInvoice}
        transaction={currentTransaction}
        onClose={() => setShowInvoice(false)}
        settings={settings}
      />
    </ScrollView>
  );
}

export default function OrderScreenWithProviders() {
  return (
    <ToastProvider>
      <OrderScreen />
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  vendorCard: {
    marginBottom: 16,
    borderRadius: 8,
    padding: 16,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 12,
  },
  vendorInfo: {
    marginTop: 8,
  },
  vendorName: {
    marginTop: 4,
    color: '#2196F3',
  },
  helpText: {
    marginTop: 8,
    marginLeft: 16,
  },
});