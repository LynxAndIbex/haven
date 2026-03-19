import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';

const ROOMS = [
  { id: 'kitchen',  label: 'Kitchen',     status: 'good'   },
  { id: 'bedroom',  label: 'Bedroom',     status: 'good'   },
  { id: 'basement', label: 'Basement',    status: 'warn'   },
  { id: 'attic',    label: 'Attic',       status: 'warn'   },
  { id: 'garage',   label: 'Garage',      status: 'danger' },
  { id: 'living',   label: 'Living Room', status: 'good'   },
];

const METRICS = [
  { name: 'Radon',    val: '0.8', unit: 'pCi/L', bar: 16, cls: 'good',   status: 'Normal'        },
  { name: 'CO',       val: '0',   unit: 'ppm',   bar: 0,  cls: 'good',   status: 'None detected' },
  { name: 'Humidity', val: '45',  unit: '%',     bar: 45, cls: 'good',   status: 'Ideal'         },
  { name: 'Methane',  val: '0',   unit: 'ppb',   bar: 0,  cls: 'good',   status: 'None detected' },
  { name: 'VOCs',     val: '120', unit: 'ppb',   bar: 24, cls: 'good',   status: 'Low'           },
  { name: 'CO₂',      val: '650', unit: 'ppm',   bar: 32, cls: 'good',   status: 'Good'          },
  { name: 'PM2.5',    val: '5',   unit: 'µg/m³', bar: 10, cls: 'good',   status: 'Excellent'     },
  { name: 'Temp',     val: '71',  unit: '°F',    bar: 55, cls: 'good',   status: 'Comfortable'   },
];

const STATUS_COLORS = {
  good:   colors.good,
  warn:   colors.warn,
  danger: colors.danger,
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeRoom, setActiveRoom] = React.useState('kitchen');

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
        <View style={styles.apiPill}>
          <View style={styles.apiDot} />
          <Text style={styles.apiLabel}>Demo mode</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ROOM STRIP */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomStrip}
        >
          {ROOMS.map(room => (
            <TouchableOpacity
              key={room.id}
              style={[
                styles.roomPill,
                activeRoom === room.id && styles.roomPillActive,
              ]}
              onPress={() => setActiveRoom(room.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.pillDot,
                { backgroundColor: activeRoom === room.id
                    ? 'rgba(255,255,255,0.7)'
                    : STATUS_COLORS[room.status] }
              ]} />
              <Text style={[
                styles.pillLabel,
                activeRoom === room.id && styles.pillLabelActive,
              ]}>
                {room.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroRoom}>{ROOMS.find(r => r.id === activeRoom)?.label}</Text>
              <Text style={styles.heroStatus}>
                Air quality —{' '}
                <Text style={styles.heroStatusStrong}>All clear</Text>
              </Text>
            </View>
            <View style={[styles.heroBadge, { backgroundColor: colors.goodBg }]}>
              <Text style={[styles.heroBadgeText, { color: colors.good }]}>Good</Text>
            </View>
          </View>
          <Text style={styles.heroMeta}>Last updated just now · 8 sensors active</Text>
        </View>

        {/* METRICS */}
        <Text style={styles.sectionLabel}>Sensor Readings</Text>
        <View style={styles.metricsGrid}>
          {METRICS.map((m, i) => (
            <View
              key={i}
              style={[
                styles.metricCard,
                m.cls === 'warn'   && styles.metricCardWarn,
                m.cls === 'danger' && styles.metricCardDanger,
              ]}
            >
              <Text style={styles.metricName}>{m.name}</Text>
              <Text style={[styles.metricVal, { color: STATUS_COLORS[m.cls] }]}>
                {m.val}
              </Text>
              <Text style={styles.metricUnit}>{m.unit}</Text>
              <View style={styles.barTrack}>
                <View style={[
                  styles.barFill,
                  { width: `${m.bar}%`, backgroundColor: STATUS_COLORS[m.cls] }
                ]} />
              </View>
              <Text style={[styles.metricStatus, { color: STATUS_COLORS[m.cls] }]}>
                {m.status}
              </Text>
            </View>
          ))}
        </View>

        {/* INSIGHT BUTTON */}
        <TouchableOpacity style={styles.insightBtn} activeOpacity={0.85}>
          <Text style={styles.insightBtnText}>Ask AI what this means</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.cream },

  topbar:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                      backgroundColor: colors.cream, borderBottomWidth: 1, borderBottomColor: colors.border },
  brand:            { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark:        { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.green,
                      alignItems: 'center', justifyContent: 'center' },
  brandDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.white },
  brandName:        { fontSize: 14, fontWeight: '600', letterSpacing: 2, color: colors.green },
  apiPill:          { flexDirection: 'row', alignItems: 'center', gap: 5,
                      backgroundColor: colors.cream2, borderRadius: 100,
                      paddingHorizontal: 10, paddingVertical: 4 },
  apiDot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warn },
  apiLabel:         { fontSize: 11, color: colors.muted, fontWeight: '500' },

  scroll:           { flex: 1 },
  scrollContent:    { padding: spacing.lg, gap: spacing.md },

  roomStrip:        { paddingBottom: spacing.sm, gap: spacing.sm, flexDirection: 'row' },
  roomPill:         { flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingHorizontal: 13, paddingVertical: 8,
                      borderRadius: 100, borderWidth: 1.5, borderColor: colors.border,
                      backgroundColor: colors.white },
  roomPillActive:   { backgroundColor: colors.green, borderColor: colors.green },
  pillDot:          { width: 7, height: 7, borderRadius: 4 },
  pillLabel:        { fontSize: 13, fontWeight: '500', color: colors.muted },
  pillLabelActive:  { color: colors.white },

  heroCard:         { backgroundColor: colors.white, borderRadius: radius.xl,
                      borderWidth: 1.5, borderColor: colors.border,
                      padding: spacing.xl, gap: spacing.sm },
  heroTop:          { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  heroRoom:         { fontSize: 11, fontWeight: '600', letterSpacing: 1.5,
                      textTransform: 'uppercase', color: colors.muted, marginBottom: 3 },
  heroStatus:       { fontSize: 22, fontWeight: '300', color: colors.text, lineHeight: 28 },
  heroStatusStrong: { fontWeight: '600', color: colors.green },
  heroBadge:        { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 },
  heroBadgeText:    { fontSize: 12, fontWeight: '600' },
  heroMeta:         { fontSize: 12, color: colors.hint },

  sectionLabel:     { fontSize: 10.5, fontWeight: '600', letterSpacing: 1.5,
                      textTransform: 'uppercase', color: colors.hint },

  metricsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard:       { width: '48.5%', backgroundColor: colors.white,
                      borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
                      padding: spacing.md },
  metricCardWarn:   { borderColor: '#FFCC80' },
  metricCardDanger: { borderColor: '#EF9A9A' },
  metricName:       { fontSize: 10, fontWeight: '600', letterSpacing: 1.2,
                      textTransform: 'uppercase', color: colors.hint, marginBottom: 6 },
  metricVal:        { fontSize: 24, fontWeight: '500', lineHeight: 28, marginBottom: 1 },
  metricUnit:       { fontSize: 10.5, color: colors.muted, marginBottom: 8 },
  barTrack:         { height: 3, backgroundColor: colors.cream2, borderRadius: 2, overflow: 'hidden' },
  barFill:          { height: '100%', borderRadius: 2 },
  metricStatus:     { fontSize: 10.5, fontWeight: '600', marginTop: 4 },

  insightBtn:       { backgroundColor: colors.green, borderRadius: radius.md,
                      padding: spacing.lg, alignItems: 'center', marginBottom: spacing.xl },
  insightBtnText:   { color: colors.white, fontSize: 14, fontWeight: '500' },
});