'use client';
import { useCallback, useEffect, useState } from 'react';

type AdminUser = {
  id: number; username: string; display_name: string; emoji: string;
  color: string; avatar_url: string | null; is_active: boolean; notifications_enabled: boolean;
};

const EMOJIS = ['🌻', '🦊', '🐻', '🐑', '🐱', '🐶', '🦉', '🐸', '🦋', '🐢', '🌵', '🍄'];

function AvatarUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', 'image');
      form.append('user_id', '0');
      const r = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await r.json();
      if (data.ok) onUploaded(data.url);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <label className="cursor-pointer bg-gray-800 text-gray-300 rounded-lg px-3 py-2 text-sm text-center hover:bg-gray-700">
      {uploading ? 'Subiendo...' : '📷 Subir avatar'}
      <input type="file" accept="image/*" hidden onChange={handle} />
    </label>
  );
}

function EditModal({ user, token, onDone }: { user: AdminUser; token: string; onDone: () => void }) {
  const [name, setName] = useState(user.display_name);
  const [emoji, setEmoji] = useState(user.emoji);
  const [color, setColor] = useState(user.color);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        id: user.id,
        display_name: name,
        emoji,
        color,
        avatar_url: avatarUrl || null,
      }),
    });
    setSaving(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-gray-900 rounded-2xl p-4 w-full max-w-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-200 font-semibold">Editar usuario</h3>
          <button onClick={onDone} className="text-gray-400 text-xl">✕</button>
        </div>

        {/* Avatar preview */}
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-gray-700" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-3xl">{emoji}</div>
          )}
          <div className="flex flex-col gap-2 flex-1">
            <AvatarUpload onUploaded={(url) => setAvatarUrl(url)} />
            {avatarUrl && (
              <button onClick={() => setAvatarUrl('')} className="text-xs text-red-400 text-left">Quitar avatar</button>
            )}
          </div>
        </div>

        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="bg-gray-800 text-gray-100 rounded-lg px-3 py-2 text-sm outline-none"
        />

        <div className="flex gap-2 flex-wrap">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setEmoji(e)}
              className={`text-xl p-1 rounded ${emoji === e ? 'bg-emerald-800' : ''}`}>{e}</button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-gray-400 text-sm">Color:</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-8 rounded" />
        </div>

        <button
          onClick={save} disabled={saving}
          className="bg-emerald-700 text-white rounded-lg py-2 text-sm disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

export default function UserManager({ token }: { token: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🌻');
  const [newColor, setNewColor] = useState('#6ab04c');
  const [newAvatar, setNewAvatar] = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    const r = await fetch('/api/users', { headers });
    const data = await r.json();
    if (Array.isArray(data)) setUsers(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newName.trim()) return;
    await fetch('/api/users', {
      method: 'POST', headers,
      body: JSON.stringify({ display_name: newName.trim(), emoji: newEmoji, color: newColor, avatar_url: newAvatar || null }),
    });
    setNewName(''); setNewAvatar('');
    load();
  };

  const patch = async (id: number, changes: Record<string, any>) => {
    await fetch('/api/users', { method: 'PATCH', headers, body: JSON.stringify({ id, ...changes }) });
    load();
  };

  return (
    <section className="flex flex-col gap-3">
      {editing && (
        <EditModal user={editing} token={token} onDone={() => { setEditing(null); load(); }} />
      )}

      <h2 className="text-gray-200 font-semibold">Usuarios</h2>

      {/* Crear usuario */}
      <div className="bg-gray-900 rounded-xl p-3 flex flex-col gap-2">
        <p className="text-gray-400 text-sm">Crear usuario</p>
        <input
          value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre"
          className="bg-gray-800 text-gray-100 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <div className="flex gap-2 items-center flex-wrap">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setNewEmoji(e)}
              className={`text-xl p-1 rounded ${newEmoji === e ? 'bg-emerald-800' : ''}`}>{e}</button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-10 h-8 rounded" />
          <span className="text-gray-400 text-xs">Color</span>
        </div>
        {/* Avatar nuevo usuario */}
        <div className="flex items-center gap-3">
          {newAvatar ? (
            <img src={newAvatar} alt="avatar" className="w-12 h-12 rounded-full object-cover border border-gray-700" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-2xl">{newEmoji}</div>
          )}
          <AvatarUpload onUploaded={(url) => setNewAvatar(url)} />
          {newAvatar && <button onClick={() => setNewAvatar('')} className="text-xs text-red-400">✕</button>}
        </div>
        <button onClick={create} className="bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm">Crear</button>
      </div>

      {/* Lista de usuarios */}
      {users.map((u) => (
        <div key={u.id} className={`bg-gray-900 rounded-xl p-3 flex items-center gap-3 ${!u.is_active ? 'opacity-50' : ''}`}>
          {u.avatar_url ? (
            <img src={u.avatar_url} alt={u.display_name} className="w-10 h-10 rounded-full object-cover border border-gray-700" />
          ) : (
            <span className="text-2xl">{u.emoji}</span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: u.color }}>{u.display_name}</p>
            <p className="text-gray-500 text-xs truncate">{u.username}</p>
          </div>
          <button onClick={() => setEditing(u)} className="text-xs bg-gray-800 text-gray-300 rounded-lg px-2 py-1.5">✏️</button>
          <button
            onClick={() => patch(u.id, { notifications_enabled: !u.notifications_enabled })}
            className="text-lg" title="Notificaciones"
          >
            {u.notifications_enabled ? '🔔' : '🔕'}
          </button>
          <button
            onClick={() => patch(u.id, { is_active: !u.is_active })}
            className={`text-xs rounded-lg px-2 py-1.5 ${u.is_active ? 'bg-red-900 text-red-200' : 'bg-emerald-900 text-emerald-200'}`}
          >
            {u.is_active ? 'Bloquear' : 'Activar'}
          </button>
        </div>
      ))}
    </section>
  );
}
