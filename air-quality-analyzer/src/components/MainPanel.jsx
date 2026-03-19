import React, { useState } from 'react';
import { analyzeAirQuality, chatWithAira } from '../services/ollamaService';

function SensorCard({ title, data, onUpdate }) {
    const percentage = Math.min(100, (Number(data.value) / data.max) * 100);
    let statusColor = '#22C55E';
    if (percentage > 50) statusColor = '#F59E0B';
    if (percentage > 80) statusColor = '#EF4444';

    return (
        <div className="sensor-card">
            <div className="sensor-header">{title}</div>
            <div className="sensor-input-wrapper">
                <input
                    type="number"
                    className="sensor-input"
                    value={data.value}
                    onChange={(e) => onUpdate(e.target.value)}
                    step="0.1"
                />
                <span className="sensor-unit">{data.unit}</span>
            </div>
            <div className="sensor-status" style={{ color: statusColor, marginBottom: '8px' }}>{data.statusText}</div>
            <div className="sensor-bar-container">
                <div className="sensor-bar-bg">
                    <div className="sensor-bar-fill" style={{ width: `${percentage}%`, backgroundColor: statusColor }}></div>
                </div>
            </div>
        </div>
    );
}

export default function MainPanel({ activeRoom, sensors, onUpdateSensor }) {
    const [timeOfDay, setTimeOfDay] = useState('11:48 AM');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');

    const handleAnalyze = async () => {
        setLoading(true);
        setMessages([{ role: 'assistant', content: 'Analyzing with Aira AI...' }]);
        try {
            const result = await analyzeAirQuality(activeRoom.name, timeOfDay, sensors);
            setMessages([{ role: 'assistant', content: result }]);
        } catch (err) {
            setMessages([{ role: 'assistant', content: 'Failed to connect to local Ollama API' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || loading) return;
        const newMessages = [...messages, { role: 'user', content: inputText }];
        setMessages(newMessages);
        setInputText('');
        setLoading(true);

        try {
            const result = await chatWithAira(newMessages, activeRoom.name, timeOfDay, sensors);
            setMessages([...newMessages, { role: 'assistant', content: result }]);
        } catch (err) {
            setMessages([...newMessages, { role: 'assistant', content: 'Failed to connect to API.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="main-panel">
            <div className="header">
                <div>
                    <h1>{activeRoom.name} — <span style={{ color: '#22C55E' }}>All clear</span></h1>
                    <div className="header-meta">
                        <span>Live sensor readings</span>
                        <span>•</span>
                        <input type="text" className="time-input" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
                        <span>(Time)</span>
                    </div>
                </div>
            </div>

            <div className="sensor-grid">
                <SensorCard title="Radon" data={sensors.radon} onUpdate={(val) => onUpdateSensor('radon', val)} />
                <SensorCard title="CO" data={sensors.co} onUpdate={(val) => onUpdateSensor('co', val)} />
                <SensorCard title="Humidity" data={sensors.humidity} onUpdate={(val) => onUpdateSensor('humidity', val)} />
                <SensorCard title="Methane" data={sensors.methane} onUpdate={(val) => onUpdateSensor('methane', val)} />
                <SensorCard title="VOCs" data={sensors.vocs} onUpdate={(val) => onUpdateSensor('vocs', val)} />
                <SensorCard title="CO₂" data={sensors.co2} onUpdate={(val) => onUpdateSensor('co2', val)} />
                <SensorCard title="PM2.5" data={sensors.pm25} onUpdate={(val) => onUpdateSensor('pm25', val)} />
                <SensorCard title="Temp" data={sensors.temp} onUpdate={(val) => onUpdateSensor('temp', val)} />
            </div>

            <button className="ai-ribbon" onClick={handleAnalyze} disabled={loading}>
                {loading && messages.length === 0 ? 'Analyzing...' : 'Ask AI what this means'}
            </button>

            {messages.length > 0 && (
                <div className="chat-section">
                    <div className="chat-header">Aira AI</div>
                    <div className="chat-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} className="chat-bubble" style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                backgroundColor: msg.role === 'user' ? '#E5E7EB' : 'var(--accent-green)',
                                color: msg.role === 'user' ? 'black' : 'white',
                            }}>
                                {msg.content}
                            </div>
                        ))}
                    </div>
                    <div className="chat-input-area">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder={`Ask anything about the ${activeRoom.name}...`}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={loading}
                        />
                        <button className="chat-send" onClick={handleSend} disabled={loading || !inputText.trim()}>
                            Send
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
