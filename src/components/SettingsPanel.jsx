import React from 'react';
import { useSettings } from '../context/SettingsContext';
import './SettingsPanel.css';

const ALERT_THRESHOLDS = [
    { key: 'radon', label: 'Radon', unit: 'pCi/L', desc: 'EPA action level is 4.0' },
    { key: 'co2', label: 'CO₂', unit: 'ppm', desc: 'Above 1000 affects focus' },
    { key: 'vocs', label: 'VOCs', unit: 'ppb', desc: 'Above 500 warrants investigation' },
    { key: 'humidity', label: 'Humidity', unit: '%', desc: 'Above 65% risks mold growth' },
    { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', desc: 'EPA 24hr standard is 35' },
    { key: 'co', label: 'CO', unit: 'ppm', desc: 'EPA standard is 9 ppm' },
];

const NOTIFICATIONS = [
    { key: 'radon', label: 'Radon alerts', desc: 'Notify when radon exceeds threshold' },
    { key: 'co', label: 'Carbon monoxide alerts', desc: 'Immediate alert for CO spikes' },
    { key: 'humidity', label: 'Humidity / mold risk', desc: 'Alert when mold conditions develop' },
    { key: 'aqi', label: 'Outdoor air quality', desc: 'Notify on poor outdoor AQI days' },
    { key: 'vocs', label: 'VOC alerts', desc: 'Notify when VOCs exceed threshold' },
    { key: 'forecast', label: 'Daily forecast digest', desc: 'Morning summary of Haven risk forecast' },
];

const HOUSEHOLD = [
    { key: 'hasAsthma', label: 'Asthma or respiratory conditions' },
    { key: 'hasAllergies', label: 'Seasonal allergies' },
    { key: 'hasPets', label: 'Pets in home' },
    { key: 'hasInfants', label: 'Infants or young children' },
];

const DATA_SOURCES = [
    { name: 'Open-Meteo', desc: 'Weather & outdoor air quality', url: 'open-meteo.com', free: true },
    { name: 'Ollama', desc: 'Local AI assistant', url: 'localhost:11434', free: true },
    { name: 'RAG Engine', desc: 'EPA document knowledge base', url: 'localhost:3001', free: true },
];

function fToC(f) {
    return Math.round((parseFloat(f) - 32) * 5 / 9 * 10) / 10;
}

export default function SettingsPanel() {
    const { settings, updateSettings, resetSettings } = useSettings();

    const toggleNotif = (key) => updateSettings({ notifs: { ...settings.notifs, [key]: !settings.notifs[key] } });
    const updateThreshold = (key, val) => updateSettings({ thresholds: { ...settings.thresholds, [key]: val } });

    return (
        <div className="settings-panel">
            {/* UNITS */}
            <p className="section-label">Units</p>
            <div className="settings-card">
                <div className="settings-row">
                    <div>
                        <div className="settings-row-title">Temperature unit</div>
                        <div className="settings-row-sub">{settings.useCelsius ? `Showing °C — e.g. ${fToC(71)}°C indoors` : 'Showing °F — e.g. 71°F indoors'}</div>
                    </div>
                    <div className="unit-toggle">
                        <button className={`unit-btn ${!settings.useCelsius ? 'active' : ''}`} onClick={() => updateSettings({ useCelsius: false })}>°F</button>
                        <button className={`unit-btn ${settings.useCelsius ? 'active' : ''}`} onClick={() => updateSettings({ useCelsius: true })}>°C</button>
                    </div>
                </div>
            </div>

            {/* ALERT THRESHOLDS */}
            <p className="section-label">Alert Thresholds</p>
            <div className="settings-card">
                <p className="settings-card-desc">Haven will alert you when indoor readings exceed these values.</p>
                {ALERT_THRESHOLDS.map((t, i) => (
                    <React.Fragment key={t.key}>
                        {i > 0 && <div className="settings-divider" />}
                        <div className="settings-row">
                            <div>
                                <div className="settings-row-title">{t.label}</div>
                                <div className="settings-row-sub">{t.desc}</div>
                            </div>
                            <div className="threshold-input">
                                <input
                                    className="threshold-field"
                                    type="number"
                                    value={settings.thresholds[t.key]}
                                    onChange={e => updateThreshold(t.key, e.target.value)}
                                />
                                <span className="threshold-unit">{t.unit}</span>
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {/* NOTIFICATIONS */}
            <p className="section-label">Notifications</p>
            <div className="settings-card">
                {NOTIFICATIONS.map((n, i) => (
                    <React.Fragment key={n.key}>
                        {i > 0 && <div className="settings-divider" />}
                        <div className="settings-row">
                            <div>
                                <div className="settings-row-title">{n.label}</div>
                                <div className="settings-row-sub">{n.desc}</div>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={!!settings.notifs[n.key]} onChange={() => toggleNotif(n.key)} />
                                <span className="toggle-track" />
                            </label>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {/* HOUSEHOLD PROFILE */}
            <p className="section-label">Household Profile</p>
            <div className="settings-card">
                <p className="settings-card-desc">Haven AI uses this to personalize health recommendations.</p>
                <div className="settings-row">
                    <div className="settings-row-title">Number of occupants</div>
                    <input className="threshold-field" type="number" value={settings.occupants} onChange={e => updateSettings({ occupants: e.target.value })} style={{ width: 60 }} />
                </div>
                <div className="settings-divider" />
                {HOUSEHOLD.map((item, i) => (
                    <React.Fragment key={item.key}>
                        {i > 0 && <div className="settings-divider" />}
                        <div className="settings-row">
                            <div className="settings-row-title" style={{ flex: 1 }}>{item.label}</div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={!!settings[item.key]} onChange={() => updateSettings({ [item.key]: !settings[item.key] })} />
                                <span className="toggle-track" />
                            </label>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {/* DATA SOURCES */}
            <p className="section-label">Data Sources</p>
            <div className="settings-card">
                {DATA_SOURCES.map((src, i) => (
                    <React.Fragment key={src.name}>
                        {i > 0 && <div className="settings-divider" />}
                        <div className="settings-row">
                            <div>
                                <div className="settings-row-title">{src.name}</div>
                                <div className="settings-row-sub">{src.desc}</div>
                                <div className="settings-source-url">{src.url}</div>
                            </div>
                            <span className="settings-free-badge" style={{ backgroundColor: src.free ? '#EDF7EE' : '#F5F5F5', color: src.free ? '#2E7D32' : '#888' }}>{src.free ? 'Free' : 'API key'}</span>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {/* ABOUT */}
            <p className="section-label">About</p>
            <div className="settings-card">
                <div className="settings-row">
                    <span className="settings-row-title">Version</span>
                    <span className="settings-row-sub">v1.0.0</span>
                </div>
                <div className="settings-divider" />
                <div className="settings-row">
                    <span className="settings-row-title">AI model</span>
                    <span className="settings-row-sub">Llama 3.1 via Ollama (local)</span>
                </div>
                <div className="settings-divider" />
                <div className="settings-row">
                    <span className="settings-row-title">Weather data</span>
                    <span className="settings-row-sub">Open-Meteo (no key required)</span>
                </div>
                <div className="settings-divider" />
                <button className="settings-reset-btn" onClick={resetSettings}>Reset all settings</button>
            </div>
        </div>
    );
}
