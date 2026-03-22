import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VictoryChart, VictoryAxis, VictoryArea } from 'victory-native';
import * as Location from 'expo-location';
import { getHistoricalData } from '../data/history';
import { colors, radius, spacing, convertTemp } from '../theme';
import { useSettings } from '../context/SettingsContext';

const TABS = [
  { key: 'temp',     label: 'Temp'     },
  { key: 'humidity', label: 'Humidity' },
  { key: 'aqi',      label: 'AQI'      },
  { key: 'pm25',     label: 'PM2.5'    },
  { key: 'no2',      label: 'NO₂'      },
  { key: 'ozone',    label: 'Ozone'    },
];

const INDOOR_PLACEHOLDERS = [
  { name: 'Radon',   icon: '☢',  desc: 'Connect Airthings to view 24hr radon history'        },
  { name: 'CO',      icon: '💨', desc: 'Connect Airthings to view carbon monoxide trends'     },
  { name: 'VOCs',    icon: '🧪', desc: 'Connect Airthings to view VOC history'               },
  { name: 'CO₂',     icon: '🌫', desc: 'Connect Airthings to view CO₂ trends'               },
  { name: 'Methane', icon: '⚗',  desc: 'Connect Airthings to view methane history'           },
];

export default function HistoryScreen() {
  const insets                    = useSafeAreaInsets();
  const { settings }              = useSettings();
  const [activeTab, setActiveTab] = React.useState('temp');
  const [data, setData]           = React.useState(null);
  const [loading, setLoading]     = React.useState(true);
  const [error, setError]         = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location permission denied');
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const result = await getHistoricalData(
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

  const activeSeries = data?.series?.[activeTab];
  const isTemp       = activeTab === 'temp';

  const formatStat = (val) => {
    if (isTemp) return convertTemp(val, settings.useCelsius);
    return `${val}${activeSeries?.unit ?? ''}`;
  };

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
        <Text style={styles.topbarTitle}>History</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* OUTDOOR SECTION */}
        <Text style={styles.sectionLabel}>Outdoor — Last 24 Hours</Text>

        {/* METRIC TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabStrip}
        >
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* CHART CARD */}
        <View style={styles.chartCard}>
          {loading && (
            <View style={styles.chartPlaceholder}>
              <ActivityIndicator color={colors.green} />
              <Text style={styles.chartPlaceholderText}>Fetching outdoor data…</Text>
            </View>
          )}

          {error && (
            <View style={styles.chartPlaceholder}>
              <Text style={styles.errorText}>
                {error === 'Location permission denied'
                  ? 'Enable location to view history'
                  : 'Could not load historical data'}
              </Text>
            </View>
          )}

          {!loading && !error && activeSeries && (
            <>
              {/* STATS ROW */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Low</Text>
                  <Text style={styles.statVal}>
                    {formatStat(activeSeries.stats.min)}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Average</Text>
                  <Text style={[styles.statVal, { color: colors.green }]}>
                    {formatStat(activeSeries.stats.avg)}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>High</Text>
                  <Text style={styles.statVal}>
                    {formatStat(activeSeries.stats.max)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* CHART */}
              <VictoryChart
                height={180}
                padding={{ top: 16, bottom: 32, left: 48, right: 16 }}
              >
                <VictoryAxis
                  tickValues={[0, 6, 12, 18, 23]}
                  tickFormat={(i) => data.labels[i] ?? ''}
                  style={{
                    axis:       { stroke: colors.border },
                    tickLabels: { fontSize: 9, fill: colors.hint, fontFamily: 'sans-serif' },
                    grid:       { stroke: 'transparent' },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(val) => isTemp
                    ? `${Math.round((val - 32) * 5 / 9)}°`
                    : val}
                  style={{
                    axis:       { stroke: colors.border },
                    tickLabels: { fontSize: 9, fill: colors.hint, fontFamily: 'sans-serif' },
                    grid:       { stroke: colors.border, strokeDasharray: '4 4', strokeOpacity: 0.5 },
                  }}
                />
                <VictoryArea
                  data={activeSeries.points}
                  style={{
                    data: {
                      fill:        colors.greenLight,
                      fillOpacity: 0.6,
                      stroke:      colors.green,
                      strokeWidth: 2,
                    },
                  }}
                  interpolation="monotoneX"
                  animate={{ duration: 400 }}
                />
              </VictoryChart>

              {/* X LABEL */}
              <Text style={styles.chartXLabel}>
                {isTemp
                  ? `Outdoor temperature (${settings.useCelsius ? '°C' : '°F'}) over the past 24 hours`
                  : `${activeSeries.label} over the past 24 hours`}
              </Text>
            </>
          )}
        </View>

        {/* INDOOR SECTION */}
        <Text style={styles.sectionLabel}>Indoor Sensors</Text>
        <View style={styles.indoorCard}>
          <View style={styles.indoorHeader}>
            <View style={styles.indoorIconWrap}>
              <Text style={styles.indoorIcon}>📡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.indoorTitle}>Airthings not connected</Text>
              <Text style={styles.indoorSub}>
                Connect your sensor to unlock indoor history
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {INDOOR_PLACEHOLDERS.map((item, i) => (
            <View key={i} style={styles.indoorRow}>
              <Text style={styles.indoorRowIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.indoorRowName}>{item.name}</Text>
                <Text style={styles.indoorRowDesc}>{item.desc}</Text>
              </View>
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>Locked</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.connectBtn} activeOpacity={0.85}>
            <Text style={styles.connectBtnText}>Connect Airthings →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
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

  scroll:              { flex: 1 },
  scrollContent:       { padding: spacing.lg, gap: spacing.md },

  sectionLabel:        { fontSize: 10.5, fontWeight: '600', letterSpacing: 1.5,
                         textTransform: 'uppercase', color: colors.hint },

  tabStrip:            { gap: 6, paddingBottom: spacing.xs },
  tab:                 { paddingHorizontal: 14, paddingVertical: 7,
                         borderRadius: 20, borderWidth: 1.5,
                         borderColor: colors.border, backgroundColor: colors.white },
  tabActive:           { backgroundColor: colors.green, borderColor: colors.green },
  tabLabel:            { fontSize: 12, fontWeight: '500', color: colors.muted },
  tabLabelActive:      { color: colors.white },

  chartCard:           { backgroundColor: colors.white, borderRadius: radius.lg,
                         borderWidth: 1.5, borderColor: colors.border,
                         padding: spacing.lg, minHeight: 200 },
  chartPlaceholder:    { alignItems: 'center', justifyContent: 'center',
                         paddingVertical: spacing.xl, gap: spacing.sm },
  chartPlaceholderText:{ fontSize: 13, color: colors.muted },
  errorText:           { fontSize: 13, color: colors.danger, textAlign: 'center' },

  statsRow:            { flexDirection: 'row', alignItems: 'center',
                         marginBottom: spacing.sm },
  stat:                { flex: 1, alignItems: 'center' },
  statLabel:           { fontSize: 10, fontWeight: '600', letterSpacing: 1,
                         textTransform: 'uppercase', color: colors.hint, marginBottom: 3 },
  statVal:             { fontSize: 18, fontWeight: '500', color: colors.text },
  statDivider:         { width: 1, height: 32, backgroundColor: colors.border },
  divider:             { height: 1, backgroundColor: colors.border,
                         marginVertical: spacing.sm },

  chartXLabel:         { fontSize: 11, color: colors.hint, textAlign: 'center',
                         marginTop: spacing.xs },

  indoorCard:          { backgroundColor: colors.white, borderRadius: radius.lg,
                         borderWidth: 1.5, borderColor: colors.border,
                         padding: spacing.lg, gap: spacing.md,
                         marginBottom: spacing.xl },
  indoorHeader:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  indoorIconWrap:      { width: 44, height: 44, borderRadius: radius.md,
                         backgroundColor: colors.cream2,
                         alignItems: 'center', justifyContent: 'center' },
  indoorIcon:          { fontSize: 22 },
  indoorTitle:         { fontSize: 14, fontWeight: '600', color: colors.text },
  indoorSub:           { fontSize: 12, color: colors.muted, marginTop: 2 },

  indoorRow:           { flexDirection: 'row', alignItems: 'center',
                         gap: spacing.md, paddingVertical: spacing.xs },
  indoorRowIcon:       { fontSize: 18, width: 28, textAlign: 'center' },
  indoorRowName:       { fontSize: 13, fontWeight: '600', color: colors.text },
  indoorRowDesc:       { fontSize: 11, color: colors.hint, marginTop: 1 },
  lockedBadge:         { backgroundColor: colors.cream2, borderRadius: 6,
                         paddingHorizontal: 8, paddingVertical: 3 },
  lockedBadgeText:     { fontSize: 10, fontWeight: '600', color: colors.muted },

  connectBtn:          { backgroundColor: colors.green, borderRadius: radius.md,
                         padding: spacing.md, alignItems: 'center',
                         marginTop: spacing.xs },
  connectBtnText:      { color: colors.white, fontSize: 13, fontWeight: '600' },
});