import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '../ui/ThemedText';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface PaymentFormProps {
  maxAmount: number;
  onSubmit: (amount: number) => void;
  onCancel: () => void;
}

export default function PaymentForm({ maxAmount, onSubmit, onCancel }: PaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const paymentAmount = parseFloat(amount);
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Por favor ingrese un monto válido');
      return;
    }

    if (paymentAmount > maxAmount) {
      setError(`El monto no puede ser mayor a $${maxAmount.toFixed(2)}`);
      return;
    }

    onSubmit(paymentAmount);
  };

  return (
    <View style={styles.container}>
      <ThemedText variant="subtitle">Registrar Pago</ThemedText>
      
      <View style={styles.form}>
        <Input
          label="Monto a Pagar"
          value={amount}
          onChangeText={(text) => {
            setError('');
            setAmount(text);
          }}
          placeholder={`0.00 (máx: $${maxAmount.toFixed(2)})`}
          keyboardType="numeric"
          error={error}
        />

        <View style={styles.buttons}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={onCancel}
            style={styles.button}
          />
          <Button
            title="Confirmar"
            onPress={handleSubmit}
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  form: {
    marginTop: 12,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  button: {
    minWidth: 100,
  },
});