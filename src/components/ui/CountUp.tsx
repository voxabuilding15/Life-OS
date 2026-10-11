import { useEffect, useRef, useState } from 'react';
import type { TextProps } from 'react-native';
import { Text } from './Text';

interface Props extends TextProps {
  value: number;
  duration?: number;
  suffix?: string;
  variant?: React.ComponentProps<typeof Text>['variant'];
  color?: React.ComponentProps<typeof Text>['color'];
}

/** Number that eases from its previous value to the new one. */
export function CountUp({ value, duration = 800, suffix = '', variant, color, style, ...rest }: Props) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current;
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(start + (value - start) * eased);
      setShown(v);
      from.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <Text variant={variant} color={color} style={style} {...rest}>
      {shown}
      {suffix}
    </Text>
  );
}
