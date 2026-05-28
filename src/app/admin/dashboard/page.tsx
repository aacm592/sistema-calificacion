'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socketClient';
import { Navbar } from '@/components/layout/Navbar';

interface Calificacion {
  juradoId: string;
  nombre: string;
  puntajes: { 
    total: number;
    interpretacion?: number;
    expresion?: number;
    presentacion?: number;
    originalidad?: number;
    detalles?: any; // Contendrá el desglose exacto (afinacion, armonia, etc.)
  };
}

interface Grupo {
  id: string;
  nombre: string;
  calificaciones: Calificacion[];
  puntajePromedioFinal: number;
}

interface Jurado {
  id: string;
  nombre: string;
  aceptado: boolean;
}

export default function DashboardPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [jurados, setJurados] = useState<Jurado[]>([]);
  
  // Estados para el manejo de la UI
  const [vistaActiva, setVistaActiva] = useState<'dashboard' | 'calificaciones'>('dashboard');
  const [nuevoGrupo, setNuevoGrupo] = useState('');
  
  // Estados para la edición de grupos
  const [grupoEditandoId, setGrupoEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  
  // NUEVO ESTADO: Controla el modal de detalles
  const [grupoDetalles, setGrupoDetalles] = useState<Grupo | null>(null);

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

  // --- MANEJADORES DE GRUPOS ---
  const handleAgregarGrupo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoGrupo.trim()) return;
    getSocket().emit('agregarGrupo', nuevoGrupo);
    setNuevoGrupo('');
  };

  const handleEliminarGrupo = (id: string) => {
    // Alerta de confirmación nativa para evitar borrados accidentales
    const confirmado = window.confirm('¿Estás seguro de que deseas eliminar este grupo? Se perderán todas sus calificaciones.');
    if (confirmado) {
      getSocket().emit('eliminarGrupo', id);
    }
  };

  const handleEliminarJurado = (id: string) => {
    console.log("Intentando emitir evento eliminarJurado con ID:", id); // LOG DE CLIENTE
    const confirmado = window.confirm('¿Estás seguro de eliminar a este jurado? Se borrarán de forma irreversible todas las calificaciones que haya emitido y los promedios se recalcularán.');
    if (confirmado) {
      getSocket().emit('eliminarJurado', id);
    }
  };

  const iniciarEdicion = (grupo: Grupo) => {
    setGrupoEditandoId(grupo.id);
    setNombreEditado(grupo.nombre);
  };

  const guardarEdicion = (id: string) => {
    if (nombreEditado.trim()) {
      getSocket().emit('editarGrupo', { id, nuevoNombre: nombreEditado });
    }
    setGrupoEditandoId(null);
  };

  // --- DATOS CALCULADOS ---
  const juradosPendientes = jurados.filter(j => !j.aceptado);
  const juradosAceptados = jurados.filter(j => j.aceptado);
  
  // Ordenar grupos de mayor a menor puntaje para el Leaderboard
  const gruposOrdenados = [...grupos].sort((a, b) => b.puntajePromedioFinal - a.puntajePromedioFinal);

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      {/* Integración del Navbar superior */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* BARRA LATERAL (Sidebar) */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:block flex-shrink-0">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-[#0e2043]">Admin Panel</h2>
          </div>
          <nav className="mt-4 flex flex-col">
            <button 
              onClick={() => setVistaActiva('dashboard')}
              className={`text-left flex items-center px-6 py-4 font-semibold transition-colors ${
                vistaActiva === 'dashboard' 
                  ? 'bg-[#f3f4f6] text-[#223164] border-r-4 border-[#223164]' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Gestión de Evento
            </button>
            <button 
              onClick={() => setVistaActiva('calificaciones')}
              className={`text-left flex items-center px-6 py-4 font-semibold transition-colors ${
                vistaActiva === 'calificaciones' 
                  ? 'bg-[#f3f4f6] text-[#223164] border-r-4 border-[#223164]' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Calificaciones
            </button>
          </nav>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-8 overflow-y-auto">
          
          {/* VISTA 1: DASHBOARD (Gestión de Grupos y Jurados) */}
          {vistaActiva === 'dashboard' && (
            <>
              <h1 className="text-3xl font-bold text-[#0e2043] mb-8">Gestión de Grupos y Jurados</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* COLUMNA IZQUIERDA: Grupos */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Agregar Nuevo Grupo</h2>
                  <form onSubmit={handleAgregarGrupo} className="flex gap-4 mb-8">
                    <input type="text" value={nuevoGrupo} onChange={(e) => setNuevoGrupo(e.target.value)} placeholder="Nombre del Grupo Musical" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#223164] text-gray-800" />
                    <button type="submit" className="bg-[#223164] hover:bg-[#0e2043] text-white px-6 py-2 rounded-lg font-medium transition-colors">Agregar</button>
                  </form>

                  <h3 className="text-md font-semibold text-gray-700 mb-4">Grupos Registrados</h3>
                  <ul className="space-y-3">
                    {grupos.length === 0 ? <p className="text-sm text-gray-500">No hay grupos registrados.</p> : grupos.map((grupo) => (
                      <li key={grupo.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                        
                        {/* Lógica de Edición en Línea */}
                        {grupoEditandoId === grupo.id ? (
                          <div className="flex flex-1 gap-2 mr-4">
                            <input type="text" value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} className="flex-1 px-2 py-1 border rounded text-black focus:outline-none focus:ring-1 focus:ring-[#223164]" autoFocus />
                            <button onClick={() => guardarEdicion(grupo.id)} className="text-green-600 font-bold px-2 hover:bg-green-100 rounded">Guardar</button>
                            <button onClick={() => setGrupoEditandoId(null)} className="text-gray-500 font-bold px-2 hover:bg-gray-200 rounded">X</button>
                          </div>
                        ) : (
                          <span className="font-medium text-gray-800">{grupo.nombre}</span>
                        )}

                        {/* Botones de acción (solo visibles si no se está editando) */}
                        {grupoEditandoId !== grupo.id && (
                          <div className="flex gap-3">
                            <button onClick={() => iniciarEdicion(grupo)} className="text-blue-500 hover:text-blue-700 transition-colors font-medium text-sm">Editar</button>
                            <button onClick={() => handleEliminarGrupo(grupo.id)} className="text-red-500 hover:text-red-700 transition-colors font-medium text-sm">Eliminar</button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* COLUMNA DERECHA: Jurados (Mismo código anterior) */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex justify-between">
                      Solicitudes Pendientes
                      {juradosPendientes.length > 0 && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">{juradosPendientes.length} Nuevas</span>}
                    </h2>
                    <ul className="space-y-3">
                      {juradosPendientes.map((jurado) => (
                        <li key={jurado.id} className="flex justify-between items-center bg-yellow-50 px-4 py-3 rounded-lg border border-yellow-100">
                          <span className="font-medium text-gray-800">{jurado.nombre}</span>
                          <div className="flex gap-2">
                            <button onClick={() => getSocket().emit('aceptarJurado', jurado.id)} className="bg-[#029062] hover:bg-[#01704b] text-white px-3 py-1 text-sm rounded-md font-medium">Aceptar</button>
                            <button onClick={() => getSocket().emit('rechazarJurado', jurado.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded-md font-medium">Rechazar</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-700 mb-4">Jurados Activos</h3>
                    <ul className="space-y-2">
                      {juradosAceptados.map((jurado) => (
                        <li key={jurado.id} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                          <span className="text-gray-800">{jurado.nombre}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-[#029062] text-sm font-bold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#029062]"></span> Activo
                            </span>
                            <button 
                              onClick={() => handleEliminarJurado(jurado.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors cursor-pointer"
                              title="Eliminar jurado del sistema"
                            >
                              Eliminar
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>
            </>
          )}

          {/* VISTA 2: TABLA DE PUNTUACIONES */}
          {vistaActiva === 'calificaciones' && (
            <>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#0e2043]">Tabla de Puntuaciones</h1>
                
                {/* Botones de Exportación UI (La lógica de exportación se agregará con librerías posteriormente si se requiere) */}
                <div className="flex gap-4">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2">
                    Exportar Excel
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2">
                    Exportar PDF
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#223164] text-white text-sm">
                        <th className="p-4 font-semibold whitespace-nowrap text-center">POSICIÓN</th>
                        <th className="p-4 font-semibold whitespace-nowrap">GRUPO</th>
                        
                        {/* Generación dinámica de columnas por cada jurado aceptado */}
                        {juradosAceptados.map((j, idx) => (
                          <th key={j.id} className="p-4 font-semibold whitespace-nowrap text-center">
                            JURADO {idx + 1}
                            <span className="block text-xs font-normal opacity-75">{j.nombre}</span>
                          </th>
                        ))}
                        
                        <th className="p-4 font-bold whitespace-nowrap text-center text-[#e8af2e]">PROMEDIO</th>
                        <th className="p-4 font-bold whitespace-nowrap text-center text-white">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-800 text-sm">
                      {gruposOrdenados.length === 0 ? (
                        <tr>
                          <td colSpan={juradosAceptados.length + 3} className="p-8 text-center text-gray-500">
                            Aún no hay grupos registrados.
                          </td>
                        </tr>
                      ) : (
                        gruposOrdenados.map((g, index) => (
                          <tr key={g.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-extrabold text-center text-[#0e2043] text-lg">#{index + 1}</td>
                            <td className="p-4 font-bold">{g.nombre}</td>
                            
                            {/* Búsqueda dinámica de la nota del jurado para este grupo */}
                            {juradosAceptados.map(j => {
                              const calif = g.calificaciones.find(c => c.juradoId === j.id);
                              return (
                                <td key={j.id} className="p-4 text-center font-medium text-gray-600">
                                  {calif ? calif.puntajes.total : '-'}
                                </td>
                              );
                            })}
                            
                            {/* Promedio Final */}
                            <td className="p-4 text-center font-extrabold text-lg text-[#029062] bg-green-50">
                              {g.puntajePromedioFinal ? g.puntajePromedioFinal.toFixed(2) : '0.00'}
                            </td>
                            
                            {/* NUEVO: Botón de Detalles */}
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => setGrupoDetalles(g)}
                                className="bg-[#453A96] hover:bg-[#362d7a] text-white text-xs font-bold py-2 px-3 rounded shadow transition-colors"
                              >
                                Ver detalles
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        {/* MODAL DE DETALLES DE CALIFICACIÓN */}
          {grupoDetalles && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-fade-in">
                
                {/* Cabecera del Modal */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
                  <h2 className="text-2xl font-bold text-[#0e2043]">
                    Desglose: <span className="text-[#029062]">{grupoDetalles.nombre}</span>
                  </h2>
                  <button onClick={() => setGrupoDetalles(null)} className="text-gray-400 hover:text-red-500 font-bold text-3xl leading-none">&times;</button>
                </div>

                {/* Contenido del Modal */}
                <div className="p-6">
                  {grupoDetalles.calificaciones.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Ningún jurado ha calificado a este grupo todavía.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {grupoDetalles.calificaciones.map((calif) => (
                        <div key={calif.juradoId} className="border border-gray-200 rounded-xl p-5 bg-gray-50 shadow-sm">
                          <h3 className="text-lg font-bold text-[#223164] border-b border-gray-200 pb-3 mb-4 flex justify-between">
                            <span>{calif.nombre}</span>
                            <span className="text-[#e8af2e]">{calif.puntajes.total} / 100</span>
                          </h3>

                          {calif.puntajes.detalles ? (
                            <div className="space-y-4 text-sm text-gray-700">
                              <div>
                                <h4 className="font-bold text-[#029062]">A) Interpretación ({calif.puntajes.interpretacion}/60)</h4>
                                <ul className="ml-4 mt-1 space-y-1 list-disc">
                                  <li>Afinación y precisión: {calif.puntajes.detalles.afinacion}</li>
                                  <li>Armonía: {calif.puntajes.detalles.armonia}</li>
                                  <li>Calidad vocal e inst: {calif.puntajes.detalles.vocal}</li>
                                  <li>Coordinación grupal: {calif.puntajes.detalles.coordinacion}</li>
                                  <li>Dominio técnico: {calif.puntajes.detalles.tecnico}</li>
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-bold text-[#029062]">B) Expresión Escénica ({calif.puntajes.expresion}/20)</h4>
                                <ul className="ml-4 mt-1 space-y-1 list-disc">
                                  <li>Dominio escenario: {calif.puntajes.detalles.escenario}</li>
                                  <li>Expresividad: {calif.puntajes.detalles.expresividad}</li>
                                  <li>Conexión con público: {calif.puntajes.detalles.conexion}</li>
                                  <li>Presencia escénica: {calif.puntajes.detalles.presencia}</li>
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-bold text-[#029062]">C) Presentación ({calif.puntajes.presentacion}/10)</h4>
                                <ul className="ml-4 mt-1 space-y-1 list-disc">
                                  <li>Vestimenta y estética: {calif.puntajes.detalles.vestimenta}</li>
                                  <li>Cuerpo de baile: {calif.puntajes.detalles.cuerpo}</li>
                                  <li>Barra organizada: {calif.puntajes.detalles.barra}</li>
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-bold text-[#029062]">D) Originalidad ({calif.puntajes.originalidad}/10)</h4>
                                <ul className="ml-4 mt-1 space-y-1 list-disc">
                                  <li>Identidad cultural: {calif.puntajes.detalles.identidad}</li>
                                  <li>Propuesta artística: {calif.puntajes.detalles.propuesta}</li>
                                </ul>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 italic text-sm">Los detalles individuales de esta calificación no están disponibles (registro antiguo).</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}