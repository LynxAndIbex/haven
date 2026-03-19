import React from 'react';
import AIChat from '../components/AIChat';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Modal, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { SCENARIOS, SCENARIO_LABELS } from '../data/scenarios';

const ROOMS = [
  { id: 'kitchen',  label: 'Kitchen',     status: 'good'   },
  { id: 'bedroom',  label: 'Bedroom',     status: 'good'   },
  { id: 'basement', label: 'Basement',    status: 'warn'   },
  { id: 'attic',    label: 'Attic',       status: 'warn'   },
  { id: 'garage',   label: 'Garage',      status: 'danger' },
  { id: 'living',   label: 'Living Room', status: 'good'   },
];

const STATUS_COLORS = {
  good:   colors.good,
  warn:   colors.warn,
  danger: colors.danger,
};

const STATUS_BG = {
  good:   colors.goodBg,
  warn:   colors.warnBg,
  danger: colors.dangerBg,
};


export default function HomeScreen() {
  const [chatOpen, setChatOpen] = React.useState(false);
  const insets = useSafeAreaInsets();
  const [activeRoom, setActiveRoom]         = React.useState('kitchen');
  const [activeScenario, setActiveScenario] = React.useState('normal');
  const [pickerOpen, setPickerOpen]         = React.useState(false);

  const scenario = SCENARIOS[activeScenario];

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
              style={[styles.roomPill, activeRoom === room.id && styles.roomPillActive]}
              onPress={() => setActiveRoom(room.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.pillDot,
                { backgroundColor: activeRoom === room.id
                    ? 'rgba(255,255,255,0.7)'
                    : STATUS_COLORS[room.status] }
              ]} />
              <Text style={[styles.pillLabel, activeRoom === room.id && styles.pillLabelActive]}>
                {room.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroRoom}>
                {ROOMS.find(r => r.id === activeRoom)?.label}
              </Text>
              <Text style={styles.heroStatus}>
                Air quality —{' '}
                <Text style={[
                  styles.heroStatusStrong,
                  { color: STATUS_COLORS[scenario.statusCls] }
                ]}>
                  {scenario.statusText}
                </Text>
              </Text>
            </View>
            <View style={[styles.heroBadge, { backgroundColor: STATUS_BG[scenario.badgeCls] }]}>
              <Text style={[styles.heroBadgeText, { color: STATUS_COLORS[scenario.badgeCls] }]}>
                {scenario.badge}
              </Text>
            </View>
          </View>
          <Text style={styles.heroMeta}>Last updated just now · 8 sensors active</Text>

          {/* SCENARIO PICKER TRIGGER */}
          <TouchableOpacity
            style={styles.scenarioRow}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.scenarioLabel}>Simulate scenario</Text>
            <View style={styles.scenarioValue}>
              <Text style={styles.scenarioValueText}>
                {SCENARIO_LABELS.find(s => s.key === activeScenario)?.label}
              </Text>
              <Text style={styles.scenarioChevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ALERT STRIP */}
        {scenario.alert && (
          <View style={[styles.alertStrip, { backgroundColor: STATUS_BG[scenario.statusCls], borderColor: scenario.statusCls === 'danger' ? '#EF9A9A' : '#FFCC80' }]}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={[styles.alertText, { color: scenario.statusCls === 'danger' ? colors.danger : colors.warn }]}>
              {scenario.alert}
            </Text>
          </View>
        )}

        {/* METRICS */}
        <Text style={styles.sectionLabel}>Sensor Readings</Text>
        <View style={styles.metricsGrid}>
          {scenario.metrics.map((m, i) => (
            <View
              key={i}
              style={[
                styles.metricCard,
                m.cls === 'warn'   && styles.metricCardWarn,
                m.cls === 'danger' && styles.metricCardDanger,
              ]}
            >
              <Text style={styles.metricName}>{m.name}</Text>
              <Text style={[styles.metricVal, { color: STATUS_COLORS[m.cls] }]}>{m.val}</Text>
              <Text style={styles.metricUnit}>{m.unit}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${m.bar}%`, backgroundColor: STATUS_COLORS[m.cls] }]} />
              </View>
              <Text style={[styles.metricStatus, { color: STATUS_COLORS[m.cls] }]}>{m.status}</Text>
            </View>
          ))}
        </View>

        {/* INSIGHT BUTTON */}
        <TouchableOpacity style={styles.insightBtn} activeOpacity={0.85} onPress={() => setChatOpen(true)}>
          <Text style={styles.insightBtnText}>Ask AI what this means</Text>
        </TouchableOpacity>

      </ScrollView>


      {/* SCENARIO PICKER MODAL */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Simulate a scenario</Text>
            {SCENARIO_LABELS.map(s => (
              <TouchableOpacity
                key={s.key}
                style={[
                  styles.modalOption,
                  activeScenario === s.key && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setActiveScenario(s.key);
                  setPickerOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modalOptionText,
                  activeScenario === s.key && styles.modalOptionTextActive,
                ]}>
                  {s.label}
                </Text>
                {activeScenario === s.key && (
                  <Text style={styles.modalCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setPickerOpen(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
       <AIChat
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
        scenario={scenario}
        roomName={ROOMS.find(r => r.id === activeRoom)?.label}
      />     
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: colors.cream },

  topbar:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                          paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                          backgroundColor: colors.cream, borderBottomWidth: 1, borderBottomColor: colors.border },
  brand:                { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark:            { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.green,
                          alignItems: 'center', justifyContent: 'center' },
  brandDot:             { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.white },
  brandName:            { fontSize: 14, fontWeight: '600', letterSpacing: 2, color: colors.green },
  apiPill:              { flexDirection: 'row', alignItems: 'center', gap: 5,
                          backgroundColor: colors.cream2, borderRadius: 100,
                          paddingHorizontal: 10, paddingVertical: 4 },
  apiDot:               { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warn },
  apiLabel:             { fontSize: 11, color: colors.muted, fontWeight: '500' },

  scroll:               { flex: 1 },
  scrollContent:        { padding: spacing.lg, gap: spacing.md },

  roomStrip:            { paddingBottom: spacing.sm, gap: spacing.sm, flexDirection: 'row' },
  roomPill:             { flexDirection: 'row', alignItems: 'center', gap: 6,
                          paddingHorizontal: 13, paddingVertical: 8,
                          borderRadius: 100, borderWidth: 1.5, borderColor: colors.border,
                          backgroundColor: colors.white },
  roomPillActive:       { backgroundColor: colors.green, borderColor: colors.green },
  pillDot:              { width: 7, height: 7, borderRadius: 4 },
  pillLabel:            { fontSize: 13, fontWeight: '500', color: colors.muted },
  pillLabelActive:      { color: colors.white },

  heroCard:             { backgroundColor: colors.white, borderRadius: radius.xl,
                          borderWidth: 1.5, borderColor: colors.border,
                          padding: spacing.xl, gap: spacing.sm },
  heroTop:              { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  heroRoom:             { fontSize: 11, fontWeight: '600', letterSpacing: 1.5,
                          textTransform: 'uppercase', color: colors.muted, marginBottom: 3 },
  heroStatus:           { fontSize: 22, fontWeight: '300', color: colors.text, lineHeight: 28 },
  heroStatusStrong:     { fontWeight: '600' },
  heroBadge:            { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 },
  heroBadgeText:        { fontSize: 12, fontWeight: '600' },
  heroMeta:             { fontSize: 12, color: colors.hint },

  scenarioRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                          borderTopWidth: 1, borderTopColor: colors.border,
                          paddingTop: spacing.md, marginTop: spacing.xs },
  scenarioLabel:        { fontSize: 12, color: colors.muted, fontWeight: '500' },
  scenarioValue:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scenarioValueText:    { fontSize: 12, color: colors.green, fontWeight: '600' },
  scenarioChevron:      { fontSize: 16, color: colors.green, fontWeight: '300' },

  alertStrip:           { borderRadius: radius.md, borderWidth: 1.5,
                          padding: spacing.md, flexDirection: 'row',
                          alignItems: 'flex-start', gap: spacing.sm },
  alertIcon:            { fontSize: 16, lineHeight: 20 },
  alertText:            { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },

  sectionLabel:         { fontSize: 10.5, fontWeight: '600', letterSpacing: 1.5,
                          textTransform: 'uppercase', color: colors.hint },

  metricsGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard:           { width: '48.5%', backgroundColor: colors.white,
                          borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
                          padding: spacing.md },
  metricCardWarn:       { borderColor: '#FFCC80' },
  metricCardDanger:     { borderColor: '#EF9A9A' },
  metricName:           { fontSize: 10, fontWeight: '600', letterSpacing: 1.2,
                          textTransform: 'uppercase', color: colors.hint, marginBottom: 6 },
  metricVal:            { fontSize: 24, fontWeight: '500', lineHeight: 28, marginBottom: 1 },
  metricUnit:           { fontSize: 10.5, color: colors.muted, marginBottom: 8 },
  barTrack:             { height: 3, backgroundColor: colors.cream2, borderRadius: 2, overflow: 'hidden' },
  barFill:              { height: '100%', borderRadius: 2 },
  metricStatus:         { fontSize: 10.5, fontWeight: '600', marginTop: 4 },

  insightBtn:           { backgroundColor: colors.green, borderRadius: radius.md,
                          padding: spacing.lg, alignItems: 'center', marginBottom: spacing.xl },
  insightBtnText:       { color: colors.white, fontSize: 14, fontWeight: '500' },

  modalOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalSheet:           { backgroundColor: colors.white, borderTopLeftRadius: radius.xl,
                          borderTopRightRadius: radius.xl, padding: spacing.xl, gap: spacing.sm },
  modalHandle:          { width: 36, height: 4, backgroundColor: colors.border,
                          borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  modalTitle:           { fontSize: 14, fontWeight: '600', color: colors.text,
                          marginBottom: spacing.sm },
  modalOption:          { padding: spacing.md, borderRadius: radius.md,
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOptionActive:    { backgroundColor: colors.greenLight },
  modalOptionText:      { fontSize: 14, color: colors.text },
  modalOptionTextActive:{ color: colors.green, fontWeight: '600' },
  modalCheck:           { fontSize: 14, color: colors.green, fontWeight: '600' },
  modalCancel:          { marginTop: spacing.sm, padding: spacing.md,
                          alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  modalCancelText:      { fontSize: 14, color: colors.muted, fontWeight: '500' },
});
