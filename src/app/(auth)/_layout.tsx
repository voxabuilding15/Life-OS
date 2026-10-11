import { Stack } from 'expo-router';
import { BASE } from '@/theme';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BASE.dark }, animation: 'slide_from_right' }} />;
}
