'use client';
import { ANIMAL_TYPES } from '@/lib/gameData';

type Animal = { id: number; type: string; name: string; hunger: number; produce_ready: boolean };

// Menu de un animal: alimentar o recolectar produccion.
export default function AnimalMenu({
  animal, coins, onFeed, onCollect, onClose,
}: {
  animal: Animal;
  coins: number;
  onFeed: () => void;
  onCollect: () => void;
  onClose: () => void;
}) {
  const def = ANIMAL_TYPES[animal.type];
  if (!def) return null;
  const hungry = animal.hunger < 40;

  return (
    <div className="absolute inset-0 z-40 bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-[#3e5641] w-full rounded-t-3xl p-4 fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-4xl ${hungry ? 'opacity-60' : ''}`}>{def.emoji}</span>
          <div>
            <p className="font-pixel text-[10px] text-white">{animal.name || def.label}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-pixel text-[7px] text-white/70">Hambre</span>
              <div className="w-20 h-2 bg-black/40 rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${animal.hunger}%`, background: hungry ? '#e74c3c' : '#6ab04c' }}
                />
              </div>
            </div>
            {hungry && <p className="font-pixel text-[7px] text-red-300 mt-1">😢 tiene hambre</p>}
          </div>
          <button onClick={onClose} className="ml-auto font-pixel text-[10px] text-white/70 px-2">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onFeed}
            disabled={coins < def.feedCost}
            className="bg-white/15 rounded-xl py-3 flex flex-col items-center gap-1 disabled:opacity-40"
          >
            <span className="text-2xl">🌾</span>
            <span className="font-pixel text-[7px] text-white">Alimentar (🪙{def.feedCost})</span>
          </button>
          <button
            onClick={onCollect}
            disabled={!animal.produce_ready}
            className="bg-white/15 rounded-xl py-3 flex flex-col items-center gap-1 disabled:opacity-40"
          >
            <span className="text-2xl">{def.produce}</span>
            <span className="font-pixel text-[7px] text-white">
              {animal.produce_ready ? `Recolectar ${def.produceLabel}` : 'Sin produccion'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
