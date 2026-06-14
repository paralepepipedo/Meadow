'use client';
import { useCallback, useEffect, useState } from 'react';

type AdminMsg = {
  id: number; user_id: number; type: string; content: string | null;
  media_url: string | null; is_deleted: boolean; hidden_until: string | null;
  created_at: string; display_name: string; emoji: string;
};

export default function MessageManager({ token }: { token: string }) {
  const [msgs, setMsgs] = useState<AdminMsg[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    const qs = filterDate ? `?date=${filterDate}` : '';
    const r = await fetch(`/api/messages/admin${qs}`, { headers });
    const data = await r.json();
    if (Array.isArray(data)) setMsgs(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filterDate]);

  useEffect(() => { load(); }, [load]);

  const act = async (body: Record<string, any>) => {
    await fetch('/api/messages/admin', { method: 'POST', headers, body: JSON.stringify(body) });
    load();
  };

  const hide = (id: number) => {
    const days = prompt('Ocultar por cuantos dias?', '7');
    if (!days) return;
    const until = new Date(Date.now() + Number(days) * 86400000).toISOString();
    act({ action: 'hide', id, until });
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-gray-200 font-semibold flex-1">Mensajes</h2>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
          className="bg-gray-800 text-gray-300 rounded-lg px-2 py-1 text-xs" />
        <button
          onClick={() => confirm('Borrar TODOS los mensajes?') && act({ action: 'clear_all' })}
          className="bg-red-900 text-red-200 rounded-lg px-3 py-1.5 text-xs"
        >
          Limpiar todo
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
        {msgs.map((m) => (
          <div key={m.id} className={`bg-gray-900 rounded-xl p-3 ${m.is_deleted ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span>{m.emoji} {m.display_name}</span>
              <span>·</span>
              <span>{new Date(m.created_at).toLocaleString('es-CL')}</span>
              {m.is_deleted && <span className="text-red-400">borrado</span>}
              {m.hidden_until && new Date(m.hidden_until) > new Date() && (
                <span className="text-yellow-400">oculto hasta {new Date(m.hidden_until).toLocaleDateString('es-CL')}</span>
              )}
            </div>
            <p className="text-gray-200 text-sm break-words">
              {m.type === 'text' ? m.content : `[${m.type}] ${m.media_url?.slice(0, 50) || ''}`}
            </p>
            {!m.is_deleted && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => act({ action: 'delete', id: m.id })}
                  className="text-xs bg-red-950 text-red-300 rounded px-2 py-1">Borrar</button>
                {m.hidden_until && new Date(m.hidden_until) > new Date() ? (
                  <button onClick={() => act({ action: 'unhide', id: m.id })}
                    className="text-xs bg-yellow-950 text-yellow-300 rounded px-2 py-1">Mostrar</button>
                ) : (
                  <button onClick={() => hide(m.id)}
                    className="text-xs bg-gray-800 text-gray-300 rounded px-2 py-1">Ocultar</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
