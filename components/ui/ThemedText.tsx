import { Text, TextProps, StyleSheet } from 'react-native';
import { createContext, useContext } from 'react';

// Theme context for text
type TextVariant = 'header' | 'title' | 'subtitle' | 'body' | 'caption' | 'button' | 'label';

type TextThemeContextType = {
  variant: TextVariant;
  color?: string;
};

const TextThemeContext = createContext<TextThemeContextType>({
  variant: 'body',
});

export function useTextTheme() {
  return useContext(TextThemeContext);
}

export interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  centered?: boolean;
}

export default function ThemedText({
  variant = 'body',
  color,
  bold = false,
  italic = false,
  centered = false,
  style,
  children,
  ...props
}: ThemedTextProps) {
  const parentContext = useTextTheme();
  const actualVariant = variant || parentContext.variant;
  const actualColor = color || parentContext.color;

  return (
    <TextThemeContext.Provider value={{ variant: actualVariant, color: actualColor }}>
      <Text
        style={[
          styles[actualVariant],
          actualColor ? { color: actualColor } : null,
          bold ? styles.bold : null,
          italic ? styles.italic : null,
          centered ? styles.centered : null,
          style,
        ]}
        {...props}
      >
        {children}
      </Text>
    </TextThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  centered: {
    textAlign: 'center',
  },
});