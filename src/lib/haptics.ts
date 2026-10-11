import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/store/settings';

const on = () => Platform.OS !== 'web' && useSettings.getState().haptics;

export const haptic = {
  tap: () => on() && void Haptics.selectionAsync(),
  light: () => on() && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => on() && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  success: () => on() && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => on() && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
