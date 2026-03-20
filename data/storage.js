//local storage only

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SETTINGS: 'haven_settings',
};

export const DEFAULT_SETTINGS = {
  // Airthings
  clientId:     '',
  clientSecret: '',
  connected:    false,

  // Units
  useCelsius: false,

  // Notifications
  notifs: {
    radon:    true,
    co:       true,
    humidity: true,
    aqi:      true,
    vocs:     true,
    forecast: true,
  },

  // Thresholds
  thresholds: {
    radon:    '4.0',
    co2:      '1000',
    vocs:     '500',
    humidity: '65',
    pm25:     '35',
    co:       '9',
  },

  // Household
  occupants:    '2',
  hasAsthma:    false,
  hasAllergies: false,
  hasPets:      false,
  hasInfants:   false,
};

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw);
    // Merge with defaults so new keys added in future updates
    // are always present even if not in the saved data
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch (e) {
    console.warn('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

export async function clearSettings() {
  try {
    await AsyncStorage.removeItem(KEYS.SETTINGS);
  } catch (e) {
    console.warn('Failed to clear settings:', e);
  }
}