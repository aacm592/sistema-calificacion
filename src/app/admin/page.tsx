'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      // Si el login es exitoso, redirigimos al dashboard del administrador
      router.push('/admin/dashboard');
    } else {
      const data = await res.json();
      setError(data.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-[#0e2043] text-center mb-6">
          Acceso de Administrador
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña Maestra
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#223164] text-gray-900"
              placeholder="Ingresa la contraseña"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#223164] hover:bg-[#0e2043] text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 shadow-md cursor-pointer"
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>

          <div className="pt-2 text-center border-t border-gray-100">
            <Link 
              href="/demo" 
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span>Ver demostración sin contraseña</span>
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}