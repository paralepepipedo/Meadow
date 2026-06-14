'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// Gatillo secreto: N clicks en el objeto activo dentro de una ventana de 4s.
// Sin feedback visual ni sonoro. Config viene de /api/game/trigger-config.
export function useTrigger(onTrigger: () => void) {
  const [config, setConfig] = useState<{ active_object: string; click_count: number }>({
    active_object: '',
    click_count: 99,
  });
  const countRef = useRef(0);
  const targetRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/game/trigger-config')
      .then((r) => r.json())
      .then((c) => setConfig(c))
      .catch(() => {});
  }, []);

  const registerClick = useCallback(
    (objectId: string) => {
      if (objectId !== config.active_object) {
        countRef.current = 0;
        targetRef.current = '';
        return;
      }
      if (targetRef.current !== objectId) {
        targetRef.current = objectId;
        countRef.current = 0;
      }
      countRef.current += 1;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        countRef.current = 0;
        targetRef.current = '';
      }, 4000);

      if (countRef.current >= config.click_count) {
        countRef.current = 0;
        targetRef.current = '';
        if (timerRef.current) clearTimeout(timerRef.current);
        onTrigger();
      }
    },
    [config, onTrigger]
  );

  return { registerClick };
}
