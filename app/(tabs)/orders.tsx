import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, View, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TransactionsAPI } from '@/lib/api/transactions';
import ThemedText from '@/components/ui/ThemedText';
import Card from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/Input';
import ThemedView from '@/components/ui/ThemedView';
import { Transaction } from '@/types/database';
import { ToastProvider, useToast } from '@/components/ToastProvider';

function OrdersScreen() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const transactionsData = await TransactionsAPI.getAllTransactions();
      // Filter only orders/invoices (type 'FA') and sort by date
      const ordersData = transactionsData
        .filter(transaction => transaction.type === 'FA')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      showToast('Error cargando pedidos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.client?.name?.toLowerCase().includes(searchLower) ||
      order.control.toLowerCase().includes(searchLower) ||
      order.document?.toLowerCase().includes(searchLower) ||
      order.vendor?.name?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (pendingValue: number) => {
    if (pendingValue === 0) return '#2ecc71'; // Completed/Paid
    return '#f39c12'; // Pending payment
  };

  const getStatusText = (pendingValue: number) => {
    if (pendingValue === 0) return 'Completado';
    return 'Pendiente';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: () => (
              <ThemedText variant="title">Historial de Pedidos</ThemedText>
            ),
            headerStyle: { backgroundColor: '#fff' },
            headerShadowVisible: false,
          }}
        />
        <View style={styles.loadingContainer}>
          <ThemedText>Cargando pedidos...</ThemedText>
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
            <ThemedText variant="title">Historial de Pedidos</ThemedText>
          ),
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />

      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por cliente, vendedor o número de pedido..."
        />
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <ThemedText variant="subtitle">Pedido #{item.control}</ThemedText>
                <ThemedText variant="caption">{formatDate(item.date)}</ThemedText>
                {item.document && (
                  <ThemedText variant="caption">Doc: {item.document}</ThemedText>
                )}
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

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <ThemedText bold>Cliente:</ThemedText>
                <ThemedText>{item.client?.name || 'N/A'}</ThemedText>
              </View>
              {item.vendor && (
                <View style={styles.infoRow}>
                  <ThemedText bold>Vendedor:</ThemedText>
                  <ThemedText>{item.vendor.name} {item.vendor.lastname || ''}</ThemedText>
                </View>
              )}
            </View>

            {item.items && item.items.length > 0 && (
              <View style={styles.itemsSection}>
                <ThemedText bold style={styles.sectionTitle}>
                  Productos ({item.items.length}):
                </ThemedText>
                {item.items.slice(0, 3).map((orderItem) => (
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
                {item.items.length > 3 && (
                  <ThemedText variant="caption" style={styles.moreItems}>
                    +{item.items.length - 3} productos más...
                  </ThemedText>
                )}
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
            <Ionicons name="list-outline" size={48} color="#999" />
            <ThemedText variant="subtitle" centered style={styles.emptyText}>
              No hay pedidos que coincidan con tu búsqueda
            </ThemedText>
          </ThemedView>
        }
      />
    </SafeAreaView>
  );
}

export default function OrdersScreenWithProviders() {
  return (
    <ToastProvider>
      <OrdersScreen />
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
  orderCard: {
    marginBottom: 16,
  },
  orderHeader: {
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
  infoSection: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
  moreItems: {
    paddingLeft: 8,
    fontStyle: 'italic',
    color: '#666',
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