'use client';
import { useState } from 'react';

export default function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await r.json();
    if (data.ok) onLogin(data.token);
    else setError('Credenciales invalidas');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 px-6">
      <div className="w-full max-w-xs flex flex-col gap-3">
        <h1 className="text-gray-200 text-lg font-semibold text-center mb-2">Acceso</h1>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuario"
          autoCapitalize="none"
          className="bg-gray-800 text-gray-100 rounded-lg px-4 py-3 outline-none"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Contrasena"
          type="password"
          className="bg-gray-800 text-gray-100 rounded-lg px-4 py-3 outline-none"
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button onClick={submit} className="bg-emerald-700 text-white rounded-lg py-3 font-medium">
          Entrar
        </button>
      </div>
    </main>
  );
}
