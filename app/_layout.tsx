import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '../constants/Colors';

// Component to inject global styles for the web scrollbar
const GlobalStyles = ({ accentColor }: { accentColor: string }) => {
  if (Platform.OS !== 'web') {
    return null;
  }

  const styles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: ${accentColor};
      border-radius: 4px;
      border: 2px solid transparent;
      background-clip: content-box;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: ${accentColor}dd;
    }
  `;

  return <style type="text/css">{styles}</style>;
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Use a fallback for the accent color if the theme tint is invalid
  const accentColor = Colors[colorScheme ?? 'light'].tint !== '#'
    ? Colors[colorScheme ?? 'light'].tint
    : Colors.dark.tint; // Fallback to a valid color

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GlobalStyles accentColor={accentColor} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
