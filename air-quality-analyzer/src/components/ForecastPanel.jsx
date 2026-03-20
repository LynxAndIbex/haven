import React, { useState, useEffect } from 'react';
import { getForecastData } from '../data/weather';
import './ForecastPanel.css';

const RISK_COLORS = { 'Low': '#2E7D32', 'Moderate': '#C45C00', 'High': '#C62828', 'Very High': '#C62828' };
const RISK_BG = { 'Low': '#EDF7EE', 'Moderate': '#FFF3E0', 'High': '#FFEBEE', 'Very High': '#FFEBEE' };

const RISK_ALERTS = [
    { key: 'moldRisk', icon: '🍄', label: 'Mold Risk', tip: { Moderate: 'Run dehumidifier in basement and attic.', High: 'Check all room ventilation. Run dehumidifier continuously.' } },
    { key: 'allergenRisk', icon: '🌿', label: 'Allergen / Pollen', tip: { Moderate: 'Consider keeping windows closed.', High: 'Keep windows closed. Run HEPA purifier.', 'Very High': 'Keep all windows closed. Avoid outdoor exposure.' } },
    { key: 'smokeRisk', icon: '🔥', label: 'Smoke / AQI Risk', tip: { Moderate: 'Limit outdoor time. Keep windows closed.', High: 'Stay indoors. Run air purifier on high.' } },
    { key: 'pipeFreezeRisk', icon: '❄️', label: 'Pipe Freeze Risk', tip: { Moderate: 'Insulate exposed pipes. Let faucets drip overnight.', High: 'High freeze risk — insulate pipes immediately.' } },
];

export default function ForecastPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeDay, setActiveDay] = useState(0);

    useEffect(() => {
        getForecastData()
            .then(setData)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const day = data?.days?.[activeDay];

    if (loading) return <div className="forecast-panel forecast-panel--loading"><div className="spinner" /><span>Loading 7-day forecast…</span></div>;
    if (error) return <div className="forecast-panel forecast-panel--error">⚠️ {error === 'Location permission denied' ? 'Enable location to see forecast' : 'Could not load forecast data'}</div>;

    return (
        <div className="forecast-panel">
            <p className="section-label">7-Day Outlook</p>
            <div className="forecast-panel__day-strip">
                {data.days.map((d, i) => (
                    <button key={i} className={`forecast-panel__day-pill ${activeDay === i ? 'active' : ''}`} onClick={() => setActiveDay(i)}>
                        <span className="forecast-panel__day-label">{d.dayLabel}</span>
                        <span className="forecast-panel__day-condition">{d.condition}</span>
                        <span className="forecast-panel__day-temp">{d.tempMax}°/{d.tempMin}°</span>
                        <span className="forecast-panel__day-rain">💧{d.rainProb}%</span>
                    </button>
                ))}
            </div>

            {day && (
                <>
                    <div className="forecast-panel__summary-card">
                        <div className="forecast-panel__summary-top">
                            <div>
                                <div className="forecast-panel__summary-day">{day.dayLabel}</div>
                                <div className="forecast-panel__summary-condition">{day.condition}</div>
                            </div>
                            <div className="forecast-panel__summary-temps">
                                <span className="forecast-panel__temp-high">{day.tempMax}°</span>
                                <span className="forecast-panel__temp-low">{day.tempMin}°</span>
                            </div>
                        </div>
                        <div className="forecast-panel__divider" />
                        <div className="forecast-panel__summary-stats">
                            {[['Rain', `${day.rainProb}%`], ['Humidity', `${day.humidity}%`], ['Wind', `${day.wind} mph`], ['AQI', day.aqi]].map(([label, val], i) => (
                                <React.Fragment key={label}>
                                    {i > 0 && <div className="forecast-panel__stat-divider" />}
                                    <div className="forecast-panel__stat">
                                        <span className="forecast-panel__stat-label">{label}</span>
                                        <span className="forecast-panel__stat-val">{val}</span>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <p className="section-label">Haven Risk Forecast</p>
                    <div className="forecast-panel__risks-card">
                        {RISK_ALERTS.map((alert, i) => {
                            const level = day[alert.key];
                            const tip = alert.tip?.[level];
                            return (
                                <React.Fragment key={alert.key}>
                                    {i > 0 && <div className="forecast-panel__divider" />}
                                    <div className="forecast-panel__risk-row">
                                        <span className="forecast-panel__risk-icon">{alert.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div className="forecast-panel__risk-top">
                                                <span className="forecast-panel__risk-label">{alert.label}</span>
                                                <span className="forecast-panel__risk-badge" style={{ backgroundColor: RISK_BG[level], color: RISK_COLORS[level] }}>{level}</span>
                                            </div>
                                            {tip && <div className="forecast-panel__tip">💡 {tip}</div>}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <p className="section-label">Indoor Impact</p>
                    <div className="forecast-panel__indoor-card">
                        <span className="forecast-panel__indoor-icon">🏠</span>
                        <div>
                            <div className="forecast-panel__indoor-title">
                                {day.rainProb > 60 ? 'High rain expected — watch basement humidity' : day.tempMax > 90 ? 'Hot day — indoor cooling load will be high' : day.tempMin < 35 ? 'Near-freezing overnight — check pipe insulation' : 'Outdoor conditions look manageable today'}
                            </div>
                            <div className="forecast-panel__indoor-sub">
                                {day.rainProb > 60 ? 'Run your dehumidifier before the rain arrives. Check attic and basement vents.' : day.tempMax > 90 ? 'Keep windows closed during peak heat. AC will help control indoor humidity.' : day.tempMin < 35 ? 'Let faucets drip overnight in unheated areas. Check crawl space insulation.' : 'Good day to ventilate — open windows during cooler morning hours.'}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
