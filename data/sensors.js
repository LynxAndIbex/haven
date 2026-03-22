import { supabase } from './supabase';

// ── LOCATIONS ──────────────────────────────────────────────

export async function getLocations(userId) {
  const { data, error } = await supabase
    .from('locations')
    .select('*, devices(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createLocation(userId, { name, address }) {
  const { data, error } = await supabase
    .from('locations')
    .insert({ user_id: userId, name, address })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLocation(id) {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── DEVICES ────────────────────────────────────────────────

export async function createDevice(userId, locationId, { name, manufacturer, model, serial }) {
  const { data, error } = await supabase
    .from('devices')
    .insert({ user_id: userId, location_id: locationId, name, manufacturer, model, serial })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDevice(id) {
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── READINGS ───────────────────────────────────────────────

export async function getLatestReadings(deviceId) {
  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .eq('device_id', deviceId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function getReadingHistory(deviceId, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .eq('device_id', deviceId)
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function insertReading(deviceId, userId, readings) {
  const { data, error } = await supabase
    .from('readings')
    .insert({
      device_id:   deviceId,
      user_id:     userId,
      recorded_at: new Date().toISOString(),
      ...readings,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── INGEST (sensor-agnostic normalizer) ───────────────────
// Call this with raw data from ANY sensor manufacturer.
// Map their field names to Haven's universal schema.

export function normalizeReading(raw, manufacturer) {
  switch (manufacturer?.toLowerCase()) {

    case 'airthings':
      return {
        radon:       raw.radonShortTermAvg ?? null,
        co2:         raw.co2               ?? null,
        vocs:        raw.voc               ?? null,
        humidity:    raw.humidity          ?? null,
        temperature: raw.temp              ?? null,
        pm25:        raw.pm25              ?? null,
        pressure:    raw.pressure          ?? null,
        raw,
      };

    case 'awair':
      return {
        co2:         raw.co2     ?? null,
        vocs:        raw.tvoc    ?? null,
        humidity:    raw.humid   ?? null,
        temperature: raw.temp    ?? null,
        pm25:        raw.pm25    ?? null,
        raw,
      };

    case 'purpleair':
      return {
        pm25:        raw['pm2.5_atm'] ?? null,
        pm10:        raw['pm10.0_atm'] ?? null,
        humidity:    raw.humidity      ?? null,
        temperature: raw.temperature   ?? null,
        pressure:    raw.pressure      ?? null,
        raw,
      };

    case 'haven':
      // Direct Haven schema — used for manual entry or custom sensors
      return {
        radon:       raw.radon       ?? null,
        co:          raw.co          ?? null,
        co2:         raw.co2         ?? null,
        vocs:        raw.vocs        ?? null,
        pm25:        raw.pm25        ?? null,
        pm10:        raw.pm10        ?? null,
        humidity:    raw.humidity    ?? null,
        temperature: raw.temperature ?? null,
        methane:     raw.methane     ?? null,
        pressure:    raw.pressure    ?? null,
        no2:         raw.no2         ?? null,
        ozone:       raw.ozone       ?? null,
        raw,
      };

    default:
      // Unknown sensor — store whatever fields match our schema
      return {
        radon:       raw.radon       ?? raw.radonShortTermAvg ?? null,
        co:          raw.co          ?? null,
        co2:         raw.co2         ?? raw.carbon_dioxide    ?? null,
        vocs:        raw.vocs        ?? raw.voc ?? raw.tvoc   ?? null,
        pm25:        raw.pm25        ?? raw['pm2.5'] ?? null,
        pm10:        raw.pm10        ?? raw['pm10'] ?? null,
        humidity:    raw.humidity    ?? raw.humid   ?? null,
        temperature: raw.temperature ?? raw.temp    ?? null,
        methane:     raw.methane     ?? null,
        pressure:    raw.pressure    ?? null,
        no2:         raw.no2         ?? raw.nitrogen_dioxide ?? null,
        ozone:       raw.ozone       ?? null,
        raw,
      };
  }
}

// ── RISK ASSESSMENT ────────────────────────────────────────
// Takes a readings object and returns status for each metric

export function assessReadings(readings) {
  if (!readings) return null;

  const checks = [
    {
      key:    'radon',
      name:   'Radon',
      unit:   'pCi/L',
      val:    readings.radon,
      good:   (v) => v < 2,
      warn:   (v) => v < 4,
    },
    {
      key:    'co',
      name:   'CO',
      unit:   'ppm',
      val:    readings.co,
      good:   (v) => v < 4,
      warn:   (v) => v < 9,
    },
    {
      key:    'co2',
      name:   'CO₂',
      unit:   'ppm',
      val:    readings.co2,
      good:   (v) => v < 800,
      warn:   (v) => v < 1500,
    },
    {
      key:    'vocs',
      name:   'VOCs',
      unit:   'ppb',
      val:    readings.vocs,
      good:   (v) => v < 250,
      warn:   (v) => v < 500,
    },
    {
      key:    'pm25',
      name:   'PM2.5',
      unit:   'µg/m³',
      val:    readings.pm25,
      good:   (v) => v < 12,
      warn:   (v) => v < 35,
    },
    {
      key:    'humidity',
      name:   'Humidity',
      unit:   '%',
      val:    readings.humidity,
      good:   (v) => v >= 30 && v <= 60,
      warn:   (v) => v >= 20 && v <= 70,
    },
    {
      key:    'temperature',
      name:   'Temp',
      unit:   '°F',
      val:    readings.temperature,
      good:   (v) => v >= 65 && v <= 78,
      warn:   (v) => v >= 55 && v <= 85,
    },
  ];

  return checks
    .filter(c => c.val !== null && c.val !== undefined)
    .map(c => {
      const cls = c.good(c.val) ? 'good' : c.warn(c.val) ? 'warn' : 'danger';
      const bar = Math.min(100, Math.round((c.val / (c.val * 1.5)) * 100));
      return {
        name:   c.name,
        val:    String(Math.round(c.val * 10) / 10),
        unit:   c.unit,
        bar,
        cls,
        status: cls === 'good' ? 'Normal' : cls === 'warn' ? 'Elevated' : 'Dangerous',
      };
    });
}