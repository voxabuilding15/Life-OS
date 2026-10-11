import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Sets the layout direction for everything inside it. Native uses the `direction` style (Yoga);
 * react-native-web additionally needs the `dir` prop so logical `start`/`end` styles resolve correctly.
 */
export function DirectionView({ rtl, style, children }: { rtl: boolean; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const dir = rtl ? 'rtl' : 'ltr';
  const props = { dir } as object;
  return (
    <View {...props} style={[style, { direction: dir }]}>
      {children}
    </View>
  );
}
