import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { springs, THEMES, useTheme } from '@/theme';
import { Card } from '../ui/Card';
import { SwipePager } from '../ui/SwipePager';
import { BarChart } from '../ui/BarChart';
import { Icon } from '../ui/Icon';
import { ProgressRing } from '../ui/ProgressRing';
import { Text } from '../ui/Text';

function Slide({ width, eyebrow, title, body, children }: { width: number; eyebrow: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <View style={{ width, gap: 14 }}>
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
  const { t: tr } = useI18n();
  const { width } = useWindowDimensions();
  const touched = useRef(false);
  const [page, setPage] = useState(0);
  const pageWidth = width - 40; // screen gutters
  const SLIDES = 3;

  useEffect(() => {
    const id = setInterval(() => {
      if (!touched.current) setPage((p) => (p + 1) % SLIDES);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={{ gap: 14 }}>
      <SwipePager page={page} onPageChange={setPage} width={pageWidth} onTouch={() => (touched.current = true)}>
        <Slide width={pageWidth} eyebrow={tr('paywall.slides.insights.eyebrow')} title={tr('paywall.slides.insights.title')} body={tr('paywall.slides.insights.body')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22 }}>
            <ProgressRing value={0.82} size={92} stroke={9}>
              <Text variant="title" style={{ fontFamily: 'Inter_800ExtraBold' }}>
                82
              </Text>
            </ProgressRing>
            <View style={{ width: 130 }}>
              <BarChart height={60} data={[3, 5, 4, 7, 6, 9, 8].map((v, i) => ({ label: String(i + 1), value: v, highlight: i === 6 }))} />
            </View>
          </View>
        </Slide>
        <Slide width={pageWidth} eyebrow={tr('paywall.slides.freeze.eyebrow')} title={tr('paywall.slides.freeze.title')} body={tr('paywall.slides.freeze.body')}>
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
        <Slide width={pageWidth} eyebrow={tr('paywall.slides.everywhere.eyebrow')} title={tr('paywall.slides.everywhere.title')} body={tr('paywall.slides.everywhere.body')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <Icon name="cloud-done" size={44} color={t.accent} />
            {Object.values(THEMES).map((th) => (
              <View key={th.id} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: th.accent, shadowColor: th.accent, shadowOpacity: th.glow, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } }} />
            ))}
          </View>
        </Slide>
      </SwipePager>
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} active={page === i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' } });
