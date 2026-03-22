import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Modal,
  Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { useSettings } from '../context/SettingsContext';
import {
  getLocations, createLocation, deleteLocation,
  createDevice, deleteDevice,
} from '../data/sensors';

const MANUFACTURERS = [
  'Airthings', 'Awair', 'PurpleAir', 'IQAir',
  'Kaiterra', 'uHoo', 'Custom / Other',
];

export default function SensorsScreen() {
  const insets           = useSafeAreaInsets();
  const { session }      = useSettings();
  const [locations, setLocations]             = React.useState([]);
  const [loading, setLoading]                 = React.useState(true);
  const [locationModal, setLocationModal]     = React.useState(false);
  const [deviceModal, setDeviceModal]         = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState(null);

  // Location form
  const [locName, setLocName]       = React.useState('');
  const [locAddress, setLocAddress] = React.useState('');

  // Device form
  const [devName, setDevName]               = React.useState('');
  const [devManufacturer, setDevManufacturer] = React.useState('Airthings');
  const [devModel, setDevModel]             = React.useState('');
  const [devSerial, setDevSerial]           = React.useState('');

  const userId = session?.user?.id;

  React.useEffect(() => {
    if (userId) loadLocations();
  }, [userId]);

  const loadLocations = async () => {
    try {
      const data = await getLocations(userId);
      setLocations(data);
    } catch (e) {
      console.warn('Failed to load locations:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!locName.trim()) return;
    try {
      await createLocation(userId, { name: locName, address: locAddress });
      setLocName('');
      setLocAddress('');
      setLocationModal(false);
      loadLocations();
    } catch (e) {
      Alert.alert('Error', 'Could not create location.');
    }
  };

  const handleDeleteLocation = (loc) => {
    Alert.alert(
      `Delete ${loc.name}?`,
      'This will delete all devices and readings at this location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteLocation(loc.id);
            loadLocations();
          },
        },
      ]
    );
  };

  const handleAddDevice = async () => {
    if (!devName.trim() || !selectedLocation) return;
    try {
      await createDevice(userId, selectedLocation.id, {
        name:         devName,
        manufacturer: devManufacturer,
        model:        devModel,
        serial:       devSerial,
      });
      setDevName('');
      setDevModel('');
      setDevSerial('');
      setDeviceModal(false);
      loadLocations();
    } catch (e) {
      Alert.alert('Error', 'Could not add device.');
    }
  };

  const handleDeleteDevice = (device) => {
    Alert.alert(
      `Remove ${device.name}?`,
      'All readings from this device will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteDevice(device.id);
            loadLocations();
          },
        },
      ]
    );
  };

  const openAddDevice = (loc) => {
    setSelectedLocation(loc);
    setDeviceModal(true);
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
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setLocationModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+ Add location</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.green} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {locations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📡</Text>
              <Text style={styles.emptyTitle}>No locations yet</Text>
              <Text style={styles.emptySub}>
                Add a location — a home, building, or property — then add sensors to it.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => setLocationModal(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyBtnText}>Add your first location</Text>
              </TouchableOpacity>
            </View>
          ) : (
            locations.map(loc => (
              <View key={loc.id} style={styles.locationCard}>

                {/* LOCATION HEADER */}
                <View style={styles.locationHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationName}>{loc.name}</Text>
                    {loc.address ? (
                      <Text style={styles.locationAddress}>{loc.address}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteLocation(loc)}
                    style={styles.deleteBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* DEVICES */}
                {loc.devices?.length === 0 ? (
                  <Text style={styles.noDevices}>No sensors added yet</Text>
                ) : (
                  loc.devices?.map(device => (
                    <View key={device.id} style={styles.deviceRow}>
                      <View style={styles.deviceLeft}>
                        <View style={styles.deviceIconWrap}>
                          <Text style={styles.deviceIcon}>🌡</Text>
                        </View>
                        <View>
                          <Text style={styles.deviceName}>{device.name}</Text>
                          <Text style={styles.deviceSub}>
                            {device.manufacturer ?? 'Unknown'}{device.model ? ` · ${device.model}` : ''}
                          </Text>
                          {device.serial ? (
                            <Text style={styles.deviceSerial}>S/N: {device.serial}</Text>
                          ) : null}
                        </View>
                      </View>
                      <View style={styles.deviceRight}>
                        <View style={styles.apiKeyWrap}>
                          <Text style={styles.apiKeyLabel}>API Key</Text>
                          <Text style={styles.apiKeyVal} numberOfLines={1}>
                            {device.api_key?.slice(0, 12)}…
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteDevice(device)}
                          style={styles.deleteBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.deleteBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}

                {/* ADD SENSOR BUTTON */}
                <TouchableOpacity
                  style={styles.addSensorBtn}
                  onPress={() => openAddDevice(loc)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addSensorBtnText}>+ Add sensor</Text>
                </TouchableOpacity>

              </View>
            ))
          )}

          {/* INTEGRATION INFO */}
          {locations.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Sending data to Haven</Text>
              <Text style={styles.infoDesc}>
                Any sensor can push readings to Haven using our ingest endpoint.
                Use the device API key shown above to authenticate.
              </Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
                  POST https://haven-api.com/ingest{'\n'}
                  Authorization: Bearer YOUR_API_KEY{'\n'}
                  {'{'}
                  {'\n'}  "co2": 650,{'\n'}  "humidity": 45,{'\n'}  "temperature": 71{'\n'}
                  {'}'}
                </Text>
              </View>
              <Text style={styles.infoDesc}>
                Supported manufacturers: Airthings, Awair, PurpleAir, and any custom sensor.
              </Text>
            </View>
          )}

        </ScrollView>
      )}

      {/* ADD LOCATION MODAL */}
      <Modal
        visible={locationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLocationModal(false)}>
          <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add location</Text>
            <Text style={styles.modalDesc}>
              A location is a property, building, floor, or home.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location name</Text>
              <TextInput
                style={styles.input}
                value={locName}
                onChangeText={setLocName}
                placeholder="e.g. Main Street Office, Unit 4B"
                placeholderTextColor={colors.hint}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address (optional)</Text>
              <TextInput
                style={styles.input}
                value={locAddress}
                onChangeText={setLocAddress}
                placeholder="123 Main St, Austin TX"
                placeholderTextColor={colors.hint}
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, !locName && styles.primaryBtnDisabled]}
              onPress={handleAddLocation}
              disabled={!locName}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Add location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setLocationModal(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ADD DEVICE MODAL */}
      <Modal
        visible={deviceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setDeviceModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDeviceModal(false)}>
          <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add sensor</Text>
            <Text style={styles.modalDesc}>
              Adding to: <Text style={{ color: colors.green, fontWeight: '600' }}>
                {selectedLocation?.name}
              </Text>
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sensor name</Text>
              <TextInput
                style={styles.input}
                value={devName}
                onChangeText={setDevName}
                placeholder="e.g. Living room sensor"
                placeholderTextColor={colors.hint}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Manufacturer</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.manufacturerStrip}
              >
                {MANUFACTURERS.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.manufacturerPill,
                      devManufacturer === m && styles.manufacturerPillActive,
                    ]}
                    onPress={() => setDevManufacturer(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.manufacturerPillText,
                      devManufacturer === m && styles.manufacturerPillTextActive,
                    ]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Model (optional)</Text>
              <TextInput
                style={styles.input}
                value={devModel}
                onChangeText={setDevModel}
                placeholder="e.g. Wave Plus"
                placeholderTextColor={colors.hint}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Serial number (optional)</Text>
              <TextInput
                style={styles.input}
                value={devSerial}
                onChangeText={setDevSerial}
                placeholder="Found on device label"
                placeholderTextColor={colors.hint}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, !devName && styles.primaryBtnDisabled]}
              onPress={handleAddDevice}
              disabled={!devName}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Add sensor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setDeviceModal(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: colors.cream },

  topbar:                 { flexDirection: 'row', alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                            backgroundColor: colors.cream,
                            borderBottomWidth: 1, borderBottomColor: colors.border },
  brand:                  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark:              { width: 30, height: 30, borderRadius: 8,
                            backgroundColor: colors.green,
                            alignItems: 'center', justifyContent: 'center' },
  brandDot:               { width: 10, height: 10, borderRadius: 5,
                            backgroundColor: colors.white },
  brandName:              { fontSize: 14, fontWeight: '600', letterSpacing: 2,
                            color: colors.green },
  addBtn:                 { paddingHorizontal: 14, paddingVertical: 7,
                            borderRadius: radius.sm, backgroundColor: colors.green },
  addBtnText:             { fontSize: 13, fontWeight: '600', color: colors.white },

  centered:               { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll:                 { flex: 1 },
  scrollContent:          { padding: spacing.lg, gap: spacing.md, paddingBottom: 100 },

  emptyState:             { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
  emptyIcon:              { fontSize: 48 },
  emptyTitle:             { fontSize: 18, fontWeight: '600', color: colors.text },
  emptySub:               { fontSize: 13, color: colors.muted, textAlign: 'center',
                            lineHeight: 20, paddingHorizontal: spacing.xl },
  emptyBtn:               { backgroundColor: colors.green, borderRadius: radius.md,
                            paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyBtnText:           { color: colors.white, fontSize: 14, fontWeight: '600' },

  locationCard:           { backgroundColor: colors.white, borderRadius: radius.lg,
                            borderWidth: 1.5, borderColor: colors.border,
                            padding: spacing.lg, gap: spacing.md },
  locationHeader:         { flexDirection: 'row', alignItems: 'flex-start' },
  locationName:           { fontSize: 16, fontWeight: '600', color: colors.text },
  locationAddress:        { fontSize: 12, color: colors.muted, marginTop: 2 },
  divider:                { height: 1, backgroundColor: colors.border },

  noDevices:              { fontSize: 13, color: colors.hint, textAlign: 'center',
                            paddingVertical: spacing.sm },

  deviceRow:              { flexDirection: 'row', alignItems: 'center',
                            justifyContent: 'space-between', gap: spacing.sm },
  deviceLeft:             { flexDirection: 'row', alignItems: 'center',
                            gap: spacing.sm, flex: 1 },
  deviceIconWrap:         { width: 36, height: 36, borderRadius: radius.sm,
                            backgroundColor: colors.cream2,
                            alignItems: 'center', justifyContent: 'center' },
  deviceIcon:             { fontSize: 18 },
  deviceName:             { fontSize: 13, fontWeight: '600', color: colors.text },
  deviceSub:              { fontSize: 11, color: colors.muted, marginTop: 1 },
  deviceSerial:           { fontSize: 10, color: colors.hint, marginTop: 1 },
  deviceRight:            { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  apiKeyWrap:             { alignItems: 'flex-end' },
  apiKeyLabel:            { fontSize: 9, fontWeight: '600', letterSpacing: 1,
                            textTransform: 'uppercase', color: colors.hint },
  apiKeyVal:              { fontSize: 10, color: colors.muted, fontFamily: 'monospace' },

  deleteBtn:              { width: 28, height: 28, borderRadius: 14,
                            backgroundColor: colors.cream2,
                            alignItems: 'center', justifyContent: 'center' },
  deleteBtnText:          { fontSize: 12, color: colors.muted },

  addSensorBtn:           { borderWidth: 1.5, borderColor: colors.border,
                            borderRadius: radius.sm, padding: spacing.sm,
                            alignItems: 'center', borderStyle: 'dashed' },
  addSensorBtnText:       { fontSize: 13, color: colors.muted, fontWeight: '500' },

  infoCard:               { backgroundColor: colors.greenLight, borderRadius: radius.lg,
                            borderWidth: 1.5, borderColor: '#B2DFC4',
                            padding: spacing.lg, gap: spacing.md },
  infoTitle:              { fontSize: 14, fontWeight: '600', color: colors.green },
  infoDesc:               { fontSize: 12.5, color: colors.green, lineHeight: 18, opacity: 0.8 },
  codeBlock:              { backgroundColor: colors.green, borderRadius: radius.sm,
                            padding: spacing.md },
  codeText:               { fontSize: 11, color: 'rgba(255,255,255,0.85)',
                            fontFamily: 'monospace', lineHeight: 18 },

  modalOverlay:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)',
                            justifyContent: 'flex-end' },
  modalSheet:             { backgroundColor: colors.white,
                            borderTopLeftRadius: radius.xl,
                            borderTopRightRadius: radius.xl,
                            padding: spacing.xl, gap: spacing.md,
                            maxHeight: '85%' },
  modalHandle:            { width: 36, height: 4, backgroundColor: colors.border,
                            borderRadius: 2, alignSelf: 'center',
                            marginBottom: spacing.sm },
  modalTitle:             { fontSize: 18, fontWeight: '600', color: colors.text },
  modalDesc:              { fontSize: 13, color: colors.muted, lineHeight: 18 },

  inputGroup:             { gap: 6 },
  inputLabel:             { fontSize: 12, fontWeight: '600', color: colors.muted },
  input:                  { backgroundColor: colors.cream, borderRadius: radius.sm,
                            borderWidth: 1.5, borderColor: colors.border,
                            paddingHorizontal: 14, paddingVertical: 11,
                            fontSize: 14, color: colors.text },

  manufacturerStrip:      { gap: 8, paddingVertical: 4 },
  manufacturerPill:       { paddingHorizontal: 14, paddingVertical: 7,
                            borderRadius: 20, borderWidth: 1.5,
                            borderColor: colors.border, backgroundColor: colors.white },
  manufacturerPillActive: { backgroundColor: colors.green, borderColor: colors.green },
  manufacturerPillText:   { fontSize: 12, fontWeight: '500', color: colors.muted },
  manufacturerPillTextActive: { color: colors.white },

  primaryBtn:             { backgroundColor: colors.green, borderRadius: radius.md,
                            padding: spacing.md, alignItems: 'center' },
  primaryBtnDisabled:     { opacity: 0.4 },
  primaryBtnText:         { color: colors.white, fontSize: 14, fontWeight: '600' },
  cancelBtn:              { padding: spacing.sm, alignItems: 'center' },
  cancelBtnText:          { fontSize: 14, color: colors.muted },
});