'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socketClient';
import { Navbar } from '@/components/layout/Navbar';

interface Grupo {
  id: string;
  nombre: string;
  calificaciones: any[];
}

interface Jurado {
  id: string;
  nombre: string;
  aceptado: boolean;
}

export default function JuradoIngresoPage() {
  const [fase, setFase] = useState<'LOGIN' | 'ESPERA' | 'DASHBOARD'>('LOGIN');
  const [nombre, setNombre] = useState('');
  const [foto, setFoto] = useState('');
  
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<Grupo | null>(null);

  // Estado del formulario de calificación
  const [notas, setNotas] = useState({
    afinacion: '', armonia: '', vocal: '', coordinacion: '', tecnico: '',
    escenario: '', expresividad: '', conexion: '', presencia: '',
    vestimenta: '', cuerpo: '', barra: '',
    identidad: '', propuesta: ''
  });

  // NUEVO ESTADO: Almacena el ID persistente del jurado
  const [miJuradoId, setMiJuradoId] = useState<string | null>(null);

  useEffect(() => {
    // Generación o recuperación del ID persistente
    let idGuardado = localStorage.getItem('juradoId');
    if (!idGuardado) {
      idGuardado = 'jurado-' + Date.now().toString();
      localStorage.setItem('juradoId', idGuardado);
    }

    setMiJuradoId(idGuardado);

    const miId = idGuardado;

    const socket = getSocket();

    socket.on('estadoActualizado', (estado: any) => {
      setGrupos(estado.grupos || []);
      
      const miUsuario = (estado.jurados || []).find((j: Jurado) => j.id === miId);
      if (miUsuario) {
        if (miUsuario.aceptado) {
          setFase('DASHBOARD');
        } else {
          setFase('ESPERA');
        }
      } else {
        // NUEVO: Si el usuario ya no existe en el servidor (fue eliminado o rechazado),
        // lo forzamos a volver a la pantalla inicial de Login.
        setFase('LOGIN');
      }
    });

    return () => {
      socket.off('estadoActualizado');
    };
  }, []);

  const handleSolicitarUnion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    
    // Recuperamos el ID persistente y lo enviamos al servidor
    const miId = localStorage.getItem('juradoId');
    getSocket().emit('solicitarUnion', { id: miId, nombre, foto });
  };

  const handleNotaChange = (campo: string, valor: string, maximo: number) => {
    const num = Number(valor);
    if (valor === '' || (num >= 0 && num <= maximo)) {
      setNotas(prev => ({ ...prev, [campo]: valor }));
    }
  };

  const calcularTotal = () => {
    return Object.values(notas).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  };

  const abrirFormulario = (grupo: Grupo) => {
    setGrupoSeleccionado(grupo);
    const califPrevia = grupo.calificaciones.find(c => c.juradoId === miJuradoId);
    
    // Si ya existe una calificación con su desglose, la cargamos al estado
    if (califPrevia && califPrevia.puntajes.detalles) {
      setNotas(califPrevia.puntajes.detalles);
    } else {
      // Si es nueva o no tiene desglose, limpiamos el formulario
      setNotas({
        afinacion: '', armonia: '', vocal: '', coordinacion: '', tecnico: '',
        escenario: '', expresividad: '', conexion: '', presencia: '',
        vestimenta: '', cuerpo: '', barra: '', identidad: '', propuesta: ''
      });
    }
  };

  const enviarCalificacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grupoSeleccionado) return;

    const total = calcularTotal();
    const estructuraPuntajes = {
      interpretacion: Number(notas.afinacion) + Number(notas.armonia) + Number(notas.vocal) + Number(notas.coordinacion) + Number(notas.tecnico),
      expresion: Number(notas.escenario) + Number(notas.expresividad) + Number(notas.conexion) + Number(notas.presencia),
      presentacion: Number(notas.vestimenta) + Number(notas.cuerpo) + Number(notas.barra),
      originalidad: Number(notas.identidad) + Number(notas.propuesta),
      total: total,
      detalles: notas // <-- Guardamos el desglose exacto para recuperarlo después
    };

    const miId = localStorage.getItem('juradoId');

    getSocket().emit('enviarCalificacion', {
      juradoId: miId, 
      grupoId: grupoSeleccionado.id,
      puntajes: estructuraPuntajes
    });

    setGrupoSeleccionado(null);
    setNotas({
      afinacion: '', armonia: '', vocal: '', coordinacion: '', tecnico: '',
      escenario: '', expresividad: '', conexion: '', presencia: '',
      vestimenta: '', cuerpo: '', barra: '', identidad: '', propuesta: ''
    });
  };

  // --- RENDERIZADO CONDICIONAL ---

  if (fase === 'LOGIN') {
    return (
      <main className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <h2 className="text-2xl font-bold text-[#0e2043] text-center mb-6">Ingreso de Jurado</h2>
          <form onSubmit={handleSolicitarUnion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#453A96] text-black" placeholder="Ej. Juan Pérez" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Foto de Perfil (Opcional)</label>
              <input type="url" value={foto} onChange={(e) => setFoto(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#453A96] text-black" placeholder="https://..." />
            </div>
            <button type="submit" className="w-full bg-[#453A96] hover:bg-[#362d7a] text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md mt-4">
              Solicitar Unirse al Evento
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (fase === 'ESPERA') {
    return (
      <main className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-[#029062] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-[#0e2043]">Esperando aprobación...</h2>
        <p className="text-gray-600 mt-2 max-w-md">Tu solicitud ha sido enviada al administrador. Esta pantalla se actualizará automáticamente cuando seas aceptado.</p>
      </main>
    );
  }

  // FASE: DASHBOARD
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full relative">
        <h1 className="text-3xl font-bold text-[#0e2043] mb-8">Grupos por Calificar</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grupos.map((grupo) => {
            // Verificamos usando el estado miJuradoId en lugar de getSocket().id
            const yaCalificado = grupo.calificaciones.some(c => c.juradoId === miJuradoId);
            
            return (
              <div key={grupo.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{grupo.nombre}</h3>
                
                {yaCalificado ? (
                  <button 
                    onClick={() => abrirFormulario(grupo)} 
                    className="bg-[#e8af2e] hover:bg-[#d49f25] text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm"
                  >
                    Editar Calificación
                  </button>
                ) : (
                  <button 
                    onClick={() => abrirFormulario(grupo)} 
                    className="bg-[#029062] hover:bg-[#01704b] text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm"
                  >
                    Calificar
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* PESTAÑA DE MODAL DE CALIFICACIÓN */}
        {grupoSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
            <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl p-6 animate-fade-in-left">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-[#453A96]">Evaluando: {grupoSeleccionado.nombre}</h2>
                <button onClick={() => setGrupoSeleccionado(null)} className="text-gray-500 hover:text-red-500 font-bold text-xl">&times;</button>
              </div>

              <form onSubmit={enviarCalificacion} className="space-y-6">
                
                {/* A) INTERPRETACIÓN */}
                <section className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-[#0e2043] mb-3 flex justify-between">
                    <span>A) Interpretación y Calidad (60 pts)</span>
                  </h3>
                  <div className="space-y-3 text-sm text-black">
                    <InputPuntaje label="Afinación y precisión" val={notas.afinacion} onChange={(v) => handleNotaChange('afinacion', v, 12)} max={12} />
                    <InputPuntaje label="Armonía y estructura" val={notas.armonia} onChange={(v) => handleNotaChange('armonia', v, 12)} max={12} />
                    <InputPuntaje label="Calidad vocal e inst." val={notas.vocal} onChange={(v) => handleNotaChange('vocal', v, 12)} max={12} />
                    <InputPuntaje label="Coordinación grupal" val={notas.coordinacion} onChange={(v) => handleNotaChange('coordinacion', v, 12)} max={12} />
                    <InputPuntaje label="Dominio técnico" val={notas.tecnico} onChange={(v) => handleNotaChange('tecnico', v, 12)} max={12} />
                  </div>
                </section>

                {/* B) EXPRESIÓN */}
                <section className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-[#0e2043] mb-3">B) Expresión Artística (20 pts)</h3>
                  <div className="space-y-3 text-sm text-black">
                    <InputPuntaje label="Dominio de escenario" val={notas.escenario} onChange={(v) => handleNotaChange('escenario', v, 5)} max={5} />
                    <InputPuntaje label="Expresividad" val={notas.expresividad} onChange={(v) => handleNotaChange('expresividad', v, 5)} max={5} />
                    <InputPuntaje label="Conexión con el público" val={notas.conexion} onChange={(v) => handleNotaChange('conexion', v, 5)} max={5} />
                    <InputPuntaje label="Presencia escénica" val={notas.presencia} onChange={(v) => handleNotaChange('presencia', v, 5)} max={5} />
                  </div>
                </section>

                {/* C) PRESENTACIÓN */}
                <section className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-[#0e2043] mb-3">C) Presentación y Elementos (10 pts)</h3>
                  <div className="space-y-3 text-sm text-black">
                    <InputPuntaje label="Vestimenta y estética" val={notas.vestimenta} onChange={(v) => handleNotaChange('vestimenta', v, 4)} max={4} />
                    <InputPuntaje label="Cuerpo de baile" val={notas.cuerpo} onChange={(v) => handleNotaChange('cuerpo', v, 3)} max={3} />
                    <InputPuntaje label="Participación de barra" val={notas.barra} onChange={(v) => handleNotaChange('barra', v, 3)} max={3} />
                  </div>
                </section>

                {/* D) ORIGINALIDAD */}
                <section className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-[#0e2043] mb-3">D) Originalidad e Identidad (10 pts)</h3>
                  <div className="space-y-3 text-sm text-black">
                    <InputPuntaje label="Identidad cultural" val={notas.identidad} onChange={(v) => handleNotaChange('identidad', v, 5)} max={5} />
                    <InputPuntaje label="Propuesta artística" val={notas.propuesta} onChange={(v) => handleNotaChange('propuesta', v, 5)} max={5} />
                  </div>
                </section>

                <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-6 flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800">Total: {calcularTotal()} / 100</span>
                  <button type="submit" className="bg-[#453A96] hover:bg-[#362d7a] text-white px-8 py-3 rounded-xl font-bold transition-colors">
                    Enviar Calificación
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Subcomponente aislado para modularizar los campos de entrada
function InputPuntaje({ label, val, onChange, max }: { label: string, val: string, onChange: (v: string) => void, max: number }) {
  return (
    <div className="flex justify-between items-center">
      <label>{label}</label>
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          min="0" 
          max={max} 
          value={val} 
          onChange={(e) => onChange(e.target.value)} 
          required
          className="w-16 px-2 py-1 border rounded-md text-center focus:ring-2 focus:ring-[#453A96] focus:outline-none"
        />
        <span className="text-gray-500 text-xs w-8">/ {max}</span>
      </div>
    </div>
  );
}