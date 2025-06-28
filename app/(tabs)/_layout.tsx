import { Tabs } from 'expo-router';
import { Wind, Settings } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#16213e',
          paddingBottom: Platform.select({
            ios: insets.bottom > 0 ? insets.bottom : 8,
            android: 20,
            default: 8,
          }),
          paddingTop: 8,
          height: Platform.select({
            ios: insets.bottom > 0 ? 70 + insets.bottom : 70,
            android: 90,
            default: 70,
          }),
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Breathe',
          tabBarIcon: ({ size, color }) => (
            <Wind size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="device-preview"
        options={{
          href: null, // This hides the tab
        }}
      />
    </Tabs>
  );
}