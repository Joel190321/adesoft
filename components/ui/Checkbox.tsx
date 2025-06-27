import { StyleSheet, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from './ThemedText';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export default function Checkbox({ label, checked, onPress, disabled = false }: CheckboxProps) {
  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[
        styles.checkbox,
        checked && styles.checked,
        disabled && styles.disabled
      ]}>
        {checked && <Ionicons name="checkmark" size={16} color="white" />}
      </View>
      <ThemedText style={[styles.label, disabled && styles.disabledText]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3498db',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#3498db',
  },
  disabled: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 14,
  },
  disabledText: {
    color: '#999',
  },
});