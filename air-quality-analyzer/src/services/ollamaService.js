function getSystemPrompt(roomName, timeOfDay, sensors) {
    return `You are a home air safety assistant named Aira AI.
The user is checking the air quality in the ${roomName}. The time of day is ${timeOfDay}.
Current readings:
- Radon: ${sensors.radon.value} ${sensors.radon.unit}
- Carbon Monoxide: ${sensors.co.value} ${sensors.co.unit}
- Humidity: ${sensors.humidity.value} ${sensors.humidity.unit}
- Methane: ${sensors.methane.value} ${sensors.methane.unit}
- VOCs: ${sensors.vocs.value} ${sensors.vocs.unit}
- CO2: ${sensors.co2.value} ${sensors.co2.unit}
- PM2.5: ${sensors.pm25.value} ${sensors.pm25.unit}
- Temperature: ${sensors.temp.value} ${sensors.temp.unit}

CRITICAL INSTRUCTIONS:
1. DO NOT analyze or list each sensor individually. No bullet points of sensors.
2. Look at the holistic picture. Synthesize the data to find correlations (e.g., high VOCs + high CO2 = poor ventilation; high Temp + high Humidity in a kitchen = active cooking).
3. Provide a short, conversational summary (2-3 sentences) of the overall air quality state, heavily factoring in the room (${roomName}) and time of day (${timeOfDay}).
4. Give a single, clear action plan if any action is needed (e.g., "Open a window", "Turn on the exhaust fan", "Everything looks great").
Talk like a knowledgeable, helpful friend, not a scientist. Keep it concise.`;
}

export async function analyzeAirQuality(roomName, timeOfDay, sensors) {
    const prompt = getSystemPrompt(roomName, timeOfDay, sensors);

    // We build a context query string to search the vector database accurately.
    // This picks the keys of the highest relative readings to pull relevant EPA rules.
    let dangerSensors = [];
    for (const [key, sensorInfo] of Object.entries(sensors)) {
        if (Number(sensorInfo.value) / sensorInfo.max > 0.5) {
            dangerSensors.push(key.toUpperCase());
        }
    }
    const queryContext = `Safety threshold rules and EPA regulations regarding ${dangerSensors.length > 0 ? dangerSensors.join(', ') : 'overall residential air quality'} in a ${roomName}`;

    const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, queryContext })
    });

    if (!response.ok) {
        throw new Error('RAG API failed');
    }

    const data = await response.json();
    return data.response;
}

export async function chatWithAira(messages, roomName, timeOfDay, sensors) {
    const systemPrompt = getSystemPrompt(roomName, timeOfDay, sensors);

    // Format messages for Ollama's chat API
    // Filter out any "Failed to connect" temporary messages if present
    const validMessages = messages.filter(m => !m.content.includes('API failed') && !m.content.includes('Failed to connect'));

    const payload = {
        messages: [
            { role: 'system', content: systemPrompt },
            ...validMessages
        ],
        queryContext: roomName
    };

    const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('RAG API failed');
    }

    const data = await response.json();
    return data.message.content;
}
