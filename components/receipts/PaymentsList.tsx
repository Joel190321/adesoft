import { StyleSheet } from 'react-native';
import { Portal, Dialog, List, Surface, Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { PaymentReference } from '@/types/firebase';

interface PaymentsListProps {
  visible: boolean;
  onClose: () => void;
  payments: PaymentReference[];
}

export default function PaymentsList({ visible, onClose, payments }: PaymentsListProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose}>
        <Dialog.Title>Pagos Realizados</Dialog.Title>
        <Dialog.Content>
          <Surface style={styles.container} elevation={1}>
            {payments.map((payment) => (
              <List.Item
                key={payment.id}
                title={`Recibo: ${payment.controlRc}`}
                description={formatDate(payment.createdAt)}
                right={() => (
                  <Text variant="bodyLarge" style={styles.amount}>
                    ${payment.paymentAmount.toFixed(2)}
                  </Text>
                )}
                left={props => <List.Icon {...props} icon={() => <Ionicons name="receipt-outline" size={24} color="#2ecc71" />} />}
              />
            ))}
            {payments.length === 0 && (
              <Text variant="bodyMedium" style={styles.emptyText}>No hay pagos registrados</Text>
            )}
          </Surface>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose}>Cerrar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
  },
  amount: {
    color: '#2ecc71',
    fontWeight: 'bold',
    marginRight: 8,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#666',
  },
});