import React, { useState, useEffect } from 'react';
import { getHistoricalData } from '../data/weather';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip } from 'chart.js';
import './HistoryPanel.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip);

const TABS = [
    { key: 'temp', label: 'Temp' },
    { key: 'humidity', label: 'Humidity' },
    { key: 'aqi', label: 'AQI' },
    { key: 'pm25', label: 'PM2.5' },
    { key: 'no2', label: 'NO₂' },
    { key: 'ozone', label: 'Ozone' },
];

const INDOOR_PLACEHOLDERS = [
    { name: 'Radon', icon: '☢️', desc: 'Connect Airthings to view 24hr radon history' },
    { name: 'CO', icon: '💨', desc: 'Connect Airthings to view carbon monoxide trends' },
    { name: 'VOCs', icon: '🧪', desc: 'Connect Airthings to view VOC history' },
    { name: 'CO₂', icon: '🌫️', desc: 'Connect Airthings to view CO₂ trends' },
    { name: 'Methane', icon: '⚗️', desc: 'Connect Airthings to view methane history' },
];

export default function HistoryPanel() {
    const [activeTab, setActiveTab] = useState('temp');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getHistoricalData()
            .then(setData)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const series = data?.series?.[activeTab];
    const labels = series ? data.labels.filter((_, i) => i % 2 === 0) : [];

    const chartData = series ? {
        labels: data.labels,
        datasets: [{
            data: series.points.map(p => p.y),
            borderColor: '#2E7D32',
            backgroundColor: 'rgba(46,125,50,0.12)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
        }]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false }, 
            tooltip: { 
                mode: 'index', 
                intersect: false, 
                backgroundColor: 'rgba(20, 83, 45, 0.9)',
                titleFont: { weight: '600' },
                padding: 12,
                cornerRadius: 8
            } 
        },
        scales: {
            x: { 
                ticks: { maxTicksLimit: 12, color: '#9CA3AF', font: { size: 11, weight: '500' } }, 
                grid: { display: false } 
            },
            y: { 
                ticks: { color: '#9CA3AF', font: { size: 11, weight: '500' }, padding: 8 }, 
                grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false } 
            }
        }
    };

    return (
        <div className="history-panel">
            <p className="section-label">Outdoor — Last 24 Hours</p>

            <div className="history-panel__tabs">
                {TABS.map(tab => (
                    <button key={tab.key} className={`history-panel__tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="history-panel__chart-card">
                {loading && <div className="history-panel__placeholder"><div className="spinner" /><span>Fetching outdoor data…</span></div>}
                {error && <div className="history-panel__placeholder history-panel__placeholder--error">{error === 'Location permission denied' ? 'Enable location to view history' : 'Could not load historical data'}</div>}
                {!loading && !error && series && (
                    <>
                        <div className="history-panel__stats">
                            {[['Low', series.stats.min], ['Average', series.stats.avg], ['High', series.stats.max]].map(([label, val], i) => (
                                <React.Fragment key={label}>
                                    {i > 0 && <div className="history-panel__stat-divider" />}
                                    <div className="history-panel__stat">
                                        <span className="history-panel__stat-label">{label}</span>
                                        <span className="history-panel__stat-val" style={label === 'Average' ? { color: '#2E7D32' } : {}}>{val}{series.unit}</span>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="history-panel__divider" />
                        <div className="history-panel__chart">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                        <p className="history-panel__x-label">{series.label} over the past 24 hours</p>
                    </>
                )}
            </div>

            <p className="section-label">Indoor Sensors</p>
            <div className="history-panel__indoor-card">
                <div className="history-panel__indoor-header">
                    <span className="history-panel__indoor-icon">📡</span>
                    <div>
                        <div className="history-panel__indoor-title">Airthings not connected</div>
                        <div className="history-panel__indoor-sub">Connect your sensor to unlock indoor history</div>
                    </div>
                </div>
                <div className="history-panel__divider" />
                {INDOOR_PLACEHOLDERS.map((item, i) => (
                    <div key={i} className="history-panel__indoor-row">
                        <span className="history-panel__indoor-row-icon">{item.icon}</span>
                        <div style={{ flex: 1 }}>
                            <div className="history-panel__indoor-row-name">{item.name}</div>
                            <div className="history-panel__indoor-row-desc">{item.desc}</div>
                        </div>
                        <span className="history-panel__locked-badge">Locked</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
