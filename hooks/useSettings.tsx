import { useState, useEffect, createContext, useContext } from 'react';
import { SettingsAPI } from '@/lib/api/settings';
import { Settings } from '@/types/database';

interface SettingsContextType {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  isLoading: true,
  error: null,
  refresh: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await SettingsAPI.getSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Error cargando configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    await loadSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, error, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}