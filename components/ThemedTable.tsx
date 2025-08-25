import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';

interface ThemedTableProps {
  columns: string[];
  data: any[];
  style?: ViewStyle;
}

export const ThemedTable: React.FC<ThemedTableProps> = ({ columns, data, style }) => {
  const borderColor = useThemeColor({}, 'border') ;
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const headerBg = useThemeColor({}, 'tint');

  return (
    <View style={[styles.table, { backgroundColor, borderColor }, style]}>
      <View style={[styles.row, { borderBottomWidth: 1, borderColor, backgroundColor: headerBg }]}> 
        {columns.map((col, idx) => (
          <ThemedText key={col} style={[styles.headerCell, { color: textColor, flex: idx === 1 ? 2 : 1 }]}>{col}</ThemedText>
        ))}
      </View>
      {data.map((row, i) => (
        <View key={row.IdProducto || i} style={[styles.row, { borderBottomWidth: 1, borderColor }]}> 
          {columns.map((col, idx) => (
            <ThemedText key={col} style={[styles.cell, { color: textColor, flex: idx === 1 ? 2 : 1 }]}>{row[col]}</ThemedText>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  table: {
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 15,
    paddingBottom: 5,
  },
  cell: {
    fontSize: 14,
  },
});
