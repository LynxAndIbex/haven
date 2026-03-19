import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

export default function WeatherStrip({ weather, loading, error }) {
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>Fetching outdoor conditions…</Text>
      </View>
    );
  }

  if (error || !weather) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>
          {error === 'Location permission denied'
            ? 'Enable location to see outdoor conditions'
            : 'Weather data unavailable'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>

      {/* ROW 1 — temp + condition + AQI */}
      <View style={styles.row}>
        <View style={styles.tempBlock}>
          <Text style={styles.temp}>{weather.temp}°</Text>
          <View>
            <Text style={styles.condition}>{weather.condition}</Text>
            <Text style={styles.feelsLike}>Feels like {weather.feelsLike}°F</Text>
          </View>
        </View>
        <View style={[styles.aqiBadge, { backgroundColor: weather.aqiBg }]}>
          <Text style={styles.aqiLabel}>AQI</Text>
          <Text style={[styles.aqiVal, { color: weather.aqiColor }]}>{weather.aqi ?? '--'}</Text>
          <Text style={[styles.aqiStatus, { color: weather.aqiColor }]}>{weather.aqiLabel}</Text>
        </View>
      </View>

      {/* DIVIDER */}
      <View style={styles.divider} />

      {/* ROW 2 — humidity, pollen, rain */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Outdoor humidity</Text>
          <Text style={styles.statVal}>{weather.humidity}%</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Pollen</Text>
          <Text style={[styles.statVal, { color: weather.pollenColor }]}>
            {weather.pollenLabel}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Rain chance</Text>
          <Text style={styles.statVal}>{weather.rainProb}%</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>PM2.5 out</Text>
          <Text style={styles.statVal}>{weather.pm25} µg</Text>
        </View>
      </View>

      {/* ROW 3 — 3 day forecast */}
      <View style={styles.divider} />
      <View style={styles.forecastRow}>
        {['Today', 'Tomorrow', 'Day 3'].map((label, i) => (
          <View key={i} style={styles.forecastDay}>
            <Text style={styles.forecastLabel}>{label}</Text>
            <Text style={styles.forecastRain}>{weather.forecast[i].rainProb}% rain</Text>
            <Text style={styles.forecastTemp}>
              {weather.forecast[i].tempMax}° / {weather.forecast[i].tempMin}°
            </Text>
          </View>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card:           { backgroundColor: colors.white, borderRadius: radius.lg,
                    borderWidth: 1.5, borderColor: colors.border, padding: spacing.lg },
  loadingText:    { fontSize: 13, color: colors.hint, textAlign: 'center', paddingVertical: spacing.md },
  errorText:      { fontSize: 13, color: colors.muted, textAlign: 'center', paddingVertical: spacing.md },

  row:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tempBlock:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  temp:           { fontSize: 42, fontWeight: '300', color: colors.text, lineHeight: 48 },
  condition:      { fontSize: 14, fontWeight: '500', color: colors.text },
  feelsLike:      { fontSize: 11, color: colors.muted, marginTop: 2 },

  aqiBadge:       { alignItems: 'center', borderRadius: radius.md, padding: spacing.sm, minWidth: 80 },
  aqiLabel:       { fontSize: 9, fontWeight: '600', letterSpacing: 1.2,
                    textTransform: 'uppercase', color: colors.muted },
  aqiVal:         { fontSize: 24, fontWeight: '500', lineHeight: 30 },
  aqiStatus:      { fontSize: 11, fontWeight: '600' },

  divider:        { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },

  statsRow:       { flexDirection: 'row', alignItems: 'center' },
  stat:           { flex: 1, alignItems: 'center' },
  statLabel:      { fontSize: 10, color: colors.hint, fontWeight: '600',
                    letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center', marginBottom: 3 },
  statVal:        { fontSize: 13, fontWeight: '600', color: colors.text },
  statDivider:    { width: 1, height: 28, backgroundColor: colors.border },

  forecastRow:    { flexDirection: 'row', justifyContent: 'space-around' },
  forecastDay:    { alignItems: 'center', gap: 2 },
  forecastLabel:  { fontSize: 11, fontWeight: '600', color: colors.muted },
  forecastRain:   { fontSize: 11, color: colors.hint },
  forecastTemp:   { fontSize: 12, fontWeight: '500', color: colors.text },
});