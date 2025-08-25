import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';

interface ThemedCheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export const ThemedCheckbox: React.FC<ThemedCheckboxProps> = ({ checked, onPress, label, style, labelStyle }) => {
  const borderColor = useThemeColor({}, 'tint');
  const checkmarkColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <Pressable style={[styles.checkboxRow, style]} onPress={onPress}>
      <View style={[styles.checkbox, { borderColor, backgroundColor }]}> 
        {checked && <ThemedText style={[styles.checkmark, { color: checkmarkColor }]}>✓</ThemedText>}
      </View>
      {label && (
        <ThemedText style={[styles.checkboxLabel, { color: textColor }, labelStyle]}>{label}</ThemedText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
