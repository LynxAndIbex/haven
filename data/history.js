//simulatory file. replace with real time data when we have it. 

const BASE_URL     = 'https://api.open-meteo.com/v1/forecast';
const AQ_URL       = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export async function getHistoricalData(latitude, longitude) {
  const now       = new Date();
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);

  const fmt = (d) => d.toISOString().split('T')[0];
  const startDate = fmt(yesterday);
  const endDate   = fmt(now);

  // Fetch hourly weather for past 24 hours
  const weatherRes = await fetch(
    `${BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=temperature_2m,relative_humidity_2m,apparent_temperature` +
    `&temperature_unit=fahrenheit` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&timezone=auto`
  );
  const weatherData = await weatherRes.json();

  // Fetch hourly air quality for past 24 hours
  const aqRes = await fetch(
    `${AQ_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&timezone=auto`
  );
  const aqData = await aqRes.json();

  // Get last 24 hours of data points
  const hours      = weatherData.hourly?.time ?? [];
  const temps      = weatherData.hourly?.temperature_2m ?? [];
  const humidity   = weatherData.hourly?.relative_humidity_2m ?? [];
  const aqi        = aqData.hourly?.us_aqi ?? [];
  const pm25       = aqData.hourly?.pm2_5 ?? [];
  const no2        = aqData.hourly?.nitrogen_dioxide ?? [];
  const ozone      = aqData.hourly?.ozone ?? [];

  // Build last 24 data points
  const total  = hours.length;
  const start  = Math.max(0, total - 24);
  const slice  = (arr) => arr.slice(start, total);

  const times     = slice(hours);
  const tempSlice = slice(temps);
  const humSlice  = slice(humidity);
  const aqiSlice  = slice(aqi);
  const pm25Slice = slice(pm25);
  const no2Slice  = slice(no2);
  const ozSlice   = slice(ozone);

  // Format hour labels
  const labels = times.map(t => {
    const h = new Date(t).getHours();
    if (h === 0)  return '12a';
    if (h === 12) return '12p';
    return h > 12 ? `${h - 12}p` : `${h}a`;
  });

  // Build chart-ready series
  const toPoints = (arr) =>
    arr.map((v, i) => ({ x: i, y: typeof v === 'number' ? Math.round(v) : 0 }));

  const calcStats = (arr) => {
    const valid = arr.filter(v => typeof v === 'number');
    if (!valid.length) return { min: 0, max: 0, avg: 0 };
    return {
      min: Math.round(Math.min(...valid)),
      max: Math.round(Math.max(...valid)),
      avg: Math.round(valid.reduce((a, b) => a + b, 0) / valid.length),
    };
  };

  return {
    labels,
    series: {
      temp:     { points: toPoints(tempSlice), stats: calcStats(tempSlice), unit: '°F',     label: 'Outdoor Temp'     },
      humidity: { points: toPoints(humSlice),  stats: calcStats(humSlice),  unit: '%',      label: 'Outdoor Humidity' },
      aqi:      { points: toPoints(aqiSlice),  stats: calcStats(aqiSlice),  unit: 'AQI',    label: 'Air Quality Index' },
      pm25:     { points: toPoints(pm25Slice), stats: calcStats(pm25Slice), unit: 'µg/m³',  label: 'PM2.5'            },
      no2:      { points: toPoints(no2Slice),  stats: calcStats(no2Slice),  unit: 'µg/m³',  label: 'NO₂'              },
      ozone:    { points: toPoints(ozSlice),   stats: calcStats(ozSlice),   unit: 'µg/m³',  label: 'Ozone'            },
    },
  };
}