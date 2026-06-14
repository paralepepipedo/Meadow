'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type PublicUser = { id: number; display_name: string; emoji: string; color: string };

export default function UserSelector() {
  const router = useRouter();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('meadow_user');
    if (saved) {
      router.replace('/game');
      return;
    }
    fetch('/api/users')
      .then((r) => r.json())
      .then((u) => setUsers(Array.isArray(u) ? u : []))
      .finally(() => setLoading(false));
  }, [router]);

  const pick = (u: PublicUser) => {
    localStorage.setItem('meadow_user', JSON.stringify(u));
    router.push('/game');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(#87CEEB 0%, #b8e0c9 55%, #6ab04c 56%, #4a7c59 100%)' }}>
      {/* Nubes decorativas */}
      <div className="cloud absolute top-10 text-5xl opacity-80" style={{ animationDuration: '45s' }}>☁️</div>
      <div className="cloud absolute top-24 text-4xl opacity-60" style={{ animationDuration: '70s', animationDelay: '-20s' }}>☁️</div>

      <h1 className="font-pixel text-3xl text-white mb-2" style={{ textShadow: '3px 3px 0 #2d5a3d' }}>Meadow</h1>
      <p className="font-pixel text-[10px] text-green-900 mb-10">¿Quien juega hoy?</p>

      {loading ? (
        <p className="font-pixel text-[10px] text-white">Cargando...</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 px-6 w-full max-w-sm">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => pick(u)}
              className="bg-white/90 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-transform"
              style={{ border: `4px solid ${u.color}` }}
            >
              <span className="text-5xl">{u.emoji}</span>
              <span className="font-pixel text-[10px] text-gray-800">{u.display_name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="absolute bottom-6 text-3xl flex gap-6">
        <span>🌻</span><span>🐄</span><span>🌾</span><span>🐑</span>
      </div>
    </main>
  );
}
