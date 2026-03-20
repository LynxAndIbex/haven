import React, { createContext, useContext, useState } from 'react';

const DEFAULT = {
    useCelsius: false,
    occupants: '2',
    hasAsthma: false, hasAllergies: false, hasPets: false, hasInfants: false,
    notifs: { radon: true, co: true, humidity: false, aqi: true, vocs: false, forecast: false },
    thresholds: { radon: '4.0', co2: '1000', vocs: '500', humidity: '65', pm25: '35', co: '9' },
};

function load() {
    try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem('haven-settings') || '{}') }; }
    catch { return DEFAULT; }
}

const SettingsCtx = createContext(null);

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(load);
    const updateSettings = (patch) => setSettings(prev => {
        const next = { ...prev, ...patch };
        localStorage.setItem('haven-settings', JSON.stringify(next));
        return next;
    });
    const resetSettings = () => { setSettings(DEFAULT); localStorage.removeItem('haven-settings'); };
    return <SettingsCtx.Provider value={{ settings, updateSettings, resetSettings }}>{children}</SettingsCtx.Provider>;
}

export function useSettings() { return useContext(SettingsCtx); }
