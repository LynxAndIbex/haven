function getSystemPrompt(roomName, timeOfDay, sensors, weatherContext) {
    const sensorLines = Object.values(sensors).map((s) => `- ${s.name}: ${s.value} ${s.unit}`).join('\n');
    const weatherSection = weatherContext ? `\n\nOutdoor context (from real-time weather API):\n${weatherContext}` : '';
    return `You are a home air safety assistant named Aira AI.
The user is checking the air quality in the ${roomName}. The time of day is ${timeOfDay}.
Current indoor readings:
${sensorLines}${weatherSection}

CRITICAL INSTRUCTIONS:
1. ALWAYS prioritize and mention any sensors with high or dangerous levels (e.g., Radon >= 4, CO >= 9, CO2 > 1000).
2. DO NOT list sensors that are at normal/safe levels unless they contribute to a pattern.
3. If there are dangerous levels, explain the specific health risks and provide a clear, immediate action plan.
4. Keep the summary conversational and concise (usually 3-4 sentences), but extend as needed if multiple hazards exist.
5. Talk like a knowledgeable, helpful friend. Avoid sounding like a generic chatbot.`;
}

export async function analyzeAirQuality(roomName, timeOfDay, sensors, weatherContext) {
    const prompt = getSystemPrompt(roomName, timeOfDay, sensors, weatherContext);

    const dangerSensors = Object.entries(sensors)
        .filter(([, s]) => Number(s.value) / (s.max || 100) > 0.5)
        .map(([k]) => k.toUpperCase());
    const queryContext = `Safety threshold rules and EPA regulations regarding ${dangerSensors.length > 0 ? dangerSensors.join(', ') : 'overall residential air quality'} in a ${roomName}`;

    const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, queryContext })
    });
    if (!response.ok) throw new Error('RAG API failed');
    const data = await response.json();
    return data.response;
}

export async function chatWithAira(messages, roomName, timeOfDay, sensors, weatherContext) {
    const systemPrompt = getSystemPrompt(roomName, timeOfDay, sensors, weatherContext);
    const validMessages = messages.filter(m => !m.content.includes('API failed') && !m.content.includes('Failed to connect'));

    const payload = {
        messages: [
            { role: 'system', content: systemPrompt },
            ...validMessages
        ],
        queryContext: `${roomName} outdoor conditions`
    };

    const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('RAG API failed');
    const data = await response.json();
    return data.message.content;
}
