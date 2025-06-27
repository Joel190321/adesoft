import { 
  TextInput, 
  StyleSheet, 
  View, 
  TextInputProps,
  Pressable,
  ViewStyle 
} from 'react-native';
import { useState } from 'react';
import ThemedText from './ThemedText';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  clearable?: boolean;
  secureTextEntry?: boolean;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  clearable = false,
  secureTextEntry = false,
  value,
  onChangeText,
  style,
  placeholder,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(!secureTextEntry);

  const handleClear = () => {
    if (onChangeText) {
      onChangeText('');
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Generate icons based on input state and props
  const renderLeftIcon = () => {
    if (!leftIcon) return null;
    return <View style={styles.leftIcon}>{leftIcon}</View>;
  };

  const renderRightIcon = () => {
    // Handle secure text entry icon
    if (secureTextEntry) {
      return (
        <Pressable onPress={togglePasswordVisibility} style={styles.rightIcon}>
          <Ionicons 
            name={passwordVisible ? "eye-off-outline" : "eye-outline"} 
            size={20} 
            color="#666" 
          />
        </Pressable>
      );
    }

    // Handle clearable icon
    if (clearable && value && value.length > 0) {
      return (
        <Pressable onPress={handleClear} style={styles.rightIcon}>
          <Ionicons name="close" size={18} color="#666" />
        </Pressable>
      );
    }

    // Handle custom right icon
    if (rightIcon) {
      return <View style={styles.rightIcon}>{rightIcon}</View>;
    }

    return null;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <ThemedText variant="label">{label}</ThemedText>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error && styles.error,
          leftIcon && styles.withLeftIcon,
          (rightIcon || clearable || secureTextEntry) && styles.withRightIcon,
        ]}
      >
        {renderLeftIcon()}
        <TextInput
          style={[
            styles.input,
            style,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !passwordVisible}
          {...props}
        />
        {renderRightIcon()}
      </View>
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
    </View>
  );
}

export function SearchInput(props: Omit<InputProps, 'leftIcon'>) {
  return (
    <Input 
      leftIcon={<Ionicons name="search" size={18} color="#666" />} 
      placeholder="Buscar..." 
      clearable
      {...props} 
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  leftIcon: {
    paddingLeft: 12,
  },
  rightIcon: {
    paddingRight: 12,
  },
  withLeftIcon: {
    paddingLeft: 0,
  },
  withRightIcon: {
    paddingRight: 0,
  },
  focused: {
    borderColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  error: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
});