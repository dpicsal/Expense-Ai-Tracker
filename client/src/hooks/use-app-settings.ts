import { useState, useEffect } from 'react';

interface AppSettings {
  allowCategoryManagement: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  allowCategoryManagement: true,
};

const SETTINGS_KEY = 'app-settings';

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load app settings:', error);
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.warn('Failed to save app settings:', error);
    }
  };

  return {
    settings,
    updateSettings,
  };
}