import React from 'react';
import { supabase } from '../data/supabase';

const SettingsContext = React.createContext(null);

export const DEFAULT_SETTINGS = {
  useCelsius:   false,
  occupants:    '2',
  hasAsthma:    false,
  hasAllergies: false,
  hasPets:      false,
  hasInfants:   false,
  notifs: {
    radon:    true,
    co:       true,
    humidity: true,
    aqi:      true,
    vocs:     true,
    forecast: true,
  },
  thresholds: {
    radon:    '4.0',
    co2:      '1000',
    vocs:     '500',
    humidity: '65',
    pm25:     '35',
    co:       '9',
  },
  clientId:    '',
  clientSecret:'',
  connected:   false,
};

function dbToSettings(row) {
  if (!row) return DEFAULT_SETTINGS;
  return {
    useCelsius:   row.use_celsius          ?? false,
    occupants:    row.occupants            ?? '2',
    hasAsthma:    row.has_asthma           ?? false,
    hasAllergies: row.has_allergies        ?? false,
    hasPets:      row.has_pets             ?? false,
    hasInfants:   row.has_infants          ?? false,
    notifs:       row.notifs               ?? DEFAULT_SETTINGS.notifs,
    thresholds:   row.thresholds           ?? DEFAULT_SETTINGS.thresholds,
    clientId:     row.airthings_client_id     ?? '',
    clientSecret: row.airthings_client_secret ?? '',
    connected:    row.airthings_connected     ?? false,
  };
}

function settingsToDb(settings) {
  return {
    use_celsius:             settings.useCelsius,
    occupants:               settings.occupants,
    has_asthma:              settings.hasAsthma,
    has_allergies:           settings.hasAllergies,
    has_pets:                settings.hasPets,
    has_infants:             settings.hasInfants,
    notifs:                  settings.notifs,
    thresholds:              settings.thresholds,
    airthings_client_id:     settings.clientId,
    airthings_client_secret: settings.clientSecret,
    airthings_connected:     settings.connected,
    updated_at:              new Date().toISOString(),
  };
}

export function SettingsProvider({ children }) {
  const [session,  setSession]  = React.useState(null);
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [loading,  setLoading]  = React.useState(true);

  const loadSettings = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', userId)
        .single();
      console.log('Load settings result:', JSON.stringify({ data, error }));
      if (!error && data) setSettings(dbToSettings(data));
    } catch (e) {
      console.warn('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Got session on mount:', session?.user?.email ?? 'none');
      setSession(session);
      if (session) {
        loadSettings(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Auth state change:', _event, session?.user?.email ?? 'none');
        setSession(session);
        if (session) {
          loadSettings(session.user.id);
        } else {
          setSettings(DEFAULT_SETTINGS);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const updateSettings = async (patch) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    if (!session?.user?.id) return;
    try {
      const { error } = await supabase
        .from('settings')
        .update(settingsToDb(updated))
        .eq('id', session.user.id);
      if (error) console.warn('Failed to save settings:', error);
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  };

  const resetSettings = async () => {
    setSettings({ ...DEFAULT_SETTINGS });
    if (!session?.user?.id) return;
    try {
      await supabase
        .from('settings')
        .update(settingsToDb(DEFAULT_SETTINGS))
        .eq('id', session.user.id);
    } catch (e) {
      console.warn('Failed to reset settings:', e);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SettingsContext.Provider value={{
      session,
      settings,
      loading,
      updateSettings,
      resetSettings,
      signOut,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}