import { useState } from 'react';
import { StyleSheet, View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ui/ThemedText';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ADMIN_PIN = '1234'; // In a real app, this would be stored securely

export default function PinModal({ visible, onClose, onSuccess }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (pin === ADMIN_PIN) {
      setPin('');
      setError('');
      onSuccess();
    } else {
      setError('PIN incorrecto');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ThemedText variant="subtitle" style={styles.title}>
            Acceso Administrativo
          </ThemedText>
          
          <ThemedText style={styles.description}>
            Ingrese el PIN de administrador para acceder al inventario
          </ThemedText>

          <Input
            value={pin}
            onChangeText={(text) => {
              setError('');
              setPin(text);
            }}
            placeholder="Ingrese el PIN"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={4}
            style={styles.input}
          />

          {error ? (
            <ThemedText color="#e74c3c" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          <View style={styles.buttons}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={onClose}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  error: {
    textAlign: 'center',
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
});