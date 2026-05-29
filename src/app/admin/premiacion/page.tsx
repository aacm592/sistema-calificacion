'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Link from 'next/link';

interface Resultado {
  grupoId: string;
  nombreGrupo: string;
  puntajeFinal: number;
  juradosEvaluadores: number;
}

export default function PremiacionPage() {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const obtenerResultados = async () => {
      try {
        const res = await fetch('/api/resultados');
        const data = await res.json();
        
        if (data.success) {
          setResultados(data.data);
        } else {
          setError('Error al obtener los datos del servidor.');
        }
      } catch (err) {
        setError('Error de red al conectar con la API.');
      } finally {
        setCargando(false);
      }
    };

    obtenerResultados();
  }, []);

  // Función para exportar a Excel
  const exportarExcel = () => {
    if (resultados.length === 0) return;

    // 1. Mapear los datos a un formato plano para la hoja de cálculo
    const datosExportar = resultados.map((resultado, index) => ({
      'Posición': index + 1,
      'Nombre del Grupo': resultado.nombreGrupo,
      'Puntaje Final Promedio': resultado.puntajeFinal,
      'Total de Evaluadores': resultado.juradosEvaluadores
    }));

    // 2. Crear el libro y la hoja
    const hoja = XLSX.utils.json_to_sheet(datosExportar);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Resultados Oficiales');

    // 3. Ajustar el ancho de las columnas (opcional para mejor estética)
    hoja['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 25 }, { wch: 20 }];

    // 4. Descargar el archivo
    XLSX.writeFile(libro, 'Resultados_Concurso.xlsx');
  };

  // Función para exportar el Acta en PDF
  const exportarPDF = () => {
    if (resultados.length === 0) return;

    const doc = new jsPDF();
    
    // Título del documento
    doc.setFontSize(18);
    doc.text('Acta Oficial de Resultados', 14, 22);
    
    // Fecha y metadatos
    doc.setFontSize(11);
    doc.setTextColor(100);
    const fechaActual = new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    doc.text(`Generado el: ${fechaActual}`, 14, 30);

    // Preparar datos para la tabla
    const columnas = [['Posición', 'Grupo Musical', 'Puntaje Final', 'Evaluadores']];
    const filas = resultados.map((resultado, index) => [
      (index + 1).toString(),
      resultado.nombreGrupo,
      resultado.puntajeFinal.toFixed(2),
      resultado.juradosEvaluadores.toString()
    ]);

    // Generar la tabla usando jspdf-autotable
    autoTable(doc, {
      head: columnas,
      body: filas,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [69, 58, 150] }, // Color temático basado en el proyecto
      styles: { fontSize: 11, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Firma o cierre al final de la página
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.text('_________________________________', 14, finalY + 30);
    doc.text('Firma del Administrador / Validador', 14, finalY + 38);

    doc.save('Acta_Premiacion.pdf');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Premiación</h1>
            <p className="text-gray-600 mt-2">Resultados oficiales y generación de actas</p>
          </div>
          <Link 
            href="/admin/dashboard" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Volver al Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-end gap-4 mb-6">
            <button
              onClick={exportarExcel}
              disabled={resultados.length === 0 || cargando}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              Exportar Excel
            </button>
            <button
              onClick={exportarPDF}
              disabled={resultados.length === 0 || cargando}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              Generar Acta PDF
            </button>
          </div>

          {cargando ? (
            <div className="text-center py-10 text-gray-500">Calculando resultados de la base de datos...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : resultados.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Aún no hay calificaciones registradas en el sistema.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-4 border-b font-semibold">Posición</th>
                    <th className="p-4 border-b font-semibold">Grupo Musical</th>
                    <th className="p-4 border-b font-semibold">Jurados Evaluadores</th>
                    <th className="p-4 border-b font-semibold text-right">Puntaje Final</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((resultado, index) => (
                    <tr 
                      key={resultado.grupoId} 
                      className={`border-b hover:bg-gray-50 ${index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-orange-50' : ''}`}
                    >
                      <td className="p-4">
                        <span className={`font-bold ${index < 3 ? 'text-lg' : 'text-gray-600'}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-900">{resultado.nombreGrupo}</td>
                      <td className="p-4 text-gray-600">{resultado.juradosEvaluadores} jurados</td>
                      <td className="p-4 text-right font-bold text-gray-900 text-lg">
                        {resultado.puntajeFinal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}