'use client';
import { useState } from 'react';
import { CROP_TYPES } from '@/lib/gameData';

type Crop = { id: number; type: string; ready: boolean; grid_x: number; grid_y: number; ready_at: string };

// Panel del huerto: grilla de 8 parcelas (4x2). Plantar / cosechar.
export default function CropPanel({
  crops, coins, onPlant, onHarvest, onClose,
}: {
  crops: Crop[];
  coins: number;
  onPlant: (type: string, gx: number, gy: number) => void;
  onHarvest: (id: number) => void;
  onClose: () => void;
}) {
  const [selecting, setSelecting] = useState<{ gx: number; gy: number } | null>(null);

  const plots: { gx: number; gy: number }[] = [];
  for (let y = 0; y < 2; y++) for (let x = 0; x < 4; x++) plots.push({ gx: x, gy: y });

  const cropAt = (gx: number, gy: number) => crops.find((c) => c.grid_x === gx && c.grid_y === gy);

  const timeLeft = (readyAt: string) => {
    const ms = new Date(readyAt).getTime() - Date.now();
    if (ms <= 0) return 'listo';
    const m = Math.ceil(ms / 60000);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-[#5a4a2f] w-full rounded-t-3xl p-4 fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-3">
          <span className="font-pixel text-[10px] text-yellow-100">🌾 Huerto</span>
          <button onClick={onClose} className="ml-auto font-pixel text-[10px] text-white/70 px-2">✕</button>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-3">
          {plots.map((p) => {
            const c = cropAt(p.gx, p.gy);
            const def = c ? CROP_TYPES[c.type] : null;
            return (
              <button
                key={`${p.gx}-${p.gy}`}
                onClick={() => {
                  if (!c) setSelecting(p);
                  else if (c.ready) onHarvest(c.id);
                }}
                className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1"
                style={{ background: c ? '#6d5838' : '#4a3c24', border: '2px dashed #8a7144' }}
              >
                {c && def ? (
                  <>
                    <span className="text-2xl">{c.ready ? def.emoji : '🌱'}</span>
                    <span className="font-pixel text-[6px] text-white/80">{timeLeft(c.ready_at)}</span>
                  </>
                ) : (
                  <span className="text-xl opacity-40">➕</span>
                )}
              </button>
            );
          })}
        </div>

        {selecting && (
          <div className="bg-black/30 rounded-2xl p-3">
            <p className="font-pixel text-[8px] text-white/80 mb-2">Elegir semilla:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CROP_TYPES).map(([key, def]) => (
                <button
                  key={key}
                  disabled={coins < def.seedCost}
                  onClick={() => { onPlant(key, selecting.gx, selecting.gy); setSelecting(null); }}
                  className="bg-white/10 rounded-xl p-2 flex items-center gap-2 disabled:opacity-40"
                >
                  <span className="text-2xl">{def.emoji}</span>
                  <div className="text-left">
                    <p className="font-pixel text-[7px] text-white">{def.label}</p>
                    <p className="font-pixel text-[6px] text-yellow-200">🪙{def.seedCost} · {def.hours}h</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
