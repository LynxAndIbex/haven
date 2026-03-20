const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const AQ_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

function getPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
        navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error('Location permission denied')));
    });
}

export async function getWeatherData() {
    const pos = await getPosition();
    const { latitude, longitude } = pos.coords;

    const [weatherRes, aqRes] = await Promise.all([
        fetch(`${BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code` +
            `&hourly=precipitation_probability` +
            `&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min` +
            `&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=3&timezone=auto`),
        fetch(`${AQ_URL}?latitude=${latitude}&longitude=${longitude}` +
            `&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,ozone` +
            `&hourly=birch_pollen,grass_pollen,ragweed_pollen&timezone=auto`)
    ]);

    const weatherData = await weatherRes.json();
    const aqData = await aqRes.json();

    const current = weatherData.current;
    const daily = weatherData.daily;
    const aqCurrent = aqData.current;
    const hourly = aqData.hourly;
    const hourIndex = new Date().getHours();

    const aqi = aqCurrent?.us_aqi ?? null;
    const aqiInfo = getAQIInfo(aqi);
    const birch = hourly?.birch_pollen?.[hourIndex] ?? 0;
    const grass = hourly?.grass_pollen?.[hourIndex] ?? 0;
    const ragweed = hourly?.ragweed_pollen?.[hourIndex] ?? 0;
    const maxPollen = Math.max(birch, grass, ragweed);
    const pollenInfo = getPollenInfo(maxPollen);
    const rainProb = daily?.precipitation_probability_max?.[0] ?? 0;
    const condition = getWeatherCondition(current?.weather_code);

    return {
        latitude, longitude,
        temp: Math.round(current?.temperature_2m ?? 0),
        feelsLike: Math.round(current?.apparent_temperature ?? 0),
        humidity: Math.round(current?.relative_humidity_2m ?? 0),
        precip: current?.precipitation ?? 0,
        rainProb, condition, aqi,
        aqiLabel: aqiInfo.label,
        aqiColor: aqiInfo.color,
        aqiBg: aqiInfo.bg,
        pm25: Math.round(aqCurrent?.pm2_5 ?? 0),
        pm10: Math.round(aqCurrent?.pm10 ?? 0),
        no2: Math.round(aqCurrent?.nitrogen_dioxide ?? 0),
        ozone: Math.round(aqCurrent?.ozone ?? 0),
        pollen: Math.round(maxPollen),
        pollenLabel: pollenInfo.label,
        pollenColor: pollenInfo.color,
        tempMax: Math.round(daily?.temperature_2m_max?.[0] ?? 0),
        tempMin: Math.round(daily?.temperature_2m_min?.[0] ?? 0),
        forecast: [0, 1, 2].map(i => ({
            rainProb: daily?.precipitation_probability_max?.[i] ?? 0,
            tempMax: Math.round(daily?.temperature_2m_max?.[i] ?? 0),
            tempMin: Math.round(daily?.temperature_2m_min?.[i] ?? 0),
        })),
    };
}

export async function getForecastData() {
    const pos = await getPosition();
    const { latitude, longitude } = pos.coords;

    const [weatherRes, aqRes] = await Promise.all([
        fetch(`${BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
            `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,` +
            `precipitation_sum,weather_code,wind_speed_10m_max` +
            `&hourly=relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph` +
            `&forecast_days=7&timezone=auto`),
        fetch(`${AQ_URL}?latitude=${latitude}&longitude=${longitude}` +
            `&daily=us_aqi_max,pm2_5_max&hourly=birch_pollen,grass_pollen,ragweed_pollen` +
            `&forecast_days=7&timezone=auto`)
    ]);

    const weatherData = await weatherRes.json();
    const aqData = await aqRes.json();
    const daily = weatherData.daily;
    const aqDaily = aqData.daily;
    const aqHourly = aqData.hourly;

    const days = (daily?.time ?? []).map((date, i) => {
        const maxPollen = Math.max(aqHourly?.birch_pollen?.[i * 24] ?? 0, aqHourly?.grass_pollen?.[i * 24] ?? 0, aqHourly?.ragweed_pollen?.[i * 24] ?? 0);
        const humidity = weatherData.hourly?.relative_humidity_2m?.[i * 24] ?? 0;
        const rainProb = daily?.precipitation_probability_max?.[i] ?? 0;
        const tempMax = Math.round(daily?.temperature_2m_max?.[i] ?? 0);
        const tempMin = Math.round(daily?.temperature_2m_min?.[i] ?? 0);
        const aqi = aqDaily?.us_aqi_max?.[i] ?? 0;
        const wind = Math.round(daily?.wind_speed_10m_max?.[i] ?? 0);
        const code = daily?.weather_code?.[i] ?? 0;

        return {
            date, dayLabel: getDayLabel(date, i), tempMax, tempMin, rainProb,
            humidity: Math.round(humidity), aqi, wind,
            condition: getWeatherCondition(code),
            rainSum: Math.round((daily?.precipitation_sum?.[i] ?? 0) * 10) / 10,
            pm25: Math.round(aqDaily?.pm2_5_max?.[i] ?? 0),
            moldRisk: humidity > 65 && rainProb > 40 ? 'High' : humidity > 55 && rainProb > 25 ? 'Moderate' : 'Low',
            allergenRisk: maxPollen > 200 ? 'Very High' : maxPollen > 50 ? 'High' : maxPollen > 10 ? 'Moderate' : 'Low',
            smokeRisk: aqi > 150 ? 'High' : aqi > 100 ? 'Moderate' : 'Low',
            pipeFreezeRisk: tempMin < 32 ? 'High' : tempMin < 38 ? 'Moderate' : 'Low',
        };
    });

    return { days };
}

export async function getHistoricalData() {
    const pos = await getPosition();
    const { latitude, longitude } = pos.coords;

    const now = new Date();
    const start = new Date(now - 24 * 60 * 60 * 1000);
    const fmt = d => d.toISOString().split('T')[0];

    const [weatherRes, aqRes] = await Promise.all([
        fetch(`${BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
            `&hourly=temperature_2m,relative_humidity_2m` +
            `&temperature_unit=fahrenheit&start_date=${fmt(start)}&end_date=${fmt(now)}&timezone=auto`),
        fetch(`${AQ_URL}?latitude=${latitude}&longitude=${longitude}` +
            `&hourly=us_aqi,pm2_5,nitrogen_dioxide,ozone` +
            `&start_date=${fmt(start)}&end_date=${fmt(now)}&timezone=auto`)
    ]);

    const weatherData = await weatherRes.json();
    const aqData = await aqRes.json();

    const labels = weatherData.hourly?.time?.map(t => {
        const h = new Date(t).getHours();
        return h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
    }) ?? [];

    const makeStats = (arr) => {
        const clean = arr.filter(v => v != null);
        const min = Math.min(...clean);
        const max = Math.max(...clean);
        const avg = Math.round(clean.reduce((a, b) => a + b, 0) / clean.length);
        return { min, max, avg };
    };

    const temp = weatherData.hourly?.temperature_2m ?? [];
    const humidity = weatherData.hourly?.relative_humidity_2m ?? [];
    const aqi = aqData.hourly?.us_aqi ?? [];
    const pm25 = aqData.hourly?.pm2_5 ?? [];
    const no2 = aqData.hourly?.nitrogen_dioxide ?? [];
    const ozone = aqData.hourly?.ozone ?? [];

    const toPoints = arr => arr.map((v, i) => ({ x: i, y: v ?? 0 }));

    return {
        labels,
        series: {
            temp: { label: 'Temperature (°F)', unit: '°F', points: toPoints(temp), stats: makeStats(temp) },
            humidity: { label: 'Humidity (%)', unit: '%', points: toPoints(humidity), stats: makeStats(humidity) },
            aqi: { label: 'AQI', unit: '', points: toPoints(aqi), stats: makeStats(aqi) },
            pm25: { label: 'PM2.5 (µg/m³)', unit: 'µg', points: toPoints(pm25), stats: makeStats(pm25) },
            no2: { label: 'NO₂ (µg/m³)', unit: 'µg', points: toPoints(no2), stats: makeStats(no2) },
            ozone: { label: 'Ozone (µg/m³)', unit: 'µg', points: toPoints(ozone), stats: makeStats(ozone) },
        }
    };
}

export function buildWeatherContext(w) {
    if (!w) return 'Weather data unavailable.';
    return `Outdoor conditions: ${w.temp}°F (feels like ${w.feelsLike}°F), ${w.humidity}% humidity, ${w.condition}. ` +
        `Outdoor air quality: AQI ${w.aqi} (${w.aqiLabel}), PM2.5 ${w.pm25} µg/m³. ` +
        `Pollen: ${w.pollenLabel} (${w.pollen} grains/m³). Rain probability today: ${w.rainProb}%. ` +
        `3-day forecast highs: ${w.forecast.map(d => d.tempMax + '°F').join(', ')}.`;
}

function getAQIInfo(aqi) {
    if (aqi === null) return { label: 'Unknown', color: '#888', bg: '#F5F5F5' };
    if (aqi <= 50) return { label: 'Good', color: '#2E7D32', bg: '#EDF7EE' };
    if (aqi <= 100) return { label: 'Moderate', color: '#C45C00', bg: '#FFF3E0' };
    if (aqi <= 150) return { label: 'Unhealthy*', color: '#C45C00', bg: '#FFF3E0' };
    if (aqi <= 200) return { label: 'Unhealthy', color: '#C62828', bg: '#FFEBEE' };
    return { label: 'Hazardous', color: '#C62828', bg: '#FFEBEE' };
}

function getPollenInfo(level) {
    if (level === 0) return { label: 'None', color: '#2E7D32' };
    if (level <= 10) return { label: 'Low', color: '#2E7D32' };
    if (level <= 50) return { label: 'Moderate', color: '#C45C00' };
    if (level <= 200) return { label: 'High', color: '#C62828' };
    return { label: 'Very High', color: '#C62828' };
}

function getWeatherCondition(code) {
    if (code == null) return 'Unknown';
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 57) return 'Drizzle';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Rain showers';
    if (code <= 86) return 'Snow showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Cloudy';
}

function getDayLabel(dateStr, index) {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}
