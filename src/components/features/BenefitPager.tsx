import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { springs, THEMES, useTheme } from '@/theme';
import { Card } from '../ui/Card';
import { BarChart } from '../ui/BarChart';
import { Icon } from '../ui/Icon';
import { ProgressRing } from '../ui/ProgressRing';
import { Text } from '../ui/Text';

function Slide({ width, eyebrow, title, body, children }: { width: number; eyebrow: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <View style={{ width, paddingHorizontal: 20, gap: 14 }}>
      <Card padding={18} accent>
        <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
      </Card>
      <View style={{ gap: 4 }}>
        <Text variant="micro" color="accent">
          {eyebrow}
        </Text>
        <Text variant="title" style={{ fontSize: 22, lineHeight: 28 }}>
          {title}
        </Text>
        <Text variant="body" color="secondary">
          {body}
        </Text>
      </View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const t = useTheme();
  const s = useAnimatedStyle(() => ({ width: withSpring(active ? 22 : 6, springs.snappy) }));
  return <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: active ? t.accent : t.surfaceStrong }, s]} />;
}

/** Three swipeable benefit slides with live mini-mockups. Auto-advances until the user touches it. */
export function BenefitPager() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const ref = useRef<ScrollView>(null);
  const touched = useRef(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (touched.current) return;
      setPage((p) => {
        const next = (p + 1) % 3;
        ref.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4200);
    return () => clearInterval(id);
  }, [width]);

  return (
    <View style={{ gap: 14 }}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => (touched.current = true)}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ marginHorizontal: -20 }}
      >
        <Slide width={width} eyebrow="INSIGHTS" title="See the full picture" body="30-day trends, mood and focus analytics, and a weekly report you can share.">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22 }}>
            <ProgressRing value={0.82} size={92} stroke={9}>
              <Text variant="title" style={{ fontFamily: 'Inter_800ExtraBold' }}>
                82
              </Text>
            </ProgressRing>
            <View style={{ width: 130 }}>
              <BarChart height={60} data={[3, 5, 4, 7, 6, 9, 8].map((v, i) => ({ label: 'MTWTFSS'[i], value: v, highlight: i === 6 }))} />
            </View>
          </View>
        </Slide>
        <Slide width={width} eyebrow="STREAK FREEZE" title="Never lose a streak" body="Missed a day? Freeze it. Two freezes every month keep your hard work safe.">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.day, { backgroundColor: t.accent }]}>
                <Icon name="checkmark" size={18} color={t.onAccent} />
              </View>
            ))}
            <View style={[styles.day, { backgroundColor: t.accentSoft, borderWidth: 1.5, borderColor: t.accent }]}>
              <Icon name="snow" size={20} color={t.accent} />
            </View>
            {[0, 1].map((i) => (
              <View key={i} style={[styles.day, { backgroundColor: t.accent }]}>
                <Icon name="checkmark" size={18} color={t.onAccent} />
              </View>
            ))}
          </View>
        </Slide>
        <Slide width={width} eyebrow="EVERYWHERE" title="Sync, themes, no limits" body="Back up to the cloud, switch devices freely and make Life OS look the way you like.">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <Icon name="cloud-done" size={44} color={t.accent} />
            {Object.values(THEMES).map((th) => (
              <View key={th.id} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: th.accent, shadowColor: th.accent, shadowOpacity: th.glow, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } }} />
            ))}
          </View>
        </Slide>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} active={page === i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' } });
