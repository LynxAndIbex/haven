import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import WeatherStrip from './components/WeatherStrip';
import ForecastPanel from './components/ForecastPanel';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import { SettingsProvider } from './context/SettingsContext';
import { analyzeAirQuality, chatWithAira } from './services/ollamaService';
import { SCENARIOS, SCENARIO_LABELS } from './data/scenarios';
import { getWeatherData, buildWeatherContext } from './data/weather';

const ROOMS = [
  { id: 'kitchen', name: 'Kitchen', iconType: 'pan' },
  { id: 'bedroom', name: 'Bedroom', iconType: 'bed' },
  { id: 'basement', name: 'Basement', iconType: 'stairs' },
  { id: 'attic', name: 'Attic', iconType: 'triangle' },
  { id: 'garage', name: 'Garage', iconType: 'car' },
  { id: 'living', name: 'Living Room', iconType: 'sofa' },
];

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'forecast', label: 'Forecast', icon: '📅' },
  { key: 'history', label: 'History', icon: '📈' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

const STATUS_COLORS = { good: '#2E7D32', warn: '#C45C00', danger: '#C62828' };
const STATUS_BG = { good: '#EDF7EE', warn: '#FFF3E0', danger: '#FFEBEE' };

function SensorCard({ metric, onValueChange }) {
  return (
    <div className={`sensor-card sensor-card--${metric.cls}`}>
      <div className="sensor-header">{metric.name}</div>
      <div className="sensor-input-wrapper">
        <input 
          type="number" 
          className="sensor-input" 
          style={{ color: STATUS_COLORS[metric.cls] }}
          value={metric.val}
          onChange={(e) => onValueChange(metric.name, parseFloat(e.target.value) || 0)}
        />
        <span className="sensor-unit">{metric.unit}</span>
      </div>
      <div className="sensor-status" style={{ color: STATUS_COLORS[metric.cls] }}>{metric.status}</div>
      <div className="sensor-bar-container">
        <div className="sensor-bar-bg">
          <div className="sensor-bar-fill" style={{ width: `${metric.bar}%`, backgroundColor: STATUS_COLORS[metric.cls] }} />
        </div>
      </div>
    </div>
  );
}

function HomeTab({ activeRoom, setActiveRoom }) {
  const [metrics, setMetrics] = useState(SCENARIOS.normal.metrics);
  const [timeOfDay, setTimeOfDay] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatBodyRef = useRef(null);

  const calculateStatus = (name, val) => {
    if (name === 'Radon') {
      if (val >= 4) return { status: 'Elevated (Action)', cls: 'danger', bar: Math.min(val * 10, 100) };
      if (val >= 2) return { status: 'Monitor', cls: 'warn', bar: val * 20 };
      return { status: 'Normal', cls: 'good', bar: val * 20 };
    }
    if (name === 'CO') {
      if (val >= 35) return { status: 'Dangerous', cls: 'danger', bar: 100 };
      if (val >= 9) return { status: 'Elevated', cls: 'warn', bar: 50 };
      return { status: 'None detected', cls: 'good', bar: 0 };
    }
    if (name === 'CO₂') {
      if (val > 2000) return { status: 'Very High', cls: 'danger', bar: 100 };
      if (val > 1000) return { status: 'High', cls: 'warn', bar: 70 };
      return { status: 'Good', cls: 'good', bar: Math.min(val / 10, 100) };
    }
    if (name === 'PM2.5') {
      if (val > 55) return { status: 'Hazardous', cls: 'danger', bar: 100 };
      if (val > 12) return { status: 'Moderate', cls: 'warn', bar: 50 };
      return { status: 'Excellent', cls: 'good', bar: Math.min(val * 2, 100) };
    }
    if (name === 'VOCs') {
      if (val > 1000) return { status: 'Dangerous', cls: 'danger', bar: 100 };
      if (val > 500) return { status: 'High', cls: 'warn', bar: 70 };
      return { status: 'Low', cls: 'good', bar: Math.min(val / 5, 100) };
    }
    if (name === 'Methane') {
      if (val > 1000) return { status: 'DANGEROUS', cls: 'danger', bar: 100 };
      if (val > 500) return { status: 'Elevated', cls: 'warn', bar: 50 };
      return { status: 'None detected', cls: 'good', bar: 0 };
    }
    return { status: 'Normal', cls: 'good', bar: 50 };
  };

  const handleValueChange = (name, val) => {
    const { status, cls, bar } = calculateStatus(name, val);
    setMetrics(prev => prev.map(m => m.name === name ? { ...m, val, status, cls, bar } : m));
  };

  useEffect(() => {
    getWeatherData()
      .then(data => { setWeather(data); setWeatherLoading(false); })
      .catch(err => { setWeatherError(err.message); setWeatherLoading(false); });
  }, []);

  useEffect(() => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [messages]);

  const weatherCtx = buildWeatherContext(weather);

  const handleAnalyze = async () => {
    setAiLoading(true);
    setMessages([{ role: 'assistant', content: 'Analyzing with Aira AI...' }]);
    try {
      const result = await analyzeAirQuality(activeRoom.name, timeOfDay, metrics.reduce((acc, m) => {
        acc[m.name.toLowerCase().replace('.', '')] = { name: m.name, value: m.val, unit: m.unit, statusText: m.status, max: 100 };
        return acc;
      }, {}), weatherCtx);
      setMessages([{ role: 'assistant', content: result }]);
    } catch {
      setMessages([{ role: 'assistant', content: 'Could not connect to local Ollama API. Make sure Ollama is running.' }]);
    } finally { setAiLoading(false); }
  };

  const handleSend = async () => {
    if (!inputText.trim() || aiLoading) return;
    const newMsgs = [...messages, { role: 'user', content: inputText }];
    setMessages(newMsgs);
    setInputText('');
    setAiLoading(true);
    try {
      const sensorContext = metrics.reduce((acc, m) => {
        acc[m.name.toLowerCase().replace('.', '')] = { name: m.name, value: m.val, unit: m.unit, statusText: m.status, max: 100 };
        return acc;
      }, {});
      const result = await chatWithAira(newMsgs, activeRoom.name, timeOfDay, sensorContext, weatherCtx);
      setMessages([...newMsgs, { role: 'assistant', content: result }]);
    } catch {
      setMessages([...newMsgs, { role: 'assistant', content: 'Could not connect to API.' }]);
    } finally { setAiLoading(false); }
  };

  return (
    <>
      {/* ROOM STRIP */}
      <div className="room-strip">
        {ROOMS.map(room => (
          <button key={room.id} className={`room-pill ${activeRoom.id === room.id ? 'active' : ''}`} onClick={() => setActiveRoom(room)}>
            {room.name}
          </button>
        ))}
      </div>

      {/* HERO CARD */}
      <div className="hero-card">
        <div className="hero-top">
          <div style={{ flex: 1 }}>
            <div className="hero-room">{activeRoom.name}</div>
            <div className="hero-status">Monitoring Live — <span style={{ color: STATUS_COLORS.good, fontWeight: 600 }}>Connected</span></div>
          </div>
          <input 
            type="time" 
            className="time-input" 
            value={timeOfDay} 
            onChange={(e) => setTimeOfDay(e.target.value)} 
          />
        </div>
        <div className="hero-meta">Manual data entry enabled · 8 sensors active</div>
      </div>


      {/* WEATHER */}
      <p className="section-label">Outdoor Conditions</p>
      <WeatherStrip weather={weather} loading={weatherLoading} error={weatherError} />

      {/* SENSOR GRID */}
      <p className="section-label">Sensor Readings</p>
      <div className="sensor-grid">
        {metrics.map((m, i) => <SensorCard key={i} metric={m} onValueChange={handleValueChange} />)}
      </div>

      {/* AI BUTTON */}
      <button className="ai-ribbon" onClick={handleAnalyze} disabled={aiLoading}>
        {aiLoading && messages.length === 0 ? 'Analyzing…' : 'Ask AI what this means'}
      </button>

      {/* CHAT */}
      {messages.length > 0 && (
        <div className="chat-section">
          <div className="chat-header">Aira AI</div>
          <div className="chat-body" ref={chatBodyRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} className="chat-bubble" style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.role === 'user' ? '#E5E7EB' : 'var(--accent-green)',
                color: msg.role === 'user' ? '#1F2937' : 'white',
              }}>{msg.content}</div>
            ))}
          </div>
          <div className="chat-input-area">
            <input className="chat-input" placeholder={`Ask about the ${activeRoom.name}…`}
              value={inputText} onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={aiLoading} />
            <button className="chat-send" onClick={handleSend} disabled={aiLoading || !inputText.trim()}>Send</button>
          </div>
        </div>
      )}

    </>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeRoom, setActiveRoom] = useState(ROOMS[0]);

  return (
    <SettingsProvider>
      <div className="app-container">
        <Sidebar rooms={ROOMS} activeRoom={activeRoom} setActiveRoom={setActiveRoom} onTabChange={setActiveTab} />
        <main className="main-panel">
          {/* TOP NAV TABS */}
          <div className="tab-nav">
            {TABS.map(tab => (
              <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'home' && <HomeTab activeRoom={activeRoom} setActiveRoom={setActiveRoom} />}
            {activeTab === 'forecast' && <ForecastPanel />}
            {activeTab === 'history' && <HistoryPanel />}
            {activeTab === 'settings' && <SettingsPanel />}
          </div>
        </main>
      </div>
    </SettingsProvider>
  );
}

export default App;
