'use client';
import { useEffect, useRef } from 'react';

export function useVisibility(active: boolean, onHide: () => void) {
  const pickingFileRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;

    const handleVisibility = () => {
      if (!document.hidden) return; // volvió visible — cancelar cualquier cierre pendiente
      if (pickingFileRef.current) {
        // Viene del selector de archivos — esperar 10s antes de cerrar
        // Si el usuario vuelve con un archivo, el timer se cancela
        hideTimerRef.current = setTimeout(() => {
          if (document.hidden) onHide();
        }, 10000);
      } else {
        onHide();
      }
    };

    const handleVisible = () => {
      // Usuario volvió a la app — cancelar cierre pendiente
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      pickingFileRef.current = false;
    };

    const handleHide = () => {
      if (!pickingFileRef.current) onHide();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('pagehide', handleHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('pagehide', handleHide);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [active, onHide]);

  const setPickingFile = (val: boolean) => {
    pickingFileRef.current = val;
    if (!val && hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  return { setPickingFile };
}

export function useBackButton(active: boolean, onBack: () => void) {
  useEffect(() => {
    if (!active) return;
    history.pushState({ chat: true }, '');
    const handlePop = () => onBack();
    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
      if (history.state?.chat) history.back();
    };
  }, [active, onBack]);
}
