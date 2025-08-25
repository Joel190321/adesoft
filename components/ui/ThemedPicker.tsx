import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ThemedPickerProps {
  selectedValue: any;
  onValueChange: (itemValue: any, itemIndex: number) => void;
  children: React.ReactNode;
  style?: any;
  pickerStyle?: any;
}

export const ThemedPicker: React.FC<ThemedPickerProps> = ({ selectedValue, onValueChange, children, style, pickerStyle }) => {
  const themeBg2 = useThemeColor({}, 'backgroundSecondary');
  const themeText = useThemeColor({}, 'text');

  return (
    <View style={[styles.pickerWrapper, { backgroundColor: themeBg2, borderColor: themeText }, style]}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={[
          styles.picker,
          { color: themeText, backgroundColor: themeBg2, borderRadius: 30 },
          pickerStyle
        ]}
        dropdownIconColor={themeText}
      >
        {children}
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerWrapper: {
    borderWidth: 2,
    borderRadius: 30,
    paddingHorizontal: 10,
    marginBottom: 20,
    marginLeft: 8,
    marginRight: 8,
    marginTop: 17,
    justifyContent: 'center',
    minWidth: 120,
    height: 44,
  },
  picker: {
    width: '100%',
    height: 40,
    borderWidth: 0,
  },
});

export default ThemedPicker; 