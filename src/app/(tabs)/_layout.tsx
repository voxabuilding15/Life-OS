import { Tabs } from 'expo-router';
import { TabBar } from '@/components/features/TabBar';
import { BASE } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: BASE.dark } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
      <Tabs.Screen name="notes" options={{ title: 'Notes' }} />
    </Tabs>
  );
}
