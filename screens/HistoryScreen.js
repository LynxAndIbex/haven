import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>History — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.muted, fontSize: 14 },
});