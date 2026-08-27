import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, typography } from '@/theme';
import { th } from '@/i18n/th';

const iconFor = (name: keyof typeof Ionicons.glyphMap, focused: boolean) =>
  (focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap));

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { ...typography.caption, fontWeight: '600' },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 86 : 68,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          ...shadows.soft,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: th.nav.home,
          tabBarIcon: ({ color, focused }) => <Ionicons name={iconFor('home', focused)} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'สร้าง',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={iconFor('videocam', focused)} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: th.nav.projects,
          tabBarIcon: ({ color, focused }) => <Ionicons name={iconFor('albums', focused)} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: th.nav.templates,
          tabBarIcon: ({ color, focused }) => <Ionicons name={iconFor('grid', focused)} size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: th.nav.profile,
          tabBarIcon: ({ color, focused }) => <Ionicons name={iconFor('person-circle', focused)} size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
