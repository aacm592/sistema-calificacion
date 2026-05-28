'use client';

import { useEffect, useState, Suspense } from 'react';
import { getSocket } from '@/lib/socketClient';
import { useSearchParams } from 'next/navigation';

function CeremoniaContenido() {
  const searchParams = useSearchParams();
  const topN = Number(searchParams.get('top')) || 3;

  const [grupos, setGrupos] = useState<any[]>([]);
  const [fase, setFase] = useState<'CARGANDO' | 'ESPERA' | 'REVELADO' | 'PODIO'>('CARGANDO');
  const [posicionActual, setPosicionActual] = useState(topN);

  useEffect(() => {
    const socket = getSocket();
    
    // Solicitamos el estado actual al conectarnos a esta vista
    socket.emit('solicitarEstado');
    
    socket.on('estadoActualizado', (estado: any) => {
      // Filtramos grupos que al menos tengan 1 calificación y ordenamos
      const validados = (estado.grupos || []).filter((g:any) => g.calificaciones.length > 0);
      const ordenados = validados.sort((a:any, b:any) => b.puntajePromedioFinal - a.puntajePromedioFinal);
      setGrupos(ordenados.slice(0, topN));
      if (fase === 'CARGANDO') setFase('ESPERA');
    });

    return () => { socket.off('estadoActualizado'); };
  }, [topN, fase]);

  if (fase === 'CARGANDO' || grupos.length === 0) {
    return <div className="min-h-screen bg-slate-900 flex justify-center items-center text-white text-3xl">Cargando resultados oficiales...</div>;
  }

  const ganadorActual = grupos[posicionActual - 1];

  // Controladores de transición
  const revelarLugar = () => setFase('REVELADO');
  const siguienteLugar = () => {
    if (posicionActual > 1) {
      setPosicionActual(prev => prev - 1);
      setFase('ESPERA');
    } else {
      setFase('PODIO');
    }
  };

  // --- RENDERIZADO DEL PODIO FINAL ---
  if (fase === 'PODIO') {
    return (
      <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 overflow-hidden text-white relative">
        <div className="absolute inset-0 bg-[url('/images/hero-illustration.svg')] opacity-10 bg-cover bg-center"></div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-20 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 animate-fade-in-up z-10">
          ¡PODIO OFICIAL!
        </h1>
        
        <div className="flex items-end justify-center gap-4 md:gap-12 h-96 z-10 w-full max-w-5xl">
          {/* Segundo Lugar (Plata) */}
          {grupos[1] && (
            <div className="flex flex-col items-center w-1/3 animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-300 text-center mb-4">{grupos[1].nombre}</h2>
              <div className="w-full bg-gradient-to-t from-gray-500 to-gray-300 h-64 rounded-t-lg shadow-2xl flex justify-center items-start pt-4 border-t-4 border-gray-200">
                <span className="text-5xl font-black text-gray-700">2</span>
              </div>
            </div>
          )}
          
          {/* Primer Lugar (Oro) */}
          {grupos[0] && (
            <div className="flex flex-col items-center w-1/3 animate-zoom-in" style={{ animationDelay: '1.5s' }}>
              <div className="text-yellow-400 text-6xl mb-2 animate-bounce">👑</div>
              <h2 className="text-3xl md:text-5xl font-black text-gold-shine text-center mb-4 leading-tight">{grupos[0].nombre}</h2>
              <div className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 h-80 rounded-t-lg shadow-2xl flex justify-center items-start pt-6 border-t-4 border-yellow-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                <span className="text-7xl font-black text-yellow-900 z-10">1</span>
              </div>
            </div>
          )}

          {/* Tercer Lugar (Bronce) */}
          {grupos[2] && (
            <div className="flex flex-col items-center w-1/3 animate-slide-up" style={{ animationDelay: '1s' }}>
              <h2 className="text-xl md:text-2xl font-bold text-amber-600 text-center mb-4">{grupos[2].nombre}</h2>
              <div className="w-full bg-gradient-to-t from-amber-800 to-amber-600 h-48 rounded-t-lg shadow-2xl flex justify-center items-start pt-4 border-t-4 border-amber-400">
                <span className="text-5xl font-black text-amber-950">3</span>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // --- RENDERIZADO DE ESPERA Y REVELACIÓN ---
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white relative">
      <div className="absolute top-10 text-center w-full">
        <h2 className="text-2xl text-gray-400 uppercase tracking-widest">Premiación Oficial</h2>
      </div>

      {fase === 'ESPERA' ? (
        <div className="text-center animate-pulse">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-200 mb-12">
            El {posicionActual}° lugar es para...
          </h1>
          <div className="text-8xl">🥁</div>
        </div>
      ) : (
        <div className={`text-center flex flex-col items-center ${
            posicionActual === 1 ? 'animate-zoom-in' : 
            posicionActual <= 3 ? 'animate-bounce-in' : 'animate-fade-in-up'
          }`}>
          <span className="text-3xl text-gray-400 mb-6 font-semibold uppercase tracking-widest">
            {posicionActual === 1 ? '¡Y el gran ganador es!' : `${posicionActual}° lugar`}
          </span>
          
          <h1 className={`text-6xl md:text-9xl font-black mb-8 px-4 ${
            posicionActual === 1 ? 'text-gold-shine' :
            posicionActual === 2 ? 'text-gray-300 drop-shadow-lg' :
            posicionActual === 3 ? 'text-amber-600 drop-shadow-lg' :
            'text-[#029062]'
          }`}>
            {ganadorActual?.nombre}
          </h1>
          
          <div className="bg-slate-800 border border-slate-700 px-8 py-4 rounded-2xl shadow-xl">
            <p className="text-2xl text-gray-300">Puntaje Final: <span className="text-[#e8af2e] font-bold text-4xl ml-2">{ganadorActual?.puntajePromedioFinal.toFixed(2)}</span></p>
          </div>
        </div>
      )}

      {/* Controles de Administrador (Ocultos a simple vista, visibles al pasar el ratón por abajo) */}
      <div className="fixed bottom-0 w-full p-6 flex justify-center opacity-10 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black to-transparent">
        {fase === 'ESPERA' ? (
          <button onClick={revelarLugar} className="bg-[#453A96] hover:bg-[#362d7a] text-white font-bold py-3 px-8 rounded-full shadow-2xl text-xl">
            Revelar Ganador
          </button>
        ) : (
          <button onClick={siguienteLugar} className="bg-[#029062] hover:bg-[#01704b] text-white font-bold py-3 px-8 rounded-full shadow-2xl text-xl">
            {posicionActual > 1 ? 'Siguiente Lugar' : 'Mostrar Podio Final'}
          </button>
        )}
      </div>
    </main>
  );
}

export default function CeremoniaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex justify-center items-center">Cargando...</div>}>
      <CeremoniaContenido />
    </Suspense>
  );
}