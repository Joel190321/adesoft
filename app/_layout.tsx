import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SettingsProvider } from '@/hooks/useSettings';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeStorage } from '@/lib/storage';
import { Platform } from 'react-native';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3498db',
    secondary: '#2ecc71',
    error: '#e74c3c',
  },
};

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Initialize storage on app start (only for web)
    if (Platform.OS === 'web') {
      initializeStorage();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <SettingsProvider>
          <>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </>
        </SettingsProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}