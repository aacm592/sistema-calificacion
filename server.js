const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { loadEnvConfig } = require('@next/env');

const dev = process.env.NODE_ENV !== 'production';

// 1. CARGA DE VARIABLES DE ENTORNO
// Esto garantiza que Node lea tu archivo .env.local al ejecutar 'pnpm run dev'
loadEnvConfig('./', dev);

const hostname = '0.0.0.0'; 
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// 2. CONEXIÓN A MONGODB ATLAS
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn("\n[Base de Datos] ADVERTENCIA CRÍTICA: MONGODB_URI no está definido.\n");
} else {
  mongoose.connect(MONGODB_URI, { bufferCommands: false })
    .then(() => console.log('\n[Base de Datos] > Conectado exitosamente a MongoDB Atlas\n'))
    .catch(err => console.error('\n[Base de Datos] > Error fatal de conexión:', err, '\n'));
}

// 3. DEFINICIÓN DE ESQUEMAS EN ENTORNO NODE NATIVO
// Utilizamos un campo 'id' String para asegurar compatibilidad absoluta con el Frontend
const GrupoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: String
});
const Grupo = mongoose.models.Grupo || mongoose.model('Grupo', GrupoSchema);

const JuradoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: String,
  foto: { type: String, default: '' },
  aceptado: { type: Boolean, default: false }
});
const Jurado = mongoose.models.Jurado || mongoose.model('Jurado', JuradoSchema);

const CalificacionSchema = new mongoose.Schema({
  grupoId: { type: String, required: true },
  juradoId: { type: String, required: true },
  puntajes: { type: mongoose.Schema.Types.Mixed, required: true } // Permite guardar la rúbrica exacta que mande el frontend
});
CalificacionSchema.index({ grupoId: 1, juradoId: 1 }, { unique: true });
const Calificacion = mongoose.models.Calificacion || mongoose.model('Calificacion', CalificacionSchema);

// 4. FUNCIÓN MAESTRA DE SINCRONIZACIÓN DE ESTADO
// Reemplaza la variable volátil leyendo todo desde MongoDB
async function emitirEstadoGlobal(io) {
  try {
    const gruposDB = await Grupo.find().lean();
    const juradosDB = await Jurado.find().lean();
    const calificacionesDB = await Calificacion.find().lean();

    const estadoConcurso = {
      administradorAutenticado: false,
      eventoActivo: true,
      jurados: juradosDB.map(j => ({
        id: j.id, 
        nombre: j.nombre, 
        foto: j.foto, 
        aceptado: j.aceptado 
      })),
      grupos: gruposDB.map(g => {
        // Extraemos las calificaciones de este grupo específico
        const califsGrupo = calificacionesDB.filter(c => c.grupoId === g.id);
        let sumaTotal = 0;
        
        const calificacionesArray = califsGrupo.map(c => {
          const juradoInfo = juradosDB.find(j => j.id === c.juradoId);
          sumaTotal += (c.puntajes && c.puntajes.total) ? c.puntajes.total : 0;
          return {
            juradoId: c.juradoId,
            nombre: juradoInfo ? juradoInfo.nombre : 'Jurado Desconocido',
            puntajes: c.puntajes
          };
        });

        return {
          id: g.id,
          nombre: g.nombre,
          calificaciones: calificacionesArray,
          puntajePromedioFinal: calificacionesArray.length > 0 ? (sumaTotal / calificacionesArray.length) : 0
        };
      })
    };

    io.emit('estadoActualizado', estadoConcurso);
  } catch (error) {
    console.error("[Socket] Error al emitir el estado global:", error);
  }
}

// 5. INICIALIZACIÓN DEL SERVIDOR Y EVENTOS WEBSOCKETS
app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Interceptor ligero para UptimeRobot
    if (req.url === '/api/keep-alive') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'activo', timestamp: Date.now() }));
      return;
    }
    return handler(req, res);
  });

  const io = new Server(httpServer);

  io.on('connection', async (socket) => {
    console.log(`[Socket] Cliente conectado: ${socket.id}`);
    
    // Al conectar un nuevo cliente, calculamos y enviamos el estado directo de BD
    await emitirEstadoGlobal(io);

    socket.on('disconnect', () => {
      console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    });

    // -- EVENTOS TRANSACCIONALES --
    socket.on('agregarGrupo', async (nombre) => {
      await Grupo.create({ id: Date.now().toString(), nombre });
      await emitirEstadoGlobal(io);
    });

    socket.on('eliminarGrupo', async (id) => {
      await Grupo.deleteOne({ id });
      await Calificacion.deleteMany({ grupoId: id });
      await emitirEstadoGlobal(io);
    });

    socket.on('editarGrupo', async ({ id, nuevoNombre }) => {
      await Grupo.updateOne({ id }, { nombre: nuevoNombre });
      await emitirEstadoGlobal(io);
    });

    socket.on('aceptarJurado', async (id) => {
      await Jurado.updateOne({ id }, { aceptado: true });
      await emitirEstadoGlobal(io);
    });

    socket.on('solicitarUnion', async (datos) => {
      const existe = await Jurado.findOne({ id: datos.id });
      if (!existe) {
        await Jurado.create({ id: datos.id, nombre: datos.nombre, foto: datos.foto || '', aceptado: false });
      } else {
        await Jurado.updateOne({ id: datos.id }, { nombre: datos.nombre, foto: datos.foto || existe.foto });
      }
      await emitirEstadoGlobal(io);
    });

    socket.on('enviarCalificacion', async ({ juradoId, grupoId, puntajes }) => {
      // findOneAndUpdate con upsert actualiza la nota si el jurado la edita, o la inserta si es nueva
      await Calificacion.findOneAndUpdate(
        { juradoId, grupoId },
        { puntajes },
        { upsert: true, new: true } 
      );
      await emitirEstadoGlobal(io);
    });

    socket.on('eliminarJurado', async (id) => {
      console.log(`\n--- INICIO DE ELIMINACIÓN ---`);
      console.log(`[Servidor] Solicitud de eliminación para el Jurado ID:`, id);
      await Jurado.deleteOne({ id });
      const borrados = await Calificacion.deleteMany({ juradoId: id });
      console.log(`[Servidor] Se purgaron ${borrados.deletedCount} calificaciones de la BD.`);
      console.log(`--- FIN DE ELIMINACIÓN ---\n`);
      await emitirEstadoGlobal(io);
    });
    
    // Si tienes un evento rechazarJurado que difiera de eliminarJurado
    socket.on('rechazarJurado', async (id) => {
      await Jurado.deleteOne({ id });
      await emitirEstadoGlobal(io);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Sistema inicializado en la interfaz ${hostname} por el puerto ${port}`);
  });
});