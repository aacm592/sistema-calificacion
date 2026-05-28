'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socketClient';

interface Grupo {
  id: string;
  nombre: string;
}

interface Jurado {
  id: string;
  nombre: string;
  aceptado: boolean;
}

export default function DashboardPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [jurados, setJurados] = useState<Jurado[]>([]);
  const [nuevoGrupo, setNuevoGrupo] = useState('');

  useEffect(() => {
    const socket = getSocket();

    socket.on('estadoActualizado', (estado: any) => {
      setGrupos(estado.grupos || []);
      setJurados(estado.jurados || []);
    });

    return () => {
      socket.off('estadoActualizado');
    };
  }, []);

  const handleAgregarGrupo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoGrupo.trim()) return;
    getSocket().emit('agregarGrupo', nuevoGrupo);
    setNuevoGrupo('');
  };

  const juradosPendientes = jurados.filter(j => !j.aceptado);
  const juradosAceptados = jurados.filter(j => j.aceptado);

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex">
      {/* Barra Lateral (Sidebar) simulada basada en la imagen */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#0e2043]">Admin Panel</h2>
        </div>
        <nav className="mt-4">
          <a href="#" className="flex items-center px-6 py-3 bg-[#f3f4f6] text-[#223164] font-semibold border-r-4 border-[#223164]">
            Dashboard
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">Grupos</a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">Calificaciones</a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">Ajustes</a>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-[#0e2043] mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUMNA IZQUIERDA: Módulo de Grupos */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Agregar Nuevo Grupo</h2>
            <form onSubmit={handleAgregarGrupo} className="flex gap-4 mb-8">
              <input
                type="text"
                value={nuevoGrupo}
                onChange={(e) => setNuevoGrupo(e.target.value)}
                placeholder="Nombre del Grupo Musical"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#223164] text-gray-800"
              />
              <button
                type="submit"
                className="bg-[#223164] hover:bg-[#0e2043] text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Agregar Grupo
              </button>
            </form>

            <h3 className="text-md font-semibold text-gray-700 mb-4">Grupos Registrados</h3>
            <ul className="space-y-3">
              {grupos.length === 0 ? (
                <p className="text-sm text-gray-500">No hay grupos registrados aún.</p>
              ) : (
                grupos.map((grupo) => (
                  <li key={grupo.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                    <span className="font-medium text-gray-800">{grupo.nombre}</span>
                    <button
                      onClick={() => getSocket().emit('eliminarGrupo', grupo.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Eliminar grupo"
                    >
                      {/* Icono de Basurero simple (SVG) */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* COLUMNA DERECHA: Módulo de Jurados */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
            
            {/* Subsección: Solicitudes Pendientes */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                Solicitudes de Jurados
                {juradosPendientes.length > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                    {juradosPendientes.length} Nuevas
                  </span>
                )}
              </h2>
              
              <ul className="space-y-3">
                {juradosPendientes.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay solicitudes pendientes.</p>
                ) : (
                  juradosPendientes.map((jurado) => (
                    <li key={jurado.id} className="flex justify-between items-center bg-yellow-50 px-4 py-3 rounded-lg border border-yellow-100">
                      <span className="font-medium text-gray-800">{jurado.nombre}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => getSocket().emit('aceptarJurado', jurado.id)}
                          className="bg-[#029062] hover:bg-[#01704b] text-white px-3 py-1 text-sm rounded-md font-medium transition-colors"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => getSocket().emit('rechazarJurado', jurado.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded-md font-medium transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Subsección: Jurados Aceptados */}
            <div>
              <h3 className="text-md font-semibold text-gray-700 mb-4">Jurados Activos en el Evento</h3>
              <ul className="space-y-2">
                {juradosAceptados.length === 0 ? (
                  <p className="text-sm text-gray-500">Aún no has aceptado a ningún jurado.</p>
                ) : (
                  juradosAceptados.map((jurado) => (
                    <li key={jurado.id} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                      <span className="text-gray-800">{jurado.nombre}</span>
                      <span className="text-[#029062] text-sm font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#029062]"></span> Activo
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

          </section>

        </div>
      </main>
    </div>
  );
}