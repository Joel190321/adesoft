import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Dialog, Button, List, Text, Surface, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/types/firebase';

interface PaymentModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export default function PaymentModal({
  visible,
  transaction,
  onClose,
  onConfirm,
}: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  if (!transaction) return null;

  const handleSubmit = () => {
    const paymentAmount = parseFloat(amount);
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Por favor ingrese un monto válido');
      return;
    }

    if (paymentAmount > transaction.pendingValue) {
      setError(`El monto no puede ser mayor a $${transaction.pendingValue.toFixed(2)}`);
      return;
    }

    onConfirm(paymentAmount);
    setAmount('');
    setError('');
  };

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
        <Dialog.Title>Registrar Pago</Dialog.Title>
        <Dialog.Content>
          <Surface style={styles.details} elevation={1}>
            <List.Item
              title="Factura"
              description={transaction.document}
              left={props => <List.Icon {...props} icon={() => <Ionicons name="receipt-outline" size={24} color="#666" />} />}
            />
            <List.Item
              title="Fecha"
              description={formatDate(transaction.date)}
            />
            <List.Item
              title="Cliente"
              description={transaction.client.name}
            />
            <List.Item
              title="Monto Total"
              description={`$${transaction.value.toFixed(2)}`}
            />
            <List.Item
              title="Monto Pendiente"
              description={`$${transaction.pendingValue.toFixed(2)}`}
              descriptionStyle={{ color: '#e74c3c' }}
            />
          </Surface>

          <TextInput
            label="Monto a Pagar"
            value={amount}
            onChangeText={(text) => {
              setError('');
              setAmount(text);
            }}
            placeholder={`0.00 (máx: $${transaction.pendingValue.toFixed(2)})`}
            keyboardType="numeric"
            error={!!error}
            style={styles.input}
          />
          {error && <Text variant="bodySmall" style={styles.errorText}>{error}</Text>}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose}>Cancelar</Button>
          <Button mode="contained" onPress={handleSubmit}>
            Confirmar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  details: {
    marginBottom: 16,
    borderRadius: 8,
  },
  input: {
    marginTop: 8,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
});