'use client';
import { useEffect, useState } from 'react';
import { INTERIOR_OBJECTS } from '@/lib/gameData';

type Props = {
  registerClick: (id: string) => void;
  onExit: () => void;
  onAction: (action: string) => void;
  stats: { coins: number; level: number; xp: number };
};

const MISSIONS = [
  { id: 'harvest', label: 'Cosechar 3 cultivos', reward: '+30 🪙', done: true },
  { id: 'feed',    label: 'Alimentar animales',  reward: '+20 XP', done: true },
  { id: 'plant',   label: 'Plantar 5 semillas',  reward: '+25 🪙', done: false, progress: 3, total: 5 },
  { id: 'chop',    label: 'Cortar el árbol',     reward: '+15 🪙', done: false },
];

const BUBBLES = [
  { id: 1, text: '🐄 ¡Vaca con hambre!',     color: 'rgba(231,76,60,0.92)',   top: '44%', left: '6%'  },
  { id: 2, text: '🌽 Maíz listo en 45 min',  color: 'rgba(39,174,96,0.92)',   top: '18%', left: '55%' },
  { id: 3, text: '⭐ +5 XP ganados',          color: 'rgba(155,89,182,0.92)',  top: '35%', left: '36%' },
];

export default function HouseInterior({ registerClick, onExit, onAction, stats }: Props) {
  const [radioOn, setRadioOn] = useState(false);
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState('');
  const [visibleBubble, setVisibleBubble] = useState(0);
  const [countdown, setCountdown] = useState({ h: 1, m: 20 });

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2000); };

  // Rotar burbujas cada 3 segundos
  useEffect(() => {
    const t = setInterval(() => {
      setVisibleBubble((v) => (v + 1) % BUBBLES.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Countdown de cosecha
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c.m > 0) return { ...c, m: c.m - 1 };
        if (c.h > 0) return { h: c.h - 1, m: 59 };
        return c;
      });
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const handleClick = (id: string) => {
    registerClick(id);
    switch (id) {
      case 'bed':     onAction('rest'); flash('😴 Descansando...'); break;
      case 'kitchen': flash('🍳 No tienes ingredientes'); break;
      case 'radio':   setRadioOn(v => !v); flash(radioOn ? '📻 Radio apagada' : '📻 Radio encendida'); break;
      case 'mirror':  flash(`🪞 Nivel ${stats.level} · ${stats.coins} monedas`); break;
      case 'phone':   flash('☎️ Sin señal...'); break;
      case 'candle':  setDark(v => !v); break;
      case 'mailbox': flash('📬 Sin cartas nuevas'); break;
      case 'painting':flash('🖼️ Un paisaje hermoso'); break;
      case 'plant':   flash('🪴 La planta está bien'); break;
      case 'clock':   flash(`🕰️ ${new Date().toLocaleTimeString()}`); break;
    }
  };

  const xpForNext = stats.level * 100;
  const xpPct = Math.min(100, Math.round((stats.xp / xpForNext) * 100));

  return (
    <div className="absolute inset-0 z-20 flex flex-col" style={{ background: dark ? 'rgba(0,0,0,0.85)' : 'transparent' }}>
      {/* Fondo */}
      <div className="absolute inset-0" style={{ backgroundImage: 'url(/interior.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: dark ? 'brightness(0.3)' : 'brightness(1)', transition: 'filter 0.5s' }} />
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.15)' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-2 bg-black/40">
        <button onClick={onExit} className="px-3 py-1 bg-amber-700/90 text-white text-xs font-pixel rounded-lg active:scale-95">← Salir</button>
        <span className="text-white/90 text-xs font-pixel">Interior de la casa</span>
        {radioOn && <span className="text-xs ml-auto animate-pulse">🎵 ♪ ♫</span>}
      </div>

      {/* ===== OPCION A: Panel de estado (arriba derecha) ===== */}
      <div className="absolute top-14 right-2 z-20" style={{ background: 'rgba(0,0,0,0.72)', borderRadius: 12, padding: '8px 10px', minWidth: 120, border: '1px solid rgba(255,255,255,0.12)' }}>
        <div style={{ color: '#a8d5b5', fontSize: 9, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>GRANJA — Nv {stats.level}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
          <span style={{ fontSize: 12 }}>☀️</span>
          <span style={{ color: '#f5c518', fontSize: 10 }}>Soleado</span>
        </div>
        <div style={{ marginBottom: 5 }}>
          <div style={{ color: '#666', fontSize: 8, marginBottom: 2 }}>próx. cosecha</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10 }}>🌾</span>
            <div style={{ flex: 1, background: '#1a1a2e', borderRadius: 10, height: 5, overflow: 'hidden' }}>
              <div style={{ background: '#6ab04c', width: '65%', height: '100%', borderRadius: 10 }} />
            </div>
            <span style={{ color: '#6ab04c', fontSize: 9 }}>{countdown.h}h {countdown.m}m</span>
          </div>
        </div>
        <div style={{ marginBottom: 5 }}>
          <div style={{ color: '#666', fontSize: 8, marginBottom: 2 }}>XP nivel siguiente</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ flex: 1, background: '#1a1a2e', borderRadius: 10, height: 5, overflow: 'hidden' }}>
              <div style={{ background: '#9b59b6', width: `${xpPct}%`, height: '100%', borderRadius: 10 }} />
            </div>
            <span style={{ color: '#9b59b6', fontSize: 9 }}>{xpPct}%</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid rgba(255,255,255,0.1)', paddingTop: 5, marginTop: 3 }}>
          <span style={{ color: '#f5c518', fontSize: 10 }}>🪙 {stats.coins}</span>
          <span style={{ color: '#9b59b6', fontSize: 10 }}>⭐ {stats.xp} XP</span>
        </div>
      </div>

      {/* ===== OPCION C: Cuadro misiones (centro arriba) ===== */}
      <div className="absolute z-20" style={{ top: '12%', left: '30%', right: '30%', background: 'rgba(10,10,25,0.85)', borderRadius: 10, padding: '8px 10px', border: '2px solid #8B6040' }}>
        <div style={{ color: '#f5c518', fontSize: 9, fontWeight: 600, marginBottom: 6, textAlign: 'center' }}>📋 MISIONES DE HOY</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {MISSIONS.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: m.done ? '#27ae60' : 'transparent', border: m.done ? 'none' : '1.5px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, flexShrink: 0, color: 'white' }}>
                {m.done ? '✓' : ''}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: m.done ? '#6ab04c' : '#aaa', fontSize: 8, textDecoration: m.done ? 'line-through' : 'none' }}>{m.label}</div>
                {!m.done && m.progress !== undefined && (
                  <div style={{ background: '#1a1a2e', borderRadius: 10, height: 3, marginTop: 2, overflow: 'hidden' }}>
                    <div style={{ background: '#f5c518', width: `${(m.progress! / m.total!) * 100}%`, height: '100%', borderRadius: 10 }} />
                  </div>
                )}
              </div>
              <span style={{ color: '#888', fontSize: 7, flexShrink: 0 }}>{m.reward}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== OPCION B: Burbuja flotante rotativa ===== */}
      {BUBBLES.map((b, i) => (
        <div
          key={b.id}
          className="absolute z-20"
          style={{
            top: b.top, left: b.left,
            background: b.color,
            borderRadius: '12px 12px 12px 2px',
            padding: '5px 8px',
            border: '1px solid rgba(255,255,255,0.25)',
            opacity: visibleBubble === i ? 1 : 0,
            transform: visibleBubble === i ? 'translateY(0) scale(1)' : 'translateY(4px) scale(0.95)',
            transition: 'opacity 0.4s, transform 0.4s',
            pointerEvents: 'none',
          }}
        >
          <div style={{ color: 'white', fontSize: 10, whiteSpace: 'nowrap' }}>{b.text}</div>
        </div>
      ))}

      {/* Objetos clickeables */}
      <div className="relative z-10 flex-1">
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <div className="grid grid-cols-5 gap-2">
            {INTERIOR_OBJECTS.map((obj) => (
              <button key={obj.id} onClick={() => handleClick(obj.id)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                <div className="w-11 h-11 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-xl border border-white/20 hover:border-white/60">{obj.emoji}</div>
                <span className="text-white text-[7px] font-pixel drop-shadow">{obj.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 bg-black/80 text-white text-[10px] font-pixel px-4 py-2 rounded-xl whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
