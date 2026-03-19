import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { getForecastData } from '../data/weather';
import { colors, radius, spacing } from '../theme';

const RISK_COLORS = {
  'Low':       colors.good,
  'Moderate':  colors.warn,
  'High':      colors.danger,
  'Very High': colors.danger,
};

const RISK_BG = {
  'Low':       colors.goodBg,
  'Moderate':  colors.warnBg,
  'High':      colors.dangerBg,
  'Very High': colors.dangerBg,
};

const RISK_ALERTS = [
  {
    key:   'moldRisk',
    icon:  '🍄',
    label: 'Mold Risk',
    desc:  (day) => `Humidity ${day.humidity}% · Rain ${day.rainProb}%`,
    tip:   { Moderate: 'Run dehumidifier in basement and attic.', High: 'Check ventilation in all rooms. Run dehumidifier continuously.' },
  },
  {
    key:   'allergenRisk',
    icon:  '🌿',
    label: 'Allergen / Pollen',
    desc:  (day) => `Keep windows closed on high days`,
    tip:   { Moderate: 'Consider keeping windows closed.', High: 'Keep windows closed. Run HEPA purifier.', 'Very High': 'Keep all windows closed. Avoid outdoor exposure.' },
  },
  {
    key:   'smokeRisk',
    icon:  '🔥',
    label: 'Smoke / AQI Risk',
    desc:  (day) => `Outdoor AQI ${day.aqi}`,
    tip:   { Moderate: 'Limit outdoor time. Keep windows closed.', High: 'Stay indoors. Run air purifier on high.' },
  },
  {
    key:   'pipeFreezeRisk',
    icon:  '❄️',
    label: 'Pipe Freeze Risk',
    desc:  (day) => `Low of ${day.tempMin}°F`,
    tip:   { Moderate: 'Insulate exposed pipes. Let faucets drip overnight.', High: 'High freeze risk — insulate pipes immediately.' },
  },
];

export default function ForecastScreen() {
  const insets                    = useSafeAreaInsets();
  const [data, setData]           = React.useState(null);
  const [loading, setLoading]     = React.useState(true);
  const [error, setError]         = React.useState(null);
  const [activeDay, setActiveDay] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location permission denied');
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const result = await getForecastData(
          loc.coords.latitude,
          loc.coords.longitude,
        );
        setData(result);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const day = data?.days?.[activeDay];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* TOP BAR */}
      <View style={styles.topbar}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <View style={styles.brandDot} />
          </View>
          <Text style={styles.brandName}>HAVEN</Text>
        </View>
        <Text style={styles.topbarTitle}>Forecast</Text>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.green} size="large" />
          <Text style={styles.loadingText}>Loading 7-day forecast…</Text>
        </View>
      )}

      {error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {error === 'Location permission denied'
              ? 'Enable location to see forecast'
              : 'Could not load forecast data'}
          </Text>
        </View>
      )}

      {!loading && !error && data && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* 7-DAY STRIP */}
          <Text style={styles.sectionLabel}>7-Day Outlook</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayStrip}
          >
            {data.days.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.dayPill, activeDay === i && styles.dayPillActive]}
                onPress={() => setActiveDay(i)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayLabel, activeDay === i && styles.dayLabelActive]}>
                  {d.dayLabel}
                </Text>
                <Text style={[styles.dayCondition, activeDay === i && styles.dayConditionActive]}>
                  {d.condition}
                </Text>
                <Text style={[styles.dayTemp, activeDay === i && styles.dayTempActive]}>
                  {d.tempMax}°/{d.tempMin}°
                </Text>
                <Text style={[styles.dayRain, activeDay === i && styles.dayRainActive]}>
                  💧{d.rainProb}%
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* SELECTED DAY DETAIL */}
          {day && (
            <>
              {/* WEATHER SUMMARY CARD */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryTop}>
                  <View>
                    <Text style={styles.summaryDay}>{day.dayLabel}</Text>
                    <Text style={styles.summaryCondition}>{day.condition}</Text>
                  </View>
                  <View style={styles.summaryTemps}>
                    <Text style={styles.summaryTempHigh}>{day.tempMax}°</Text>
                    <Text style={styles.summaryTempLow}>{day.tempMin}°</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryStats}>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryStatLabel}>Rain</Text>
                    <Text style={styles.summaryStatVal}>{day.rainProb}%</Text>
                  </View>
                  <View style={styles.summaryStatDivider} />
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryStatLabel}>Humidity</Text>
                    <Text style={styles.summaryStatVal}>{day.humidity}%</Text>
                  </View>
                  <View style={styles.summaryStatDivider} />
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryStatLabel}>Wind</Text>
                    <Text style={styles.summaryStatVal}>{day.wind} mph</Text>
                  </View>
                  <View style={styles.summaryStatDivider} />
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryStatLabel}>AQI</Text>
                    <Text style={styles.summaryStatVal}>{day.aqi}</Text>
                  </View>
                </View>
              </View>

              {/* HAVEN RISK ALERTS */}
              <Text style={styles.sectionLabel}>Haven Risk Forecast</Text>
              <View style={styles.risksCard}>
                {RISK_ALERTS.map((alert, i) => {
                  const level = day[alert.key];
                  const tip   = alert.tip?.[level];
                  return (
                    <View key={i}>
                      {i > 0 && <View style={styles.divider} />}
                      <View style={styles.riskRow}>
                        <Text style={styles.riskIcon}>{alert.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <View style={styles.riskTop}>
                            <Text style={styles.riskLabel}>{alert.label}</Text>
                            <View style={[
                              styles.riskBadge,
                              { backgroundColor: RISK_BG[level] }
                            ]}>
                              <Text style={[
                                styles.riskBadgeText,
                                { color: RISK_COLORS[level] }
                              ]}>
                                {level}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.riskDesc}>{alert.desc(day)}</Text>
                          {tip && (
                            <View style={styles.tipRow}>
                              <Text style={styles.tipText}>💡 {tip}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* INDOOR IMPACT */}
              <Text style={styles.sectionLabel}>Indoor Impact</Text>
              <View style={styles.indoorCard}>
                <View style={styles.indoorRow}>
                  <Text style={styles.indoorIcon}>🏠</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.indoorTitle}>
                      {day.rainProb > 60
                        ? 'High rain expected — watch basement humidity'
                        : day.tempMax > 90
                        ? 'Hot day — indoor cooling load will be high'
                        : day.tempMin < 35
                        ? 'Near-freezing overnight — check pipe insulation'
                        : 'Outdoor conditions look manageable today'}
                    </Text>
                    <Text style={styles.indoorSub}>
                      {day.rainProb > 60
                        ? 'Run your dehumidifier before the rain arrives. Check attic and basement vents.'
                        : day.tempMax > 90
                        ? 'Keep windows closed during peak heat. AC will help control indoor humidity.'
                        : day.tempMin < 35
                        ? 'Let faucets drip overnight in unheated areas. Check crawl space insulation.'
                        : 'Good day to ventilate — open windows during cooler morning hours.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.connectRow}>
                  <Text style={styles.connectText}>
                    Connect Airthings to get personalized indoor predictions based on your actual sensor readings.
                  </Text>
                  <TouchableOpacity style={styles.connectBtn} activeOpacity={0.85}>
                    <Text style={styles.connectBtnText}>Connect →</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: colors.cream },

  topbar:              { flexDirection: 'row', alignItems: 'center',
                         justifyContent: 'space-between',
                         paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                         backgroundColor: colors.cream,
                         borderBottomWidth: 1, borderBottomColor: colors.border },
  brand:               { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark:           { width: 30, height: 30, borderRadius: 8,
                         backgroundColor: colors.green,
                         alignItems: 'center', justifyContent: 'center' },
  brandDot:            { width: 10, height: 10, borderRadius: 5,
                         backgroundColor: colors.white },
  brandName:           { fontSize: 14, fontWeight: '600', letterSpacing: 2,
                         color: colors.green },
  topbarTitle:         { fontSize: 14, fontWeight: '600', color: colors.muted },

  centered:            { flex: 1, alignItems: 'center', justifyContent: 'center',
                         gap: spacing.md },
  loadingText:         { fontSize: 13, color: colors.muted },
  errorText:           { fontSize: 13, color: colors.danger, textAlign: 'center',
                         paddingHorizontal: spacing.xl },

  scroll:              { flex: 1 },
  scrollContent:       { padding: spacing.lg, gap: spacing.md,
                         paddingBottom: spacing.xl },

  sectionLabel:        { fontSize: 10.5, fontWeight: '600', letterSpacing: 1.5,
                         textTransform: 'uppercase', color: colors.hint },

  dayStrip:            { gap: 8, paddingBottom: spacing.xs },
  dayPill:             { alignItems: 'center', padding: spacing.md,
                         borderRadius: radius.lg, borderWidth: 1.5,
                         borderColor: colors.border, backgroundColor: colors.white,
                         minWidth: 90, gap: 3 },
  dayPillActive:       { backgroundColor: colors.green, borderColor: colors.green },
  dayLabel:            { fontSize: 12, fontWeight: '600', color: colors.text },
  dayLabelActive:      { color: colors.white },
  dayCondition:        { fontSize: 10, color: colors.muted, textAlign: 'center' },
  dayConditionActive:  { color: 'rgba(255,255,255,0.7)' },
  dayTemp:             { fontSize: 12, fontWeight: '500', color: colors.text },
  dayTempActive:       { color: colors.white },
  dayRain:             { fontSize: 10, color: colors.muted },
  dayRainActive:       { color: 'rgba(255,255,255,0.7)' },

  summaryCard:         { backgroundColor: colors.white, borderRadius: radius.lg,
                         borderWidth: 1.5, borderColor: colors.border,
                         padding: spacing.lg },
  summaryTop:          { flexDirection: 'row', justifyContent: 'space-between',
                         alignItems: 'flex-start', marginBottom: spacing.md },
  summaryDay:          { fontSize: 20, fontWeight: '300', color: colors.text },
  summaryCondition:    { fontSize: 13, color: colors.muted, marginTop: 2 },
  summaryTemps:        { alignItems: 'flex-end' },
  summaryTempHigh:     { fontSize: 32, fontWeight: '300', color: colors.text,
                         lineHeight: 36 },
  summaryTempLow:      { fontSize: 16, color: colors.hint },
  summaryStats:        { flexDirection: 'row', alignItems: 'center',
                         marginTop: spacing.sm },
  summaryStat:         { flex: 1, alignItems: 'center' },
  summaryStatLabel:    { fontSize: 10, fontWeight: '600', letterSpacing: 1,
                         textTransform: 'uppercase', color: colors.hint, marginBottom: 3 },
  summaryStatVal:      { fontSize: 14, fontWeight: '500', color: colors.text },
  summaryStatDivider:  { width: 1, height: 28, backgroundColor: colors.border },

  divider:             { height: 1, backgroundColor: colors.border,
                         marginVertical: spacing.sm },

  risksCard:           { backgroundColor: colors.white, borderRadius: radius.lg,
                         borderWidth: 1.5, borderColor: colors.border,
                         padding: spacing.lg },
  riskRow:             { flexDirection: 'row', gap: spacing.md,
                         alignItems: 'flex-start', paddingVertical: spacing.xs },
  riskIcon:            { fontSize: 20, width: 28, textAlign: 'center' },
  riskTop:             { flexDirection: 'row', alignItems: 'center',
                         justifyContent: 'space-between', marginBottom: 3 },
  riskLabel:           { fontSize: 13, fontWeight: '600', color: colors.text },
  riskBadge:           { paddingHorizontal: 9, paddingVertical: 3,
                         borderRadius: 6 },
  riskBadgeText:       { fontSize: 11, fontWeight: '600' },
  riskDesc:            { fontSize: 11, color: colors.muted },
  tipRow:              { marginTop: 6, backgroundColor: colors.cream,
                         borderRadius: radius.sm, padding: spacing.sm },
  tipText:             { fontSize: 12, color: colors.text, lineHeight: 18 },

  indoorCard:          { backgroundColor: colors.white, borderRadius: radius.lg,
                         borderWidth: 1.5, borderColor: colors.border,
                         padding: spacing.lg, marginBottom: spacing.xl },
  indoorRow:           { flexDirection: 'row', gap: spacing.md,
                         alignItems: 'flex-start' },
  indoorIcon:          { fontSize: 24 },
  indoorTitle:         { fontSize: 14, fontWeight: '600', color: colors.text,
                         marginBottom: 4, lineHeight: 20 },
  indoorSub:           { fontSize: 12, color: colors.muted, lineHeight: 18 },
  connectRow:          { gap: spacing.sm },
  connectText:         { fontSize: 12, color: colors.muted, lineHeight: 18 },
  connectBtn:          { backgroundColor: colors.green, borderRadius: radius.sm,
                         padding: spacing.sm, alignItems: 'center' },
  connectBtnText:      { color: colors.white, fontSize: 13, fontWeight: '600' },
});