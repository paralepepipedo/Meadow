'use client';
import { xpForLevel } from '@/lib/gameData';

const WEATHER_ICON: Record<string, string> = { sunny: '☀️', cloudy: '☁️', rainy: '🌧️' };

export default function GameHUD({
  coins, level, xp, weather, userEmoji, onChangeUser,
}: {
  coins: number; level: number; xp: number; weather: string; userEmoji: string; onChangeUser: () => void;
}) {
  const need = xpForLevel(level);
  const pct = Math.min(100, Math.round((xp / need) * 100));
  return (
    <div className="absolute top-0 left-0 right-0 z-30 p-2 flex items-center gap-2 pointer-events-none">
      <div className="bg-black/50 backdrop-blur rounded-xl px-3 py-2 flex items-center gap-3 pointer-events-auto">
        <span className="text-xl">{userEmoji}</span>
        <div className="flex flex-col">
          <span className="font-pixel text-[8px] text-yellow-300">Nv {level}</span>
          <div className="w-16 h-1.5 bg-gray-700 rounded-full mt-1">
            <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="font-pixel text-[9px] text-yellow-100">🪙 {coins}</span>
        <span className="text-lg">{WEATHER_ICON[weather] || '☀️'}</span>
      </div>
      <button
        onClick={onChangeUser}
        className="ml-auto bg-black/40 rounded-lg px-2 py-1.5 font-pixel text-[7px] text-white/70 pointer-events-auto"
      >
        cambiar
      </button>
    </div>
  );
}
