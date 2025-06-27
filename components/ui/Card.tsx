import { StyleSheet, View, ViewProps } from 'react-native';
import { ReactNode } from 'react';

interface CardProps extends ViewProps {
  children: ReactNode;
  padded?: boolean;
  elevated?: boolean;
  bordered?: boolean;
  backgroundColor?: string;
  activeOpacity?: number;
  onPress?: () => void;
}

export default function Card({
  children,
  padded = true,
  elevated = true,
  bordered = false,
  backgroundColor = 'white',
  style,
  ...props
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        elevated && styles.elevated,
        bordered && styles.bordered,
        { backgroundColor },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  padded: {
    padding: 16,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bordered: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});