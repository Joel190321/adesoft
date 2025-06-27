import { View, ViewProps, StyleSheet } from 'react-native';
import { createContext, useContext } from 'react';

// Theme context for views
interface ViewThemeContextType {
  padding?: number;
  backgroundColor?: string;
}

const ViewThemeContext = createContext<ViewThemeContextType>({});

export function useViewTheme() {
  return useContext(ViewThemeContext);
}

export interface ThemedViewProps extends ViewProps {
  card?: boolean;
  section?: boolean;
  padded?: boolean;
  centered?: boolean;
  row?: boolean;
  backgroundColor?: string;
}

export default function ThemedView({
  card = false,
  section = false,
  padded = false,
  centered = false,
  row = false,
  backgroundColor,
  style,
  children,
  ...props
}: ThemedViewProps) {
  const parentContext = useViewTheme();
  const actualBackgroundColor = backgroundColor || parentContext.backgroundColor;
  const actualPadding = (padded || section) ? (parentContext.padding || 16) : undefined;

  return (
    <ViewThemeContext.Provider
      value={{
        padding: actualPadding,
        backgroundColor: actualBackgroundColor,
      }}
    >
      <View
        style={[
          row && styles.row,
          centered && styles.centered,
          padded && { padding: actualPadding },
          section && styles.section,
          card && styles.card,
          actualBackgroundColor ? { backgroundColor: actualBackgroundColor } : null,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </ViewThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 16,
    marginBottom: 16,
  },
});