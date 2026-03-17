import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Haven — Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.green, fontSize: 18, fontWeight: '600' },
});