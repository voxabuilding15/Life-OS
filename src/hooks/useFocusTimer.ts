import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { t } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { nowIso } from '@/lib/id';
import { logFocusSession } from '@/services/actions';
import { cancelFocusEnd, scheduleFocusEnd } from '@/services/notifications';
import { useSettings } from '@/store/settings';

export type FocusMode = 'focus' | 'short' | 'long';

/**
 * Pomodoro engine. Time is derived from a wall-clock `endAt`, so it stays correct when the app is
 * backgrounded; a local notification fires if the timer ends while away.
 */
export function useFocusTimer(taskId: string | null) {
  const settings = useSettings();
  const durationFor = useCallback(
    (m: FocusMode) => (m === 'focus' ? settings.focusMinutes : m === 'short' ? settings.shortBreakMinutes : settings.longBreakMinutes) * 60,
    [settings.focusMinutes, settings.shortBreakMinutes, settings.longBreakMinutes],
  );

  const [mode, setMode] = useState<FocusMode>('focus');
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(() => durationFor('focus'));
  const [completedInCycle, setCompletedInCycle] = useState(0);
  const endAt = useRef<number | null>(null);
  const startedAt = useRef<string | null>(null);
  const planned = useRef(0);

  // Keep the idle display in sync with duration changes.
  useEffect(() => {
    if (!running) setRemaining(durationFor(mode));
  }, [durationFor, mode, running]);

  const finishSession = useCallback(
    (completed: boolean, elapsedSeconds: number) => {
      if (mode !== 'focus' || !startedAt.current) return;
      logFocusSession({ startedAt: startedAt.current, durationSeconds: Math.round(elapsedSeconds), plannedSeconds: planned.current, completed, taskId });
      startedAt.current = null;
    },
    [mode, taskId],
  );

  const goTo = useCallback((m: FocusMode) => {
    setMode(m);
    setRunning(false);
    endAt.current = null;
  }, []);

  const complete = useCallback(() => {
    haptic.success();
    void cancelFocusEnd();
    setRunning(false);
    endAt.current = null;
    if (mode === 'focus') {
      finishSession(true, planned.current);
      const n = completedInCycle + 1;
      if (n >= settings.sessionsUntilLongBreak) {
        setCompletedInCycle(0);
        setMode('long');
      } else {
        setCompletedInCycle(n);
        setMode('short');
      }
    } else {
      setMode('focus');
    }
  }, [mode, finishSession, completedInCycle, settings.sessionsUntilLongBreak]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, Math.round(((endAt.current ?? 0) - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) complete();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, complete]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (running) void activateKeepAwakeAsync('focus');
    return () => {
      deactivateKeepAwake('focus');
    };
  }, [running]);

  const start = () => {
    const total = running ? remaining : remaining > 0 ? remaining : durationFor(mode);
    endAt.current = Date.now() + total * 1000;
    if (mode === 'focus' && !startedAt.current) {
      startedAt.current = nowIso();
      planned.current = durationFor('focus');
    }
    setRunning(true);
    haptic.medium();
    void scheduleFocusEnd(total, t(mode === 'focus' ? 'notifications.focusDone' : 'notifications.breakOver'));
  };

  const pause = () => {
    setRunning(false);
    endAt.current = null;
    void cancelFocusEnd();
    haptic.light();
  };

  const reset = () => {
    const elapsed = planned.current - remaining;
    if (mode === 'focus' && startedAt.current && elapsed >= 60) finishSession(false, elapsed);
    startedAt.current = null;
    setRunning(false);
    endAt.current = null;
    setRemaining(durationFor(mode));
    void cancelFocusEnd();
  };

  const skip = () => {
    if (mode === 'focus' && startedAt.current) {
      const elapsed = planned.current - remaining;
      if (elapsed >= 60) finishSession(false, elapsed);
      startedAt.current = null;
    }
    void cancelFocusEnd();
    goTo(mode === 'focus' ? 'short' : 'focus');
  };

  const total = durationFor(mode);
  return { mode, running, remaining, total, progress: total ? 1 - remaining / total : 0, completedInCycle, start, pause, reset, skip, goTo };
}
