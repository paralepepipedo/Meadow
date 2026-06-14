'use client';
import { useEffect, useState } from 'react';
import { INTERIOR_OBJECTS, WORLD_OBJECTS, EXTERIOR_TRIGGER_IDS } from '@/lib/gameData';

export default function TriggerConfig({ token }: { token: string }) {
  const [activeObject, setActiveObject] = useState('mailbox');
  const [clicks, setClicks] = useState(3);
  const [saved, setSaved] = useState('');

  const options = [
    ...INTERIOR_OBJECTS.filter((o) => o.canBeTrigger).map((o) => ({ id: o.id, label: `${o.emoji} ${o.label} (interior)` })),
    ...WORLD_OBJECTS.filter((o) => EXTERIOR_TRIGGER_IDS.includes(o.id)).map((o) => ({ id: o.id, label: `${o.emoji} ${o.label} (exterior)` })),
  ];

  useEffect(() => {
    fetch('/api/game/trigger-config')
      .then((r) => r.json())
      .then((c) => {
        setActiveObject(c.active_object);
        setClicks(c.click_count);
      });
  }, []);

  const save = async () => {
    const r = await fetch('/api/admin/trigger-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active_object: activeObject, click_count: clicks }),
    });
    const data = await r.json();
    setSaved(data.ok ? 'Guardado ✓' : `Error: ${data.error}`);
    setTimeout(() => setSaved(''), 2500);
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-gray-200 font-semibold">Gatillo secreto</h2>
      <div className="bg-gray-900 rounded-xl p-3 flex flex-col gap-3">
        <label className="text-gray-400 text-sm">Objeto activo</label>
        <select
          value={activeObject}
          onChange={(e) => setActiveObject(e.target.value)}
          className="bg-gray-800 text-gray-100 rounded-lg px-3 py-2 text-sm"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>

        <label className="text-gray-400 text-sm">Cantidad de toques (2-8, en menos de 4 segundos)</label>
        <input
          type="number" min={2} max={8} value={clicks}
          onChange={(e) => setClicks(Number(e.target.value))}
          className="bg-gray-800 text-gray-100 rounded-lg px-3 py-2 text-sm w-24"
        />

        <button onClick={save} className="bg-emerald-700 text-white rounded-lg py-2 text-sm">Guardar</button>
        {saved && <p className="text-emerald-400 text-sm">{saved}</p>}
      </div>
    </section>
  );
}
