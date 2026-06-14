'use client';
import { useEffect, useState } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';
import UserManager from '@/components/admin/UserManager';
import MessageManager from '@/components/admin/MessageManager';
import TriggerConfig from '@/components/admin/TriggerConfig';
import ConfigPanel from '@/components/admin/ConfigPanel';

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<'users' | 'messages' | 'trigger' | 'config' | 'storage'>('users');

  useEffect(() => {
    setToken(sessionStorage.getItem('meadow_admin'));
  }, []);

  if (!token) {
    return (
      <AdminLogin
        onLogin={(t) => {
          sessionStorage.setItem('meadow_admin', t);
          setToken(t);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 pb-10">
      <div className="max-w-md mx-auto px-4 pt-4">
        <div className="flex items-center mb-4">
          <h1 className="text-gray-100 text-lg font-semibold">Panel</h1>
          <button
            onClick={() => { sessionStorage.removeItem('meadow_admin'); setToken(null); }}
            className="ml-auto text-gray-500 text-sm"
          >
            Salir
          </button>
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto">
          {([
            ['users', 'Usuarios'],
            ['messages', 'Mensajes'],
            ['trigger', 'Gatillo'],
            ['config', 'Config'],
            ['storage', 'Storage'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap ${
                tab === key ? 'bg-emerald-700 text-white' : 'bg-gray-900 text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'users' && <UserManager token={token} />}
        {tab === 'messages' && <MessageManager token={token} />}
        {tab === 'trigger' && <TriggerConfig token={token} />}
        {tab === 'config' && <ConfigPanel token={token} />}
        {tab === 'storage' && (
          <section className="flex flex-col gap-3">
            <h2 className="text-gray-200 font-semibold">Storage — Cloudinary</h2>
            <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-gray-400 text-sm">Las imágenes, audios y videos del chat se almacenan en Cloudinary. Desde el dashboard puedes ver el uso de espacio y eliminar archivos manualmente.</p>
              <a
                href="https://console.cloudinary.com/app/c-43d484ae36fca773eba0bb6753b4de/home/dashboard"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-emerald-900/50 border border-emerald-700/50 text-emerald-300 rounded-xl px-4 py-3 active:opacity-70"
              >
                <span className="text-2xl">☁️</span>
                <div>
                  <p className="text-sm font-medium">Abrir Cloudinary Dashboard</p>
                  <p className="text-xs text-emerald-500">Ver uso y limpiar archivos</p>
                </div>
                <span className="ml-auto text-lg">↗</span>
              </a>
              <a
                href="https://console.cloudinary.com/app/c-43d484ae36fca773eba0bb6753b4de/media-explorer"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl px-4 py-3 active:opacity-70"
              >
                <span className="text-2xl">🗂️</span>
                <div>
                  <p className="text-sm font-medium">Media Explorer</p>
                  <p className="text-xs text-gray-500">Ver y eliminar archivos individuales</p>
                </div>
                <span className="ml-auto text-lg">↗</span>
              </a>
              <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-500">
                <p className="font-medium text-gray-400 mb-1">Plan gratuito incluye:</p>
                <p>• 25 GB de almacenamiento</p>
                <p>• 25 GB de ancho de banda mensual</p>
                <p>• Carpeta del proyecto: <code className="text-emerald-400">meadow/</code></p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
