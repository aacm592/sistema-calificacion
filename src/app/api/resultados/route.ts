import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectDB();

    // Utilizamos la conexión nativa para evitar conflictos de tipado con los esquemas
    const db = mongoose.connection.db;
    if (!db) throw new Error("No hay conexión a la base de datos");

    // Parámetro opcional para el Top N (ej. /api/resultados?top=3)
    const { searchParams } = new URL(request.url);
    const topNParam = searchParams.get('top');
    const limit = topNParam ? parseInt(topNParam, 10) : 100;

    const pipeline = [
      {
        // 1. Agrupar por el ID del grupo y calcular el promedio del puntaje total
        $group: {
          _id: "$grupoId",
          puntajePromedioFinal: { $avg: "$puntajes.total" },
          cantidadJurados: { $sum: 1 }
        }
      },
      {
        // 2. Ordenar descendentemente por el puntaje
        $sort: { puntajePromedioFinal: -1 }
      },
      {
        // 3. Limitar a los N primeros lugares
        $limit: limit
      },
      {
        // 4. Hacer un "JOIN" (Lookup) con la colección de grupos para obtener el nombre
        $lookup: {
          from: "grupos", // Mongoose pluraliza el nombre del modelo por defecto
          localField: "_id",
          foreignField: "id",
          as: "grupoInfo"
        }
      },
      {
        // 5. Desestructurar el array resultante del lookup
        $unwind: "$grupoInfo"
      },
      {
        // 6. Proyectar (seleccionar) solo los campos necesarios para el frontend
        $project: {
          _id: 0,
          grupoId: "$_id",
          nombreGrupo: "$grupoInfo.nombre",
          puntajeFinal: { $round: ["$puntajePromedioFinal", 2] }, // Redondeo a 2 decimales
          juradosEvaluadores: "$cantidadJurados"
        }
      }
    ];

    const resultados = await db.collection('calificaciones').aggregate(pipeline).toArray();

    return NextResponse.json({ success: true, data: resultados });

  } catch (error) {
    console.error("Error al calcular resultados:", error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}