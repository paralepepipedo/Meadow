'use client';
import { useCallback, useEffect, useState } from 'react';

export default function ConfigPanel({ token }: { token: string }) {
  const [weather, setWeather] = useState('sunny');
  const [retention, setRetention] = useState('30');
  const [note, setNote] = useState('');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/config', { headers });
    const cfg = await r.json();
    if (cfg.weather_current) setWeather(cfg.weather_current);
    if (cfg.message_retention_days) setRetention(cfg.message_retention_days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const post = async (body: Record<string, any>) => {
    const r = await fetch('/api/admin/config', { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await r.json();
    setNote(data.ok ? 'Guardado ✓' : 'Error');
    setTimeout(() => setNote(''), 2000);
    load();
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-gray-200 font-semibold">Configuracion</h2>
      <div className="bg-gray-900 rounded-xl p-3 flex flex-col gap-3">
        <label className="text-gray-400 text-sm">Clima (override manual)</label>
        <div className="flex gap-2">
          {(['sunny', 'cloudy', 'rainy'] as const).map((w) => (
            <button
              key={w}
              onClick={() => { setWeather(w); post({ action: 'set_weather', value: w }); }}
              className={`rounded-lg px-3 py-2 text-sm ${weather === w ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              {w === 'sunny' ? '☀️' : w === 'cloudy' ? '☁️' : '🌧️'}
            </button>
          ))}
          <button onClick={() => post({ action: 'random_weather' })}
            className="ml-auto bg-gray-800 text-gray-300 rounded-lg px-3 py-2 text-sm">🎲 Regenerar</button>
        </div>

        <label className="text-gray-400 text-sm">Retencion de mensajes (dias)</label>
        <div className="flex gap-2">
          <input
            type="number" min={1} value={retention}
            onChange={(e) => setRetention(e.target.value)}
            className="bg-gray-800 text-gray-100 rounded-lg px-3 py-2 text-sm w-24"
          />
          <button onClick={() => post({ action: 'set_retention', value: retention })}
            className="bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm">Guardar</button>
        </div>
        {note && <p className="text-emerald-400 text-sm">{note}</p>}
      </div>
    </section>
  );
}
