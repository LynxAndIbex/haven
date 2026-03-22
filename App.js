import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { colors } from './theme';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import SensorsScreen from './screens/SensorsScreen';
import HomeScreen     from './screens/HomeScreen';
import HistoryScreen  from './screens/HistoryScreen';
import ForecastScreen from './screens/ForecastScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen    from './screens/LoginScreen';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const { session, loading } = useSettings();

  // Show spinner while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center',
        justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  // No session → show login
  if (!session) {
    return <LoginScreen />;
  }

  // Session exists → show main app
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:             false,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor:  colors.border,
          borderTopWidth:  1,
          height:          60,
          paddingBottom:   8,
          paddingTop:      6,
        },
        tabBarActiveTintColor:   colors.green,
        tabBarInactiveTintColor: colors.hint,
        tabBarLabelStyle: {
          fontSize:   10,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     options={{ tabBarLabel: 'Home'     }}/>
      <Tab.Screen name="History"  component={HistoryScreen}  options={{ tabBarLabel: 'History'  }}/>
      <Tab.Screen name="Forecast" component={ForecastScreen} options={{ tabBarLabel: 'Forecast' }}/>
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }}/>
      <Tab.Screen name="Sensors" component={SensorsScreen} options={{ tabBarLabel: 'Sensors' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </SettingsProvider>
  );
}