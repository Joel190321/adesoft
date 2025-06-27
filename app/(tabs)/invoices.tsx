import { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TransactionsAPI } from '@/lib/api/transactions';
import ThemedText from '@/components/ui/ThemedText';
import Card from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/Input';
import ThemedView from '@/components/ui/ThemedView';
import { Transaction } from '@/types/database';
import { ToastProvider, useToast } from '@/components/ToastProvider';

function InvoicesScreen() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const transactionsData = await TransactionsAPI.getAllTransactions();
      // Filter only invoices (type 'FA')
      const invoicesData = transactionsData.filter(transaction => transaction.type === 'FA');
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showToast('Error cargando facturas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      invoice.client?.name?.toLowerCase().includes(searchLower) ||
      invoice.control.toLowerCase().includes(searchLower) ||
      invoice.document?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusColor = (pendingValue: number) => {
    return pendingValue > 0 ? '#e74c3c' : '#2ecc71';
  };

  const getStatusText = (pendingValue: number) => {
    return pendingValue > 0 ? 'Pendiente' : 'Pagada';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: () => (
              <ThemedText variant="title">Facturas</ThemedText>
            ),
            headerStyle: { backgroundColor: '#fff' },
            headerShadowVisible: false,
          }}
        />
        <View style={styles.loadingContainer}>
          <ThemedText>Cargando facturas...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <ThemedText variant="title">Facturas</ThemedText>
          ),
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />

      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por cliente o número de factura..."
        />
      </View>

      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <View>
                <ThemedText variant="subtitle">Control: {item.control}</ThemedText>
                <ThemedText variant="caption">Doc: {item.document}</ThemedText>
                <ThemedText variant="caption">{formatDate(item.date)}</ThemedText>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.pendingValue) },
                ]}
              >
                <ThemedText color="#fff" style={styles.statusText}>
                  {getStatusText(item.pendingValue)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.clientSection}>
              <ThemedText bold>Cliente:</ThemedText>
              <ThemedText>{item.client?.name || 'N/A'}</ThemedText>
              {item.vendor && (
                <>
                  <ThemedText bold style={styles.vendorLabel}>Vendedor:</ThemedText>
                  <ThemedText>{item.vendor.name} {item.vendor.lastname || ''}</ThemedText>
                </>
              )}
            </View>

            {item.items && item.items.length > 0 && (
              <View style={styles.itemsSection}>
                <ThemedText bold style={styles.sectionTitle}>
                  Productos:
                </ThemedText>
                {item.items.map((orderItem) => (
                  <View key={orderItem.id} style={styles.orderItem}>
                    <View style={styles.productInfo}>
                      <ThemedText>{orderItem.product.name}</ThemedText>
                      <ThemedText variant="caption">
                        {orderItem.quantity} x ${orderItem.price.toFixed(2)}
                      </ThemedText>
                    </View>
                    <ThemedText bold>
                      ${(orderItem.quantity * orderItem.price).toFixed(2)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.totalSection}>
              {item.subtotal !== undefined && (
                <View style={styles.amountRow}>
                  <ThemedText>Subtotal:</ThemedText>
                  <ThemedText>${item.subtotal.toFixed(2)}</ThemedText>
                </View>
              )}
              {item.tax !== undefined && (
                <View style={styles.amountRow}>
                  <ThemedText>Impuesto:</ThemedText>
                  <ThemedText>${item.tax.toFixed(2)}</ThemedText>
                </View>
              )}
              <View style={[styles.amountRow, styles.totalRow]}>
                <ThemedText bold>Total:</ThemedText>
                <ThemedText variant="subtitle" color="#3498db">
                  ${item.value.toFixed(2)}
                </ThemedText>
              </View>
              {item.pendingValue > 0 && (
                <View style={[styles.amountRow, styles.pendingRow]}>
                  <ThemedText bold>Pendiente:</ThemedText>
                  <ThemedText color="#e74c3c">
                    ${item.pendingValue.toFixed(2)}
                  </ThemedText>
                </View>
              )}
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <ThemedView centered style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#999" />
            <ThemedText variant="subtitle" centered style={styles.emptyText}>
              No hay facturas que coincidan con tu búsqueda
            </ThemedText>
          </ThemedView>
        }
      />
    </SafeAreaView>
  );
}

export default function InvoicesScreenWithProviders() {
  return (
    <ToastProvider>
      <InvoicesScreen />
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  invoiceCard: {
    marginBottom: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  clientSection: {
    marginBottom: 12,
  },
  vendorLabel: {
    marginTop: 8,
  },
  itemsSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingLeft: 8,
  },
  productInfo: {
    flex: 1,
  },
  totalSection: {
    marginTop: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pendingRow: {
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
  },
});