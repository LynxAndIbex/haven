import React from 'react';
import './WeatherStrip.css';

export default function WeatherStrip({ weather, loading, error }) {
    if (loading) return (
        <div className="weather-strip weather-strip--loading">
            <div className="weather-strip__spinner" />
            <span>Fetching outdoor conditions…</span>
        </div>
    );

    if (error || !weather) return (
        <div className="weather-strip weather-strip--error">
            <span>⚠️ {error === 'Location permission denied' ? 'Enable location to see outdoor conditions' : error || 'Weather data unavailable'}</span>
        </div>
    );

    return (
        <div className="weather-strip">
            <div className="weather-strip__row weather-strip__row--main">
                <div className="weather-strip__temp-block">
                    <span className="weather-strip__temp">{weather.temp}°</span>
                    <div>
                        <div className="weather-strip__condition">{weather.condition}</div>
                        <div className="weather-strip__feels">Feels like {weather.feelsLike}°F</div>
                    </div>
                </div>
                <div className="weather-strip__aqi-badge" style={{ backgroundColor: weather.aqiBg }}>
                    <span className="weather-strip__aqi-label">AQI</span>
                    <span className="weather-strip__aqi-val" style={{ color: weather.aqiColor }}>{weather.aqi ?? '--'}</span>
                    <span className="weather-strip__aqi-status" style={{ color: weather.aqiColor }}>{weather.aqiLabel}</span>
                </div>
            </div>

            <div className="weather-strip__divider" />

            <div className="weather-strip__stats">
                <div className="weather-strip__stat">
                    <span className="weather-strip__stat-label">Humidity</span>
                    <span className="weather-strip__stat-val">{weather.humidity}%</span>
                </div>
                <div className="weather-strip__stat-divider" />
                <div className="weather-strip__stat">
                    <span className="weather-strip__stat-label">Pollen</span>
                    <span className="weather-strip__stat-val" style={{ color: weather.pollenColor }}>{weather.pollenLabel}</span>
                </div>
                <div className="weather-strip__stat-divider" />
                <div className="weather-strip__stat">
                    <span className="weather-strip__stat-label">Rain</span>
                    <span className="weather-strip__stat-val">{weather.rainProb}%</span>
                </div>
                <div className="weather-strip__stat-divider" />
                <div className="weather-strip__stat">
                    <span className="weather-strip__stat-label">PM2.5 out</span>
                    <span className="weather-strip__stat-val">{weather.pm25} µg</span>
                </div>
            </div>

            <div className="weather-strip__divider" />

            <div className="weather-strip__forecast">
                {['Today', 'Tomorrow', 'Day 3'].map((label, i) => (
                    <div key={i} className="weather-strip__forecast-day">
                        <span className="weather-strip__forecast-label">{label}</span>
                        <span className="weather-strip__forecast-rain">{weather.forecast[i].rainProb}% rain</span>
                        <span className="weather-strip__forecast-temp">{weather.forecast[i].tempMax}° / {weather.forecast[i].tempMin}°</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
