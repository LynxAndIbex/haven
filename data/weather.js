import * as Location from 'expo-location';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const AQ_URL   = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export async function getWeatherData() {
  // 1. Get location permission + coords
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = loc.coords;

  // 2. Fetch weather + forecast in one call
  const weatherRes = await fetch(
    `${BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code` +
    `&hourly=precipitation_probability` +
    `&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=fahrenheit` +
    `&wind_speed_unit=mph` +
    `&forecast_days=3` +
    `&timezone=auto`
  );
  const weatherData = await weatherRes.json();

  // 3. Fetch air quality + pollen in one call
  const aqRes = await fetch(
    `${AQ_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,ozone` +
    `&hourly=birch_pollen,grass_pollen,ragweed_pollen` +
    `&timezone=auto`
  );
  const aqData = await aqRes.json();

  // 4. Parse and return clean object
  const current   = weatherData.current;
  const daily     = weatherData.daily;
  const aqCurrent = aqData.current;
  const hourly    = aqData.hourly;

  // Get current hour index for pollen
  const now        = new Date();
  const hourIndex  = now.getHours();

  // AQI label
  const aqi     = aqCurrent?.us_aqi ?? null;
  const aqiInfo = getAQIInfo(aqi);

  // Pollen levels
  const birch    = hourly?.birch_pollen?.[hourIndex]   ?? 0;
  const grass    = hourly?.grass_pollen?.[hourIndex]   ?? 0;
  const ragweed  = hourly?.ragweed_pollen?.[hourIndex] ?? 0;
  const maxPollen = Math.max(birch, grass, ragweed);
  const pollenInfo = getPollenInfo(maxPollen);

  // Rain probability (next 24h max)
  const rainProb = daily?.precipitation_probability_max?.[0] ?? 0;

  // Weather condition
  const condition = getWeatherCondition(current?.weather_code);

  return {
    latitude,
    longitude,
    temp:        Math.round(current?.temperature_2m ?? 0),
    feelsLike:   Math.round(current?.apparent_temperature ?? 0),
    humidity:    Math.round(current?.relative_humidity_2m ?? 0),
    precip:      current?.precipitation ?? 0,
    rainProb,
    condition,
    aqi,
    aqiLabel:    aqiInfo.label,
    aqiColor:    aqiInfo.color,
    aqiBg:       aqiInfo.bg,
    pm25:        Math.round(aqCurrent?.pm2_5 ?? 0),
    pm10:        Math.round(aqCurrent?.pm10  ?? 0),
    no2:         Math.round(aqCurrent?.nitrogen_dioxide ?? 0),
    ozone:       Math.round(aqCurrent?.ozone ?? 0),
    pollen:      Math.round(maxPollen),
    pollenLabel: pollenInfo.label,
    pollenColor: pollenInfo.color,
    tempMax:     Math.round(daily?.temperature_2m_max?.[0] ?? 0),
    tempMin:     Math.round(daily?.temperature_2m_min?.[0] ?? 0),
    // 3-day rain forecast
    forecast: [0, 1, 2].map(i => ({
      rainProb: daily?.precipitation_probability_max?.[i] ?? 0,
      tempMax:  Math.round(daily?.temperature_2m_max?.[i] ?? 0),
      tempMin:  Math.round(daily?.temperature_2m_min?.[i] ?? 0),
    })),
  };
}

function getAQIInfo(aqi) {
  if (aqi === null)  return { label: 'Unknown',       color: '#888',    bg: '#F5F5F5' };
  if (aqi <= 50)     return { label: 'Good',          color: '#2E7D32', bg: '#EDF7EE' };
  if (aqi <= 100)    return { label: 'Moderate',      color: '#C45C00', bg: '#FFF3E0' };
  if (aqi <= 150)    return { label: 'Unhealthy (sensitive)', color: '#C45C00', bg: '#FFF3E0' };
  if (aqi <= 200)    return { label: 'Unhealthy',     color: '#C62828', bg: '#FFEBEE' };
  if (aqi <= 300)    return { label: 'Very Unhealthy',color: '#C62828', bg: '#FFEBEE' };
  return               { label: 'Hazardous',          color: '#C62828', bg: '#FFEBEE' };
}

function getPollenInfo(level) {
  if (level === 0)   return { label: 'None',     color: '#2E7D32' };
  if (level <= 10)   return { label: 'Low',      color: '#2E7D32' };
  if (level <= 50)   return { label: 'Moderate', color: '#C45C00' };
  if (level <= 200)  return { label: 'High',     color: '#C62828' };
  return               { label: 'Very High',     color: '#C62828' };
}

function getWeatherCondition(code) {
  if (code === null || code === undefined) return 'Unknown';
  if (code === 0)              return 'Clear';
  if (code <= 3)               return 'Partly cloudy';
  if (code <= 48)              return 'Foggy';
  if (code <= 57)              return 'Drizzle';
  if (code <= 67)              return 'Rain';
  if (code <= 77)              return 'Snow';
  if (code <= 82)              return 'Rain showers';
  if (code <= 86)              return 'Snow showers';
  if (code >= 95)              return 'Thunderstorm';
  return 'Cloudy';
}

// Build a plain-English weather summary for the AI
export function buildWeatherContext(w) {
  if (!w) return 'Weather data unavailable.';
  return (
    `Outdoor conditions: ${w.temp}°F (feels like ${w.feelsLike}°F), ` +
    `${w.humidity}% humidity, ${w.condition}. ` +
    `Outdoor air quality: AQI ${w.aqi} (${w.aqiLabel}), PM2.5 ${w.pm25} µg/m³. ` +
    `Pollen: ${w.pollenLabel} (${w.pollen} grains/m³). ` +
    `Rain probability today: ${w.rainProb}%. ` +
    `3-day forecast highs: ${w.forecast.map(d => d.tempMax + '°F').join(', ')}.`
  );
}

export async function getForecastData(latitude, longitude) {
  const weatherRes = await fetch(
    `${BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,` +
    `precipitation_sum,weather_code,wind_speed_10m_max` +
    `&hourly=relative_humidity_2m,us_aqi` +
    `&temperature_unit=fahrenheit` +
    `&wind_speed_unit=mph` +
    `&forecast_days=7` +
    `&timezone=auto`
  );
  const weatherData = await weatherRes.json();

  const aqRes = await fetch(
    `${AQ_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&daily=us_aqi_max,pm2_5_max` +
    `&hourly=birch_pollen,grass_pollen,ragweed_pollen` +
    `&forecast_days=7` +
    `&timezone=auto`
  );
  const aqData = await aqRes.json();

  const daily      = weatherData.daily;
  const aqDaily    = aqData.daily;
  const aqHourly   = aqData.hourly;

  // Build 7-day forecast array
  const days = (daily?.time ?? []).map((date, i) => {
    const maxPollen = Math.max(
      aqHourly?.birch_pollen?.[i * 24]    ?? 0,
      aqHourly?.grass_pollen?.[i * 24]    ?? 0,
      aqHourly?.ragweed_pollen?.[i * 24]  ?? 0,
    );

    const humidity = weatherData.hourly?.relative_humidity_2m?.[i * 24] ?? 0;
    const rainProb = daily?.precipitation_probability_max?.[i] ?? 0;
    const rainSum  = daily?.precipitation_sum?.[i] ?? 0;
    const tempMax  = Math.round(daily?.temperature_2m_max?.[i] ?? 0);
    const tempMin  = Math.round(daily?.temperature_2m_min?.[i] ?? 0);
    const aqi      = aqDaily?.us_aqi_max?.[i] ?? 0;
    const pm25     = Math.round(aqDaily?.pm2_5_max?.[i] ?? 0);
    const wind     = Math.round(daily?.wind_speed_10m_max?.[i] ?? 0);
    const code     = daily?.weather_code?.[i] ?? 0;

    // Haven risk scores
    const moldRisk    = humidity > 65 && rainProb > 40
      ? 'High' : humidity > 55 && rainProb > 25
      ? 'Moderate' : 'Low';

    const allergenRisk = maxPollen > 200
      ? 'Very High' : maxPollen > 50
      ? 'High' : maxPollen > 10
      ? 'Moderate' : 'Low';

    const smokeRisk = aqi > 150
      ? 'High' : aqi > 100
      ? 'Moderate' : 'Low';

    const pipeFreezeRisk = tempMin < 32
      ? 'High' : tempMin < 38
      ? 'Moderate' : 'Low';

    return {
      date,
      dayLabel:  getDayLabel(date, i),
      tempMax,
      tempMin,
      rainProb,
      rainSum:   Math.round(rainSum * 10) / 10,
      humidity:  Math.round(humidity),
      aqi,
      pm25,
      wind,
      condition: getWeatherCondition(code),
      moldRisk,
      allergenRisk,
      smokeRisk,
      pipeFreezeRisk,
    };
  });

  return { days };
}

function getDayLabel(dateStr, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}