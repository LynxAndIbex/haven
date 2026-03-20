import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Switch, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { useSettings } from '../context/SettingsContext';

const APP_VERSION = '0.1.0';

const ALERT_THRESHOLDS = [
  { key: 'radon',    label: 'Radon',    unit: 'pCi/L', default: '4.0',  desc: 'EPA action level is 4.0'        },
  { key: 'co2',      label: 'CO₂',      unit: 'ppm',   default: '1000', desc: 'Above 1000 affects focus'       },
  { key: 'vocs',     label: 'VOCs',     unit: 'ppb',   default: '500',  desc: 'Above 500 warrants investigation'},
  { key: 'humidity', label: 'Humidity', unit: '%',     default: '65',   desc: 'Above 65% risks mold growth'    },
  { key: 'pm25',     label: 'PM2.5',    unit: 'µg/m³', default: '35',   desc: 'EPA 24hr standard is 35'        },
  { key: 'co',       label: 'CO',       unit: 'ppm',   default: '9',    desc: 'EPA standard is 9 ppm'          },
];

const NOTIFICATIONS = [
  { key: 'radon',    label: 'Radon alerts',           desc: 'Notify when radon exceeds threshold'    },
  { key: 'co',       label: 'Carbon monoxide alerts', desc: 'Immediate alert for CO spikes'          },
  { key: 'humidity', label: 'Humidity / mold risk',   desc: 'Alert when mold conditions develop'     },
  { key: 'aqi',      label: 'Outdoor air quality',    desc: 'Notify on poor outdoor AQI days'        },
  { key: 'vocs',     label: 'VOC alerts',             desc: 'Notify when VOCs exceed threshold'      },
  { key: 'forecast', label: 'Daily forecast digest',  desc: 'Morning summary of Haven risk forecast' },
];

const DATA_SOURCES = [
  { name: 'Open-Meteo', desc: 'Weather & outdoor air quality', url: 'open-meteo.com', free: true  },
  { name: 'Airthings',  desc: 'Indoor sensor readings',        url: 'airthings.com',  free: false },
  { name: 'OpenRouter', desc: 'AI assistant (Haven AI)',       url: 'openrouter.ai',  free: true  },
];

function fToC(f) {
  return Math.round((parseFloat(f) - 32) * 5 / 9 * 10) / 10;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, resetSettings, signOut } = useSettings();

  const [clientId,     setClientId]     = React.useState(settings.clientId);
  const [clientSecret, setClientSecret] = React.useState(settings.clientSecret);

  const handleConnect = () => {
    if (!clientId.trim() || !clientSecret.trim()) return;
    updateSettings({ clientId, clientSecret, connected: true });
  };

  const handleDisconnect = () => {
    setClientId('');
    setClientSecret('');
    updateSettings({ clientId: '', clientSecret: '', connected: false });
  };

  const handleReset = () => {
    Alert.alert(
      'Reset all settings',
      'This will restore all settings to their defaults. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setClientId('');
            setClientSecret('');
            resetSettings();
          },
        },
      ]
    );
  };

  const toggleNotif = (key) =>
    updateSettings({
      notifs: { ...settings.notifs, [key]: !settings.notifs[key] }
    });

  const updateThreshold = (key, val) =>
    updateSettings({
      thresholds: { ...settings.thresholds, [key]: val }
    });

  const householdToggles = [
    { key: 'hasAsthma',    label: 'Asthma or respiratory conditions' },
    { key: 'hasAllergies', label: 'Seasonal allergies'               },
    { key: 'hasPets',      label: 'Pets in home'                     },
    { key: 'hasInfants',   label: 'Infants or young children'        },
  ];

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
        <Text style={styles.topbarTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── AIRTHINGS CONNECTION ── */}
        <Text style={styles.sectionLabel}>Airthings Sensor</Text>
        <View style={styles.card}>
          {settings.connected ? (
            <View style={styles.connectedRow}>
              <View style={styles.connectedLeft}>
                <View style={styles.connectedDot} />
                <View>
                  <Text style={styles.connectedTitle}>Connected</Text>
                  <Text style={styles.connectedSub}>Airthings API active</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.disconnectBtn}
                onPress={handleDisconnect}
                activeOpacity={0.7}
              >
                <Text style={styles.disconnectBtnText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.cardDesc}>
                Connect your Airthings account to enable live indoor sensor
                readings. Get your credentials at dashboard.airthings.com →
                Integrations → API.
              </Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Client ID</Text>
                <TextInput
                  style={styles.input}
                  value={clientId}
                  onChangeText={setClientId}
                  placeholder="Your Airthings Client ID"
                  placeholderTextColor={colors.hint}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Client Secret</Text>
                <TextInput
                  style={styles.input}
                  value={clientSecret}
                  onChangeText={setClientSecret}
                  placeholder="Your Airthings Client Secret"
                  placeholderTextColor={colors.hint}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.connectBtn,
                  (!clientId || !clientSecret) && styles.connectBtnDisabled,
                ]}
                onPress={handleConnect}
                activeOpacity={0.85}
                disabled={!clientId || !clientSecret}
              >
                <Text style={styles.connectBtnText}>Connect Airthings</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── UNITS ── */}
        <Text style={styles.sectionLabel}>Units</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Temperature unit</Text>
              <Text style={styles.rowSub}>
                {settings.useCelsius
                  ? `Showing °C — e.g. ${fToC(71)}°C indoors`
                  : 'Showing °F — e.g. 71°F indoors'}
              </Text>
            </View>
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[styles.unitBtn, !settings.useCelsius && styles.unitBtnActive]}
                onPress={() => updateSettings({ useCelsius: false })}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.unitBtnText,
                  !settings.useCelsius && styles.unitBtnTextActive,
                ]}>°F</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, settings.useCelsius && styles.unitBtnActive]}
                onPress={() => updateSettings({ useCelsius: true })}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.unitBtnText,
                  settings.useCelsius && styles.unitBtnTextActive,
                ]}>°C</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.cardDesc}>Temperature preview:</Text>
          <View style={styles.conversionRow}>
            {[
              { label: 'Comfortable', f: 71 },
              { label: 'Warm',        f: 79 },
              { label: 'Hot',         f: 90 },
              { label: 'Cold',        f: 45 },
            ].map(item => (
              <View key={item.label} style={styles.conversionItem}>
                <Text style={styles.conversionLabel}>{item.label}</Text>
                <Text style={styles.conversionVal}>
                  {settings.useCelsius
                    ? `${fToC(item.f)}°C`
                    : `${item.f}°F`}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── NOTIFICATIONS ── */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          {NOTIFICATIONS.map((n, i) => (
            <View key={n.key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{n.label}</Text>
                  <Text style={styles.rowSub}>{n.desc}</Text>
                </View>
                <Switch
                  value={!!settings.notifs[n.key]}
                  onValueChange={() => toggleNotif(n.key)}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.white}
                  ios_backgroundColor={colors.border}
                />
              </View>
            </View>
          ))}
        </View>

        {/* ── ALERT THRESHOLDS ── */}
        <Text style={styles.sectionLabel}>Alert Thresholds</Text>
        <View style={styles.card}>
          <Text style={styles.cardDesc}>
            Haven will alert you when indoor readings exceed these values.
          </Text>
          {ALERT_THRESHOLDS.map((t, i) => (
            <View key={t.key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.thresholdRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{t.label}</Text>
                  <Text style={styles.rowSub}>{t.desc}</Text>
                </View>
                <View style={styles.thresholdInput}>
                  <TextInput
                    style={styles.thresholdField}
                    value={settings.thresholds[t.key]}
                    onChangeText={(v) => updateThreshold(t.key, v)}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                  <Text style={styles.thresholdUnit}>{t.unit}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── HOUSEHOLD PROFILE ── */}
        <Text style={styles.sectionLabel}>Household Profile</Text>
        <View style={styles.card}>
          <Text style={styles.cardDesc}>
            Haven AI uses this to personalize health recommendations.
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of occupants</Text>
            <TextInput
              style={[styles.input, { width: 80 }]}
              value={settings.occupants}
              onChangeText={(v) => updateSettings({ occupants: v })}
              keyboardType="number-pad"
              selectTextOnFocus
            />
          </View>
          <View style={styles.divider} />
          {householdToggles.map((item, i) => (
            <View key={item.key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <Text style={[styles.rowTitle, { flex: 1 }]}>
                  {item.label}
                </Text>
                <Switch
                  value={!!settings[item.key]}
                  onValueChange={() =>
                    updateSettings({ [item.key]: !settings[item.key] })
                  }
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.white}
                  ios_backgroundColor={colors.border}
                />
              </View>
            </View>
          ))}
        </View>

        {/* ── DATA SOURCES ── */}
        <Text style={styles.sectionLabel}>Data Sources</Text>
        <View style={styles.card}>
          {DATA_SOURCES.map((src, i) => (
            <View key={src.name}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{src.name}</Text>
                  <Text style={styles.rowSub}>{src.desc}</Text>
                  <Text style={styles.sourceUrl}>{src.url}</Text>
                </View>
                <View style={[
                  styles.freeBadge,
                  { backgroundColor: src.free ? colors.goodBg : colors.cream2 }
                ]}>
                  <Text style={[
                    styles.freeBadgeText,
                    { color: src.free ? colors.good : colors.muted }
                  ]}>
                    {src.free ? 'Free' : 'API key'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── APP INFO ── */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Version</Text>
            <Text style={styles.rowSub}>v{APP_VERSION}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowTitle}>AI model</Text>
            <Text style={styles.rowSub}>Llama 3.2 via OpenRouter</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Weather data</Text>
            <Text style={styles.rowSub}>Open-Meteo (no key required)</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowTitle, { color: colors.danger }]}>
              Sign out
            </Text>
            <Text style={{ color: colors.danger, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={signOut}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowTitle, { color: colors.danger }]}>
              Reset all settings
            </Text>
            <Text style={{ color: colors.danger, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.cream },

  topbar:             { flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                        backgroundColor: colors.cream,
                        borderBottomWidth: 1, borderBottomColor: colors.border },
  brand:              { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark:          { width: 30, height: 30, borderRadius: 8,
                        backgroundColor: colors.green,
                        alignItems: 'center', justifyContent: 'center' },
  brandDot:           { width: 10, height: 10, borderRadius: 5,
                        backgroundColor: colors.white },
  brandName:          { fontSize: 14, fontWeight: '600', letterSpacing: 2,
                        color: colors.green },
  topbarTitle:        { fontSize: 14, fontWeight: '600', color: colors.muted },

  scroll:             { flex: 1 },
  scrollContent:      { padding: spacing.lg, gap: spacing.md, paddingBottom: 100 },

  sectionLabel:       { fontSize: 10.5, fontWeight: '600', letterSpacing: 1.5,
                        textTransform: 'uppercase', color: colors.hint,
                        marginTop: spacing.xs },

  card:               { backgroundColor: colors.white, borderRadius: radius.lg,
                        borderWidth: 1.5, borderColor: colors.border,
                        padding: spacing.lg, gap: spacing.md },
  cardDesc:           { fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  divider:            { height: 1, backgroundColor: colors.border },

  row:                { flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'space-between', gap: spacing.md },
  rowTitle:           { fontSize: 14, fontWeight: '500', color: colors.text },
  rowSub:             { fontSize: 12, color: colors.muted, marginTop: 1 },

  connectedRow:       { flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'space-between' },
  connectedLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  connectedDot:       { width: 10, height: 10, borderRadius: 5,
                        backgroundColor: colors.good },
  connectedTitle:     { fontSize: 14, fontWeight: '600', color: colors.good },
  connectedSub:       { fontSize: 12, color: colors.muted },
  disconnectBtn:      { paddingHorizontal: 14, paddingVertical: 7,
                        borderRadius: radius.sm, borderWidth: 1.5,
                        borderColor: colors.danger },
  disconnectBtnText:  { fontSize: 13, fontWeight: '600', color: colors.danger },

  inputGroup:         { gap: 6 },
  inputLabel:         { fontSize: 12, fontWeight: '600', color: colors.muted,
                        letterSpacing: 0.5 },
  input:              { backgroundColor: colors.cream, borderRadius: radius.sm,
                        borderWidth: 1.5, borderColor: colors.border,
                        paddingHorizontal: 12, paddingVertical: 10,
                        fontSize: 14, color: colors.text },

  connectBtn:         { backgroundColor: colors.green, borderRadius: radius.md,
                        padding: spacing.md, alignItems: 'center' },
  connectBtnDisabled: { opacity: 0.4 },
  connectBtnText:     { color: colors.white, fontSize: 14, fontWeight: '600' },

  unitToggle:         { flexDirection: 'row', borderRadius: radius.sm,
                        borderWidth: 1.5, borderColor: colors.border,
                        overflow: 'hidden' },
  unitBtn:            { paddingHorizontal: 16, paddingVertical: 8 },
  unitBtnActive:      { backgroundColor: colors.green },
  unitBtnText:        { fontSize: 13, fontWeight: '600', color: colors.muted },
  unitBtnTextActive:  { color: colors.white },

  conversionRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  conversionItem:     { alignItems: 'center', gap: 3 },
  conversionLabel:    { fontSize: 10, color: colors.hint, fontWeight: '600',
                        textTransform: 'uppercase', letterSpacing: 0.8 },
  conversionVal:      { fontSize: 14, fontWeight: '500', color: colors.green },

  thresholdRow:       { flexDirection: 'row', alignItems: 'center',
                        gap: spacing.md },
  thresholdInput:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  thresholdField:     { backgroundColor: colors.cream, borderRadius: radius.sm,
                        borderWidth: 1.5, borderColor: colors.border,
                        paddingHorizontal: 10, paddingVertical: 7,
                        fontSize: 14, color: colors.text,
                        width: 64, textAlign: 'center' },
  thresholdUnit:      { fontSize: 11, color: colors.muted, width: 36 },

  sourceUrl:          { fontSize: 11, color: colors.hint, marginTop: 1 },
  freeBadge:          { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  freeBadgeText:      { fontSize: 11, fontWeight: '600' },
});