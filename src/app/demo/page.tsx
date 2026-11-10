'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- TIPOS DE DATOS ---
interface CalificacionDetalles {
  afinacion: string;
  armonia: string;
  vocal: string;
  coordinacion: string;
  tecnico: string;
  escenario: string;
  expresividad: string;
  conexion: string;
  presencia: string;
  vestimenta: string;
  cuerpo: string;
  barra: string;
  identidad: string;
  propuesta: string;
}

interface Calificacion {
  juradoId: string;
  nombre: string;
  puntajes: {
    interpretacion: number;
    expresion: number;
    presentacion: number;
    originalidad: number;
    total: number;
    detalles: CalificacionDetalles;
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

// --- DATOS INICIALES DE DEMOSTRACIÓN (EN MEMORIA) ---
const JURADOS_DEMO_INICIALES: Jurado[] = [
  { id: 'jurado-1', nombre: 'Mtro. Carlos Mendoza', aceptado: true },
  { id: 'jurado-2', nombre: 'Dra. Elena Ramos', aceptado: true },
  { id: 'jurado-3', nombre: 'Lic. Roberto Gómez', aceptado: false }, // Solicitud pendiente para probar admin
];

const GRUPOS_DEMO_INICIALES: Grupo[] = [
  {
    id: 'demo-g1',
    nombre: 'Sinfonía Juvenil del Valle',
    calificaciones: [
      {
        juradoId: 'jurado-1',
        nombre: 'Mtro. Carlos Mendoza',
        puntajes: {
          interpretacion: 56,
          expresion: 19,
          presentacion: 10,
          originalidad: 9,
          total: 94,
          detalles: {
            afinacion: '11', armonia: '12', vocal: '11', coordinacion: '11', tecnico: '11',
            escenario: '5', expresividad: '5', conexion: '4', presencia: '5',
            vestimenta: '4', cuerpo: '3', barra: '3',
            identidad: '5', propuesta: '4'
          }
        }
      },
      {
        juradoId: 'jurado-2',
        nombre: 'Dra. Elena Ramos',
        puntajes: {
          interpretacion: 54,
          expresion: 18,
          presentacion: 9,
          originalidad: 10,
          total: 91,
          detalles: {
            afinacion: '11', armonia: '11', vocal: '11', coordinacion: '10', tecnico: '11',
            escenario: '5', expresividad: '4', conexion: '5', presencia: '4',
            vestimenta: '4', cuerpo: '3', barra: '2',
            identidad: '5', propuesta: '5'
          }
        }
      }
    ],
    puntajePromedioFinal: 92.5
  },
  {
    id: 'demo-g2',
    nombre: 'Los Solistas del Sol',
    calificaciones: [
      {
        juradoId: 'jurado-1',
        nombre: 'Mtro. Carlos Mendoza',
        puntajes: {
          interpretacion: 51,
          expresion: 17,
          presentacion: 9,
          originalidad: 8,
          total: 85,
          detalles: {
            afinacion: '10', armonia: '10', vocal: '10', coordinacion: '11', tecnico: '10',
            escenario: '4', expresividad: '4', conexion: '4', presencia: '5',
            vestimenta: '3', cuerpo: '3', barra: '3',
            identidad: '4', propuesta: '4'
          }
        }
      },
      {
        juradoId: 'jurado-2',
        nombre: 'Dra. Elena Ramos',
        puntajes: {
          interpretacion: 53,
          expresion: 18,
          presentacion: 9,
          originalidad: 9,
          total: 89,
          detalles: {
            afinacion: '11', armonia: '10', vocal: '11', coordinacion: '10', tecnico: '11',
            escenario: '5', expresividad: '4', conexion: '5', presencia: '4',
            vestimenta: '4', cuerpo: '2', barra: '3',
            identidad: '5', propuesta: '4'
          }
        }
      }
    ],
    puntajePromedioFinal: 87.0
  },
  {
    id: 'demo-g3',
    nombre: 'Ensamble Armonía Viva',
    calificaciones: [
      {
        juradoId: 'jurado-1',
        nombre: 'Mtro. Carlos Mendoza',
        puntajes: {
          interpretacion: 48,
          expresion: 16,
          presentacion: 8,
          originalidad: 8,
          total: 80,
          detalles: {
            afinacion: '10', armonia: '9', vocal: '10', coordinacion: '10', tecnico: '9',
            escenario: '4', expresividad: '4', conexion: '4', presencia: '4',
            vestimenta: '3', cuerpo: '3', barra: '2',
            identidad: '4', propuesta: '4'
          }
        }
      }
    ],
    puntajePromedioFinal: 80.0
  },
  {
    id: 'demo-g4',
    nombre: 'Ritmo & Fusión Experimental',
    calificaciones: [],
    puntajePromedioFinal: 0
  }
];

export default function DemoPage() {
  // --- ESTADO PRINCIPAL DE DEMOSTRACIÓN (EN MEMORIA) ---
  const [grupos, setGrupos] = useState<Grupo[]>(() => JSON.parse(JSON.stringify(GRUPOS_DEMO_INICIALES)));
  const [jurados, setJurados] = useState<Jurado[]>(() => JSON.parse(JSON.stringify(JURADOS_DEMO_INICIALES)));

  // Vista principal del modo demo: Jurado vs Admin vs Ceremonia
  const [vistaModo, setVistaModo] = useState<'jurado' | 'admin' | 'premiacion'>('jurado');
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);

  // --- ESTADOS DE LA VISTA JURADO ---
  const [juradoActivoId, setJuradoActivoId] = useState<string>('jurado-1');
  const [grupoEvaluando, setGrupoEvaluando] = useState<Grupo | null>(null);
  const [notas, setNotas] = useState<CalificacionDetalles>({
    afinacion: '', armonia: '', vocal: '', coordinacion: '', tecnico: '',
    escenario: '', expresividad: '', conexion: '', presencia: '',
    vestimenta: '', cuerpo: '', barra: '',
    identidad: '', propuesta: ''
  });

  // --- ESTADOS DE LA VISTA ADMIN ---
  const [vistaAdmin, setVistaAdmin] = useState<'dashboard' | 'calificaciones' | 'premiacion'>('dashboard');
  const [nuevoGrupo, setNuevoGrupo] = useState('');
  const [grupoEditandoId, setGrupoEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [grupoDetalles, setGrupoDetalles] = useState<Grupo | null>(null);
  const [topN, setTopN] = useState(3);

  // --- ESTADOS DE LA VISTA CEREMONIA / PREMIACIÓN ---
  const [fasePremiacion, setFasePremiacion] = useState<'ESPERA' | 'REVELADO' | 'PODIO'>('ESPERA');
  const [posicionActual, setPosicionActual] = useState(3);

  // Helper para mostrar toast temporal
  const mostrarToast = (msg: string) => {
    setMensajeToast(msg);
    setTimeout(() => setMensajeToast(null), 3500);
  };

  // Reiniciar todo a los datos iniciales
  const reiniciarDatosDemo = () => {
    setGrupos(JSON.parse(JSON.stringify(GRUPOS_DEMO_INICIALES)));
    setJurados(JSON.parse(JSON.stringify(JURADOS_DEMO_INICIALES)));
    setGrupoEvaluando(null);
    setGrupoDetalles(null);
    setFasePremiacion('ESPERA');
    setPosicionActual(3);
    mostrarToast('Datos restablecidos.');
  };

  // Helper para recalcular promedios
  const recalcularGrupos = (nuevosGrupos: Grupo[]): Grupo[] => {
    return nuevosGrupos.map(g => {
      const suma = g.calificaciones.reduce((acc, c) => acc + (c.puntajes?.total || 0), 0);
      return {
        ...g,
        puntajePromedioFinal: g.calificaciones.length > 0 ? Number((suma / g.calificaciones.length).toFixed(2)) : 0
      };
    });
  };

  // Jurados filtrados
  const juradosPendientes = jurados.filter(j => !j.aceptado);
  const juradosAceptados = jurados.filter(j => j.aceptado);
  const gruposOrdenados = [...grupos].sort((a, b) => b.puntajePromedioFinal - a.puntajePromedioFinal);
  const juradoActualInfo = jurados.find(j => j.id === juradoActivoId) || juradosAceptados[0];

  // --- LÓGICA DE JURADO ---
  const handleNotaChange = (campo: keyof CalificacionDetalles, valor: string, maximo: number) => {
    const num = Number(valor);
    if (valor === '' || (num >= 0 && num <= maximo)) {
      setNotas(prev => ({ ...prev, [campo]: valor }));
    }
  };

  const calcularTotal = () => {
    return Object.values(notas).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  };

  const abrirFormularioCalificar = (grupo: Grupo) => {
    setGrupoEvaluando(grupo);
    const califPrevia = grupo.calificaciones.find(c => c.juradoId === juradoActivoId);
    if (califPrevia && califPrevia.puntajes.detalles) {
      setNotas({ ...califPrevia.puntajes.detalles });
    } else {
      setNotas({
        afinacion: '', armonia: '', vocal: '', coordinacion: '', tecnico: '',
        escenario: '', expresividad: '', conexion: '', presencia: '',
        vestimenta: '', cuerpo: '', barra: '', identidad: '', propuesta: ''
      });
    }
  };

  const guardarCalificacionDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grupoEvaluando || !juradoActualInfo) return;

    const total = calcularTotal();
    const estructuraPuntajes = {
      interpretacion: Number(notas.afinacion) + Number(notas.armonia) + Number(notas.vocal) + Number(notas.coordinacion) + Number(notas.tecnico),
      expresion: Number(notas.escenario) + Number(notas.expresividad) + Number(notas.conexion) + Number(notas.presencia),
      presentacion: Number(notas.vestimenta) + Number(notas.cuerpo) + Number(notas.barra),
      originalidad: Number(notas.identidad) + Number(notas.propuesta),
      total: total,
      detalles: { ...notas }
    };

    const nuevosGrupos = grupos.map(g => {
      if (g.id !== grupoEvaluando.id) return g;
      const otrasCalif = g.calificaciones.filter(c => c.juradoId !== juradoActivoId);
      const nuevaCalif: Calificacion = {
        juradoId: juradoActivoId,
        nombre: juradoActualInfo.nombre,
        puntajes: estructuraPuntajes
      };
      return {
        ...g,
        calificaciones: [...otrasCalif, nuevaCalif]
      };
    });

    const recalculados = recalcularGrupos(nuevosGrupos);
    setGrupos(recalculados);
    setGrupoEvaluando(null);
    mostrarToast(`Calificación guardada: ${grupoEvaluando.nombre} (${total} pts).`);
  };

  // --- LÓGICA DE ADMIN (GRUPOS Y JURADOS) ---
  const handleAgregarGrupoDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoGrupo.trim()) return;
    const nuevo: Grupo = {
      id: 'demo-g-' + Date.now(),
      nombre: nuevoGrupo.trim(),
      calificaciones: [],
      puntajePromedioFinal: 0
    };
    setGrupos(prev => [...prev, nuevo]);
    setNuevoGrupo('');
    mostrarToast(`Grupo agregado: ${nuevo.nombre}.`);
  };

  const handleEliminarGrupoDemo = (id: string) => {
    setGrupos(prev => prev.filter(g => g.id !== id));
    mostrarToast('Grupo eliminado.');
  };

  const guardarEdicionGrupoDemo = (id: string) => {
    if (nombreEditado.trim()) {
      setGrupos(prev => prev.map(g => g.id === id ? { ...g, nombre: nombreEditado.trim() } : g));
      mostrarToast('Nombre actualizado.');
    }
    setGrupoEditandoId(null);
  };

  const handleAceptarJuradoDemo = (id: string) => {
    setJurados(prev => prev.map(j => j.id === id ? { ...j, aceptado: true } : j));
    mostrarToast('Jurado aprobado.');
  };

  const handleRechazarJuradoDemo = (id: string) => {
    setJurados(prev => prev.filter(j => j.id !== id));
    mostrarToast('Solicitud rechazada.');
  };

  const handleEliminarJuradoDemo = (id: string) => {
    const jurado = jurados.find(j => j.id === id);
    setJurados(prev => prev.filter(j => j.id !== id));
    // Purgar calificaciones emitidas por ese jurado
    setGrupos(prev => {
      const limpiados = prev.map(g => ({
        ...g,
        calificaciones: g.calificaciones.filter(c => c.juradoId !== id)
      }));
      return recalcularGrupos(limpiados);
    });
    mostrarToast(`Jurado eliminado: ${jurado?.nombre || id}.`);
  };

  // --- EXPORTACIÓN EXCEL / PDF (CLIENT-SIDE CON DATOS DE DEMO) ---
  const exportarExcelDemo = () => {
    const data: any[] = [];
    gruposOrdenados.forEach((g, index) => {
      if (g.calificaciones.length === 0) {
        data.push({ Posición: index + 1, Grupo: g.nombre, PromedioFinal: g.puntajePromedioFinal, Jurado: 'Sin calificaciones' });
      } else {
        g.calificaciones.forEach(c => {
          const det = c.puntajes.detalles || ({} as any);
          data.push({
            Posición: index + 1,
            Grupo: g.nombre,
            PromedioFinal: Number(g.puntajePromedioFinal.toFixed(2)),
            Jurado: c.nombre,
            PuntajeTotalJurado: c.puntajes.total,
            'A_Afinación(12)': Number(det.afinacion || 0),
            'A_Armonía(12)': Number(det.armonia || 0),
            'A_Vocal(12)': Number(det.vocal || 0),
            'A_Coordinación(12)': Number(det.coordinacion || 0),
            'A_Técnico(12)': Number(det.tecnico || 0),
            'B_Escenario(5)': Number(det.escenario || 0),
            'B_Expresividad(5)': Number(det.expresividad || 0),
            'B_Conexión(5)': Number(det.conexion || 0),
            'B_Presencia(5)': Number(det.presencia || 0),
            'C_Vestimenta(4)': Number(det.vestimenta || 0),
            'C_CuerpoBaile(3)': Number(det.cuerpo || 0),
            'C_Barra(3)': Number(det.barra || 0),
            'D_Identidad(5)': Number(det.identidad || 0),
            'D_Propuesta(5)': Number(det.propuesta || 0),
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Detalle Evaluaciones Demo");
    XLSX.writeFile(workbook, "Resultados_Demostracion_Evento.xlsx");
    mostrarToast('Excel descargado.');
  };

  const exportarPDFDemo = () => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(14, 32, 67);
    doc.text("Reporte de Demostración - Sistema Musical", 14, yPos);
    yPos += 15;

    gruposOrdenados.forEach((g, index) => {
      if (yPos > 260) { doc.addPage(); yPos = 20; }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(14, 32, 67);
      doc.text(`Desglose: `, 14, yPos);

      const textWidth = doc.getTextWidth(`Desglose: `);
      doc.setTextColor(2, 144, 98);
      doc.text(`${g.nombre} (Posición #${index + 1} - Promedio: ${g.puntajePromedioFinal.toFixed(2)})`, 14 + textWidth, yPos);
      yPos += 8;

      if (g.calificaciones.length === 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150);
        doc.text("Sin calificaciones.", 14, yPos);
        yPos += 12;
      } else {
        g.calificaciones.forEach(c => {
          const det = c.puntajes.detalles || ({} as any);
          const leftColumnText = `A) Interpretación (${c.puntajes.interpretacion || 0}/60)
  • Afinación y precisión: ${det.afinacion || 0}
  • Armonía y estructura: ${det.armonia || 0}
  • Calidad vocal e inst.: ${det.vocal || 0}
  • Coordinación grupal: ${det.coordinacion || 0}
  • Dominio técnico: ${det.tecnico || 0}

B) Expresión Escénica (${c.puntajes.expresion || 0}/20)
  • Dominio de escenario: ${det.escenario || 0}
  • Expresividad: ${det.expresividad || 0}
  • Conexión con el público: ${det.conexion || 0}
  • Presencia escénica: ${det.presencia || 0}`;

          const rightColumnText = `C) Presentación (${c.puntajes.presentacion || 0}/10)
  • Vestimenta y estética: ${det.vestimenta || 0}
  • Cuerpo de baile: ${det.cuerpo || 0}
  • Participación de barra: ${det.barra || 0}

D) Originalidad e Identidad (${c.puntajes.originalidad || 0}/10)
  • Identidad cultural: ${det.identidad || 0}
  • Propuesta artística: ${det.propuesta || 0}`;

          autoTable(doc, {
            startY: yPos,
            head: [[
              c.nombre,
              { content: `${c.puntajes.total} / 100`, styles: { halign: 'right', textColor: [232, 175, 46] } }
            ]],
            body: [[
              { content: leftColumnText },
              { content: rightColumnText }
            ]],
            theme: 'grid',
            headStyles: {
              fillColor: [249, 250, 251],
              textColor: [34, 49, 100],
              lineColor: [229, 231, 235],
              lineWidth: 0.1,
              fontSize: 12,
            },
            bodyStyles: {
              fillColor: [255, 255, 255],
              textColor: [55, 65, 81],
              lineColor: [229, 231, 235],
              lineWidth: 0.1,
              fontSize: 10
            },
            columnStyles: {
              0: { cellWidth: 90 },
              1: { cellWidth: 90 }
            },
            margin: { left: 14, right: 14 },
            pageBreak: 'avoid',
          });

          yPos = (doc as any).lastAutoTable.finalY + 6;
        });
      }

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(14, yPos, 196, yPos);
      yPos += 10;
    });

    doc.save("Reporte_Desglose_Demostracion.pdf");
    mostrarToast('PDF descargado.');
  };

  // --- LÓGICA DE CEREMONIA ---
  const gruposConCalificacion = gruposOrdenados.filter(g => g.calificaciones.length > 0);
  const gruposPodio = gruposConCalificacion.slice(0, Math.min(topN, gruposConCalificacion.length));

  useEffect(() => {
    if (gruposPodio.length > 0 && posicionActual > gruposPodio.length) {
      setPosicionActual(gruposPodio.length);
    }
  }, [gruposPodio.length, posicionActual]);

  const avanzarCeremonia = () => {
    if (fasePremiacion === 'ESPERA') {
      setFasePremiacion('REVELADO');
    } else if (fasePremiacion === 'REVELADO') {
      if (posicionActual > 1) {
        setPosicionActual(prev => prev - 1);
        setFasePremiacion('ESPERA');
      } else {
        setFasePremiacion('PODIO');
      }
    }
  };

  const retrocederCeremonia = () => {
    if (fasePremiacion === 'PODIO') {
      setFasePremiacion('REVELADO');
      setPosicionActual(1);
    } else if (fasePremiacion === 'REVELADO') {
      setFasePremiacion('ESPERA');
    } else if (fasePremiacion === 'ESPERA') {
      if (posicionActual < gruposPodio.length) {
        setPosicionActual(prev => prev + 1);
        setFasePremiacion('REVELADO');
      }
    }
  };

  const ganadorActual = gruposPodio[posicionActual - 1];

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">

      {/* 1. BARRA SUPERIOR PERSISTENTE DE MODO DEMOSTRACIÓN */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold text-zinc-900">Calificador</Link>
            <span className="text-xs text-zinc-500">Demostración</span>
          </div>
          <nav aria-label="Vistas de demostración" className="flex gap-1 text-sm">
            <button
              onClick={() => setVistaModo('jurado')}
              aria-pressed={vistaModo === 'jurado'}
              className={`px-3 py-2 rounded-md transition-colors ${vistaModo === 'jurado' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              Jurado
            </button>
            <button
              onClick={() => setVistaModo('admin')}
              aria-pressed={vistaModo === 'admin'}
              className={`px-3 py-2 rounded-md transition-colors ${vistaModo === 'admin' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              Administración
            </button>
            <button
              onClick={() => {
                setVistaModo('premiacion');
                setFasePremiacion('ESPERA');
                setPosicionActual(Math.min(topN, gruposPodio.length || 3));
              }}
              aria-pressed={vistaModo === 'premiacion'}
              className={`px-3 py-2 rounded-md transition-colors ${vistaModo === 'premiacion' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              Premiación
            </button>
          </nav>
          <button onClick={reiniciarDatosDemo} className="text-xs text-zinc-600 hover:text-zinc-900">
            Reiniciar datos
          </button>
        </div>
        <p className="max-w-7xl mx-auto px-4 pb-3 text-xs text-zinc-500">
          Datos de prueba. Los cambios duran esta sesión.
        </p>
      </header>

      {/* TOAST FLOTANTE DE Acciones */}
      {mensajeToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181b] text-white px-5 py-3 rounded-lg border border-zinc-700 flex items-center gap-3 max-w-md">

          <p className="text-sm font-medium">{mensajeToast}</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONTENIDO SEGÚN LA VISTA SELECCIONADA */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* VISTA A: JURADO */}
      {/* ------------------------------------------------------------------------- */}
      {vistaModo === 'jurado' && (
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">

          {/* Header del Jurado */}
          <div className="bg-white p-6 rounded-lg border border-gray-100 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#18181b]">Grupos por calificar</h1>
            </div>

            {/* Selector de Jurado Simulado */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex items-center gap-3">
              <span className="text-xs text-gray-500 font-semibold">Jurado</span>
              <select
                value={juradoActivoId}
                onChange={(e) => setJuradoActivoId(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-1.5 font-semibold focus:ring-2 focus:ring-[#27272a] focus:outline-none"
              >
                {juradosAceptados.map(j => (
                  <option key={j.id} value={j.id}>{j.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grilla de Grupos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grupos.map((grupo) => {
              const califDelJurado = grupo.calificaciones.find(c => c.juradoId === juradoActivoId);
              const yaCalificado = Boolean(califDelJurado);

              return (
                <div key={grupo.id} className="bg-white rounded-lg border border-gray-100 p-6 flex flex-col justify-between transition-">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      {yaCalificado ? (
                        <span className="bg-zinc-100 text-zinc-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          Calificado ({califDelJurado?.puntajes.total} pts)
                        </span>
                      ) : (
                        <span className="bg-zinc-100 text-zinc-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                          Pendiente
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{grupo.nombre}</h3>
                  </div>

                  {yaCalificado ? (
                    <button
                      onClick={() => abrirFormularioCalificar(grupo)}
                      className="bg-[#52525b] hover:bg-[#3f3f46] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >

                      <span>Editar calificación</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => abrirFormularioCalificar(grupo)}
                      className="bg-[#3f3f46] hover:bg-[#27272a] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >

                      <span>Calificar</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* MODAL / DRAWER DE CALIFICACIÓN CON RÚBRICA */}
          {grupoEvaluando && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-50">
              <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#27272a]">{grupoEvaluando.nombre}</h2>
                    <p className="text-xs text-gray-500">Jurado: <span className="font-semibold text-gray-800">{juradoActualInfo?.nombre}</span></p>
                  </div>
                  <button
                    onClick={() => setGrupoEvaluando(null)}
                    className="text-gray-400 hover:text-red-500 font-semibold text-3xl leading-none p-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={guardarCalificacionDemo} className="space-y-6 flex-1">

                  {/* A) INTERPRETACIÓN */}
                  <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-[#18181b] mb-3 flex justify-between text-sm">
                      <span>A) Interpretación y Calidad</span>
                      <span className="text-zinc-600 font-semibold">(Máx. 60 pts)</span>
                    </h3>
                    <div className="space-y-3 text-sm text-black">
                      <InputPuntajeDemo label="Afinación y precisión" val={notas.afinacion} onChange={(v) => handleNotaChange('afinacion', v, 12)} max={12} />
                      <InputPuntajeDemo label="Armonía y estructura" val={notas.armonia} onChange={(v) => handleNotaChange('armonia', v, 12)} max={12} />
                      <InputPuntajeDemo label="Calidad vocal e instrumental" val={notas.vocal} onChange={(v) => handleNotaChange('vocal', v, 12)} max={12} />
                      <InputPuntajeDemo label="Coordinación grupal" val={notas.coordinacion} onChange={(v) => handleNotaChange('coordinacion', v, 12)} max={12} />
                      <InputPuntajeDemo label="Dominio técnico" val={notas.tecnico} onChange={(v) => handleNotaChange('tecnico', v, 12)} max={12} />
                    </div>
                  </section>

                  {/* B) EXPRESIÓN */}
                  <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-[#18181b] mb-3 flex justify-between text-sm">
                      <span>B) Expresión Artística</span>
                      <span className="text-zinc-600 font-semibold">(Máx. 20 pts)</span>
                    </h3>
                    <div className="space-y-3 text-sm text-black">
                      <InputPuntajeDemo label="Dominio de escenario" val={notas.escenario} onChange={(v) => handleNotaChange('escenario', v, 5)} max={5} />
                      <InputPuntajeDemo label="Expresividad" val={notas.expresividad} onChange={(v) => handleNotaChange('expresividad', v, 5)} max={5} />
                      <InputPuntajeDemo label="Conexión con el público" val={notas.conexion} onChange={(v) => handleNotaChange('conexion', v, 5)} max={5} />
                      <InputPuntajeDemo label="Presencia escénica" val={notas.presencia} onChange={(v) => handleNotaChange('presencia', v, 5)} max={5} />
                    </div>
                  </section>

                  {/* C) PRESENTACIÓN */}
                  <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-[#18181b] mb-3 flex justify-between text-sm">
                      <span>C) Presentación y Elementos</span>
                      <span className="text-zinc-600 font-semibold">(Máx. 10 pts)</span>
                    </h3>
                    <div className="space-y-3 text-sm text-black">
                      <InputPuntajeDemo label="Vestimenta y estética" val={notas.vestimenta} onChange={(v) => handleNotaChange('vestimenta', v, 4)} max={4} />
                      <InputPuntajeDemo label="Cuerpo de baile" val={notas.cuerpo} onChange={(v) => handleNotaChange('cuerpo', v, 3)} max={3} />
                      <InputPuntajeDemo label="Participación de barra" val={notas.barra} onChange={(v) => handleNotaChange('barra', v, 3)} max={3} />
                    </div>
                  </section>

                  {/* D) ORIGINALIDAD */}
                  <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-[#18181b] mb-3 flex justify-between text-sm">
                      <span>D) Originalidad e Identidad</span>
                      <span className="text-zinc-600 font-semibold">(Máx. 10 pts)</span>
                    </h3>
                    <div className="space-y-3 text-sm text-black">
                      <InputPuntajeDemo label="Identidad cultural" val={notas.identidad} onChange={(v) => handleNotaChange('identidad', v, 5)} max={5} />
                      <InputPuntajeDemo label="Propuesta artística" val={notas.propuesta} onChange={(v) => handleNotaChange('propuesta', v, 5)} max={5} />
                    </div>
                  </section>

                  {/* BARRA INFERIOR DE TOTAL Y SUBMIT */}
                  <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-6 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-500 block">Puntaje Total</span>
                      <span className="text-2xl font-semibold text-[#18181b]">
                        {calcularTotal()} <span className="text-sm font-medium text-gray-400">/ 100</span>
                      </span>
                    </div>
                    <button
                      type="submit"
                      className="bg-[#27272a] hover:bg-[#18181b] text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      Guardar Calificación
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}
        </main>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* VISTA B: ADMINISTRADOR */}
      {/* ------------------------------------------------------------------------- */}
      {vistaModo === 'admin' && (
        <div className="flex flex-1 overflow-hidden">

          {/* BARRA LATERAL (SIDEBAR DE ADMIN) */}
          <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-[#18181b]">Administración</h2>
            </div>
            <nav className="mt-4 flex flex-col flex-1">
              <button
                onClick={() => setVistaAdmin('dashboard')}
                className={`text-left flex items-center px-6 py-4 font-semibold transition-colors cursor-pointer ${
                  vistaAdmin === 'dashboard'
                    ? 'bg-[#fafafa] text-[#27272a] border-r-4 border-[#27272a]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span> Gestión de evento</span>
              </button>
              <button
                onClick={() => setVistaAdmin('calificaciones')}
                className={`text-left flex items-center px-6 py-4 font-semibold transition-colors cursor-pointer ${
                  vistaAdmin === 'calificaciones'
                    ? 'bg-[#fafafa] text-[#27272a] border-r-4 border-[#27272a]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span> Calificaciones</span>
              </button>
              <button
                onClick={() => setVistaAdmin('premiacion')}
                className={`text-left flex items-center px-6 py-4 font-semibold transition-colors cursor-pointer ${
                  vistaAdmin === 'premiacion'
                    ? 'bg-[#fafafa] text-[#27272a] border-r-4 border-[#27272a]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span> Premiación</span>
              </button>
            </nav>
          </aside>

          {/* CONTENEDOR PRINCIPAL DE ADMIN */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">

            {/* Selector de subpestañas para móviles */}
            <div className="flex md:hidden gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setVistaAdmin('dashboard')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${vistaAdmin === 'dashboard' ? 'bg-[#27272a] text-white' : 'bg-white text-gray-700'}`}
              >
                Gestión
              </button>
              <button
                onClick={() => setVistaAdmin('calificaciones')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${vistaAdmin === 'calificaciones' ? 'bg-[#27272a] text-white' : 'bg-white text-gray-700'}`}
              >
                Calificaciones
              </button>
              <button
                onClick={() => setVistaAdmin('premiacion')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${vistaAdmin === 'premiacion' ? 'bg-[#27272a] text-white' : 'bg-white text-gray-700'}`}
              >
                Premiación
              </button>
            </div>

            {/* B.1: GESTIÓN DE EVENTO (GRUPOS Y JURADOS) */}
            {vistaAdmin === 'dashboard' && (
              <>
                <h1 className="text-3xl font-semibold text-[#18181b] mb-8">Gestión de grupos y jurados</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  {/* Columna Izquierda: Grupos */}
                  <section className="bg-white rounded-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Nuevo grupo</h2>
                    <form onSubmit={handleAgregarGrupoDemo} className="flex gap-4 mb-8">
                      <input
                        type="text"
                        value={nuevoGrupo}
                        onChange={(e) => setNuevoGrupo(e.target.value)}
                        placeholder="Nombre del grupo"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27272a] text-gray-800 text-sm"
                      />
                      <button
                        type="submit"
                        className="bg-[#27272a] hover:bg-[#18181b] text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer text-sm"
                      >
                        Agregar
                      </button>
                    </form>

                    <h3 className="text-md font-semibold text-gray-700 mb-4 flex justify-between items-center">
                      <span>Grupos registrados</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">{grupos.length}</span>
                    </h3>

                    <ul className="space-y-3">
                      {grupos.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center">No hay grupos registrados en esta sesión.</p>
                      ) : (
                        grupos.map((grupo) => (
                          <li key={grupo.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                            {grupoEditandoId === grupo.id ? (
                              <div className="flex flex-1 gap-2 mr-4">
                                <input
                                  type="text"
                                  value={nombreEditado}
                                  onChange={(e) => setNombreEditado(e.target.value)}
                                  className="flex-1 px-2 py-1 border rounded text-black text-sm focus:outline-none focus:ring-1 focus:ring-[#27272a]"
                                  autoFocus
                                />
                                <button onClick={() => guardarEdicionGrupoDemo(grupo.id)} className="text-green-600 font-semibold px-2 hover:bg-green-100 rounded text-xs cursor-pointer">Guardar</button>
                                <button onClick={() => setGrupoEditandoId(null)} className="text-gray-500 font-semibold px-2 hover:bg-gray-200 rounded text-xs cursor-pointer">X</button>
                              </div>
                            ) : (
                              <div>
                                <span className="font-medium text-gray-800 text-sm block">{grupo.nombre}</span>
                                <span className="text-xs text-gray-400">Promedio actual: {grupo.puntajePromedioFinal.toFixed(2)} pts</span>
                              </div>
                            )}

                            {grupoEditandoId !== grupo.id && (
                              <div className="flex gap-3">
                                <button
                                  onClick={() => { setGrupoEditandoId(grupo.id); setNombreEditado(grupo.nombre); }}
                                  className="text-blue-500 hover:text-blue-700 transition-colors font-medium text-sm cursor-pointer"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleEliminarGrupoDemo(grupo.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors font-medium text-sm cursor-pointer"
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </li>
                        ))
                      )}
                    </ul>
                  </section>

                  {/* Columna Derecha: Jurados */}
                  <section className="bg-white rounded-lg border border-gray-100 p-6 flex flex-col gap-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex justify-between items-center">
                        <span>Solicitudes pendientes</span>
                        {juradosPendientes.length > 0 && (
                          <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">
                            {juradosPendientes.length} Nuevas
                          </span>
                        )}
                      </h2>
                      <ul className="space-y-3">
                        {juradosPendientes.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No hay solicitudes pendientes.</p>
                        ) : (
                          juradosPendientes.map((jurado) => (
                            <li key={jurado.id} className="flex justify-between items-center bg-zinc-50 px-4 py-3 rounded-lg border border-zinc-200">
                              <span className="font-medium text-gray-800 text-sm">{jurado.nombre}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAceptarJuradoDemo(jurado.id)}
                                  className="bg-[#3f3f46] hover:bg-[#27272a] text-white px-3 py-1 text-xs rounded-md font-medium cursor-pointer"
                                >
                                  Aceptar
                                </button>
                                <button
                                  onClick={() => handleRechazarJuradoDemo(jurado.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-md font-medium cursor-pointer"
                                >
                                  Rechazar
                                </button>
                              </div>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-md font-semibold text-gray-700 mb-4">Jurados activos</h3>
                      <ul className="space-y-2">
                        {juradosAceptados.map((jurado) => (
                          <li key={jurado.id} className="flex justify-between items-center bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-100">
                            <span className="text-gray-800 text-sm font-medium">{jurado.nombre}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-[#3f3f46] text-xs font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#3f3f46]"></span> Activo
                              </span>
                              <button
                                onClick={() => handleEliminarJuradoDemo(jurado.id)}
                                className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors cursor-pointer"
                                title="Eliminar jurado de la sesión"
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

            {/* B.2: TABLA DE CALIFICACIONES Y REPORTES */}
            {vistaAdmin === 'calificaciones' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <h1 className="text-3xl font-semibold text-[#18181b]">Tabla de puntuaciones</h1>
                  </div>

                  {/* Botones de Exportación UI reales con xlsx y jspdf */}
                  <div className="flex gap-3">
                    <button
                      onClick={exportarExcelDemo}
                      className="bg-zinc-800 hover:bg-zinc-900 text-white px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >

                      <span>Exportar Excel</span>
                    </button>
                    <button
                      onClick={exportarPDFDemo}
                      className="bg-zinc-800 hover:bg-zinc-900 text-white px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >

                      <span>Exportar PDF</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#27272a] text-white text-xs">
                          <th className="p-4 font-semibold whitespace-nowrap text-center">Posición</th>
                          <th className="p-4 font-semibold whitespace-nowrap">Grupo</th>

                          {juradosAceptados.map((j, idx) => (
                            <th key={j.id} className="p-4 font-semibold whitespace-nowrap text-center">
                              Jurado {idx + 1}
                              <span className="block text-[10px] font-normal opacity-80">{j.nombre}</span>
                            </th>
                          ))}

                          <th className="p-4 font-semibold whitespace-nowrap text-center text-zinc-200">Promedio</th>
                          <th className="p-4 font-semibold whitespace-nowrap text-center text-white">Acciones</th>
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
                              <td className="p-4 font-semibold text-center text-[#18181b] text-lg">#{index + 1}</td>
                              <td className="p-4 font-semibold">{g.nombre}</td>

                              {juradosAceptados.map(j => {
                                const calif = g.calificaciones.find(c => c.juradoId === j.id);
                                return (
                                  <td key={j.id} className="p-4 text-center font-medium text-gray-600">
                                    {calif ? (
                                      <span className="font-semibold text-gray-800">{calif.puntajes.total}</span>
                                    ) : (
                                      <span className="text-gray-300">-</span>
                                    )}
                                  </td>
                                );
                              })}

                              <td className="p-4 text-center font-semibold text-lg text-[#3f3f46] bg-green-50/50">
                                {g.puntajePromedioFinal ? g.puntajePromedioFinal.toFixed(2) : '0.00'}
                              </td>

                              <td className="p-4 text-center">
                                <button
                                  onClick={() => setGrupoDetalles(g)}
                                  className="bg-[#27272a] hover:bg-[#18181b] text-white text-xs font-semibold py-1.5 px-3 rounded transition-colors cursor-pointer"
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

            {/* B.3: CONFIGURACIÓN DE PREMIACIÓN */}
            {vistaAdmin === 'premiacion' && (
              <div className="max-w-2xl mx-auto mt-8 bg-white rounded-lg border border-gray-200 p-8 text-center">

                <h1 className="text-3xl font-semibold text-[#18181b] mb-2">Premiación</h1>

                <div className="flex flex-col items-center gap-6">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2 text-sm">Lugares a premiar</label>
                    <input
                      type="number"
                      min="1"
                      max={grupos.length || 10}
                      value={topN}
                      onChange={(e) => setTopN(Math.max(1, Number(e.target.value)))}
                      className="w-28 px-4 py-2 text-2xl text-center font-semibold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg focus:border-[#27272a] focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setVistaModo('premiacion');
                      setFasePremiacion('ESPERA');
                      setPosicionActual(Math.min(topN, gruposPodio.length || 3));
                    }}
                    className="bg-[#52525b] hover:bg-[#3f3f46] text-white text-base font-semibold py-3.5 px-8 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >

                    <span>Iniciar presentación</span>
                  </button>
                </div>
              </div>
            )}

          </main>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* VISTA C: CEREMONIA DE PREMIACIÓN (PODIO) */}
      {/* ------------------------------------------------------------------------- */}
      {vistaModo === 'premiacion' && (
        <main className="flex-1 bg-zinc-900 flex flex-col items-center justify-center p-6 text-white relative min-h-[85vh] overflow-hidden">

          <div className="absolute top-6 left-6 z-30">
            <button
              onClick={() => setVistaModo('admin')}
              className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Administración</span>
            </button>
          </div>

          <div className="absolute top-6 text-center w-full z-10 pointer-events-none">
            <h2 className="text-sm md:text-base text-gray-400 tracking-normal font-semibold">
              Premiación
            </h2>
          </div>

          {gruposPodio.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-2xl text-gray-300 mb-4">No hay grupos calificados.</p>
              <button
                onClick={() => setVistaModo('jurado')}
                className="bg-[#3f3f46] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#27272a] transition-colors cursor-pointer"
              >
                Calificar grupos
              </button>
            </div>
          ) : fasePremiacion === 'PODIO' ? (
            <div className="flex flex-col items-center justify-center w-full max-w-5xl z-10 my-auto">
              <h1 className="text-4xl md:text-6xl font-semibold mb-12 text-zinc-100">
                Resultados
              </h1>

              <div className="flex items-end justify-center gap-4 md:gap-8 h-80 w-full">
                {/* Segundo Lugar */}
                {gruposPodio[1] && (
                  <div className="flex flex-col items-center w-1/3">
                    <h2 className="text-lg md:text-2xl font-semibold text-gray-300 text-center mb-2">{gruposPodio[1].nombre}</h2>
                    <span className="text-xs text-gray-400 mb-2 font-mono">{gruposPodio[1].puntajePromedioFinal.toFixed(2)} pts</span>
                    <div className="w-full bg-zinc-400 h-52 rounded-t-lg flex justify-center items-start pt-4 border-t-4 border-gray-200">
                      <span className="text-5xl font-semibold text-gray-800">2</span>
                    </div>
                  </div>
                )}

                {/* Primer Lugar */}
                {gruposPodio[0] && (
                  <div className="flex flex-col items-center w-1/3">

                    <h2 className="text-xl md:text-3xl font-semibold text-zinc-100 text-center mb-1 leading-tight">{gruposPodio[0].nombre}</h2>
                    <span className="text-xs text-zinc-300 mb-2 font-mono font-semibold">{gruposPodio[0].puntajePromedioFinal.toFixed(2)} pts</span>
                    <div className="w-full bg-zinc-200 h-64 rounded-t-lg flex justify-center items-start pt-4 border-t-4 border-zinc-300 relative overflow-hidden">
                      <span className="text-6xl font-semibold text-zinc-900 z-10">1</span>
                    </div>
                  </div>
                )}

                {/* Tercer Lugar */}
                {gruposPodio[2] && (
                  <div className="flex flex-col items-center w-1/3">
                    <h2 className="text-base md:text-xl font-semibold text-zinc-300 text-center mb-2">{gruposPodio[2].nombre}</h2>
                    <span className="text-xs text-gray-400 mb-2 font-mono">{gruposPodio[2].puntajePromedioFinal.toFixed(2)} pts</span>
                    <div className="w-full bg-zinc-500 h-40 rounded-t-lg flex justify-center items-start pt-3 border-t-4 border-zinc-300">
                      <span className="text-4xl font-semibold text-zinc-900">3</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center flex flex-col items-center z-10 my-auto">
              {fasePremiacion === 'ESPERA' ? (
                <div className="text-center">
                  <h1 className="text-4xl md:text-6xl font-semibold text-gray-200 mb-8">
                    {posicionActual}° lugar
                  </h1>

                </div>
              ) : (
                <div className="text-center flex flex-col items-center">
                  <span className="text-2xl text-gray-400 mb-4 font-semibold tracking-normal">
                    {posicionActual === 1 ? '1° lugar' : `${posicionActual}° Lugar`}
                  </span>

                  <h1 className="text-4xl md:text-7xl font-semibold mb-6 px-4 text-zinc-100">
                    {ganadorActual?.nombre}
                  </h1>

                  <div className="bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-lg">
                    <p className="text-lg text-gray-300">
                      Promedio: <span className="text-zinc-100 font-semibold text-2xl ml-2">{ganadorActual?.puntajePromedioFinal.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BARRA INFERIOR DE CONTROLES DE LA CEREMONIA */}
          {gruposPodio.length > 0 && (
            <div className="fixed bottom-6 w-full max-w-xl px-4 flex justify-between items-center z-30 bg-zinc-800/90 backdrop-blur-md py-3 rounded-lg border border-zinc-700">
              <button
                onClick={retrocederCeremonia}
                className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Anterior
              </button>

              <span className="text-xs text-gray-400 font-mono">
                {fasePremiacion === 'PODIO' ? 'Vista de Podio' : `Lugar actual: ${posicionActual}°`}
              </span>

              {fasePremiacion === 'ESPERA' ? (
                <button
                  onClick={avanzarCeremonia}
                  className="bg-[#27272a] hover:bg-[#18181b] text-white font-semibold py-2 px-5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Revelar ganador
                </button>
              ) : (
                <button
                  onClick={avanzarCeremonia}
                  className="bg-[#3f3f46] hover:bg-[#27272a] text-white font-semibold py-2 px-5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {posicionActual > 1 ? 'Siguiente lugar' : 'Mostrar podio '}
                </button>
              )}
            </div>
          )}
        </main>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* MODAL GLOBAL: DETALLES DE EVALUACIONES (DESDE ADMIN) */}
      {/* ------------------------------------------------------------------------- */}
      {grupoDetalles && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">

            {/* Header del modal */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <div>
                <span className="text-xs font-semibold text-gray-400">Calificaciones por jurado</span>
                <h2 className="text-2xl font-semibold text-[#18181b]">
                  {grupoDetalles.nombre} <span className="text-[#3f3f46] text-lg font-semibold">({grupoDetalles.puntajePromedioFinal.toFixed(2)} pts)</span>
                </h2>
              </div>
              <button onClick={() => setGrupoDetalles(null)} className="text-gray-400 hover:text-red-500 font-semibold text-3xl leading-none cursor-pointer">&times;</button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              {grupoDetalles.calificaciones.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Sin calificaciones.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grupoDetalles.calificaciones.map((calif) => (
                    <div key={calif.juradoId} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                      <h3 className="text-base font-semibold text-[#27272a] border-b border-gray-200 pb-2 mb-3 flex justify-between items-center">
                        <span>{calif.nombre}</span>
                        <span className="text-[#52525b] font-semibold text-sm">{calif.puntajes.total} / 100</span>
                      </h3>

                      {calif.puntajes.detalles ? (
                        <div className="space-y-3 text-xs text-gray-700">
                          <div>
                            <h4 className="font-semibold text-[#3f3f46]">A) Interpretación ({calif.puntajes.interpretacion}/60)</h4>
                            <ul className="ml-3 mt-1 space-y-0.5 list-disc">
                              <li>Afinación: {calif.puntajes.detalles.afinacion}</li>
                              <li>Armonía: {calif.puntajes.detalles.armonia}</li>
                              <li>Vocal/Inst.: {calif.puntajes.detalles.vocal}</li>
                              <li>Coordinación: {calif.puntajes.detalles.coordinacion}</li>
                              <li>Técnico: {calif.puntajes.detalles.tecnico}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#3f3f46]">B) Expresión ({calif.puntajes.expresion}/20)</h4>
                            <ul className="ml-3 mt-1 space-y-0.5 list-disc">
                              <li>Escenario: {calif.puntajes.detalles.escenario}</li>
                              <li>Expresividad: {calif.puntajes.detalles.expresividad}</li>
                              <li>Conexión: {calif.puntajes.detalles.conexion}</li>
                              <li>Presencia: {calif.puntajes.detalles.presencia}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#3f3f46]">C) Presentación ({calif.puntajes.presentacion}/10)</h4>
                            <ul className="ml-3 mt-1 space-y-0.5 list-disc">
                              <li>Vestimenta: {calif.puntajes.detalles.vestimenta}</li>
                              <li>Cuerpo de baile: {calif.puntajes.detalles.cuerpo}</li>
                              <li>Barra: {calif.puntajes.detalles.barra}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#3f3f46]">D) Originalidad ({calif.puntajes.originalidad}/10)</h4>
                            <ul className="ml-3 mt-1 space-y-0.5 list-disc">
                              <li>Identidad: {calif.puntajes.detalles.identidad}</li>
                              <li>Propuesta: {calif.puntajes.detalles.propuesta}</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic text-xs">Detalle no disponible.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Subcomponente aislado para los inputs de calificación
function InputPuntajeDemo({ label, val, onChange, max }: { label: string, val: string, onChange: (v: string) => void, max: number }) {
  return (
    <div className="flex justify-between items-center text-xs sm:text-sm">
      <label className="text-gray-700">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          max={max}
          value={val}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-14 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-[#27272a] focus:outline-none font-semibold text-gray-900 bg-white"
        />
        <span className="text-gray-400 text-xs w-7">/ {max}</span>
      </div>
    </div>
  );
}
