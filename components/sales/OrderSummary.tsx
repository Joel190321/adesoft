import { StyleSheet, View } from 'react-native';
import ThemedText from '../ui/ThemedText';
import ThemedView from '../ui/ThemedView';
import Button from '../ui/Button';
import { Client, Product, Settings } from '@/types/database';

interface OrderSummaryProps {
  selectedClient: Client | null;
  selectedProducts: Map<string, { product: Product; quantity: number }>;
  onCreateOrder: () => void;
  settings?: Settings | null;
}

export default function OrderSummary({ 
  selectedClient, 
  selectedProducts,
  onCreateOrder,
  settings,
}: OrderSummaryProps) {
  // Calculate order totals based on tax type
  const calculateTotals = () => {
    let subtotal = 0;
    let tax = 0;

    Array.from(selectedProducts.values()).forEach(({ product, quantity }) => {
      const itemTotal = product.price * quantity;
      
      if (settings?.taxIncluded) {
        // ITBIS Incluida: Precio incluye impuesto
        const basePrice = itemTotal / (1 + (product.tax / 100));
        subtotal += basePrice;
        tax += itemTotal - basePrice;
      } else {
        // ITBIS Aplicada: Precio base + impuesto
        subtotal += itemTotal;
        tax += itemTotal * (product.tax / 100);
      }
    });

    const total = settings?.taxIncluded ? 
      subtotal + tax : // Para ITBIS incluida, el total es la suma del subtotal + ITBIS
      subtotal + tax;  // Para ITBIS aplicada, también es la suma

    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();
  const isOrderValid = selectedClient !== null && selectedProducts.size > 0;

  return (
    <View style={styles.container}>
      <ThemedView card>
        <ThemedText variant="subtitle">Resumen del Pedido</ThemedText>
        
        <View style={styles.summaryTable}>
          <View style={styles.summaryRow}>
            <ThemedText>Subtotal:</ThemedText>
            <ThemedText>${subtotal.toFixed(2)}</ThemedText>
          </View>
          
          <View style={styles.summaryRow}>
            <ThemedText>
              ITBIS ({settings?.taxIncluded ? 'Incluida' : 'Aplicada'}):
            </ThemedText>
            <ThemedText>${tax.toFixed(2)}</ThemedText>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <ThemedText bold>Total:</ThemedText>
            <ThemedText variant="subtitle" color="#3498db">
              ${total.toFixed(2)}
            </ThemedText>
          </View>
        </View>
        
        <Button
          title="Procesar Pedido"
          onPress={onCreateOrder}
          disabled={!isOrderValid}
          fullWidth
          style={styles.submitButton}
        />
        
        {!isOrderValid && (
          <ThemedText variant="caption" color="#e74c3c" centered style={styles.validationMessage}>
            {!selectedClient
              ? 'Debe seleccionar un cliente'
              : selectedProducts.size === 0
              ? 'Debe agregar al menos un producto'
              : ''}
          </ThemedText>
        )}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  summaryTable: {
    marginTop: 12,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
  },
  validationMessage: {
    marginTop: 8,
  },
});