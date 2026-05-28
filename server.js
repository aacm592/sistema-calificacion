const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Estado global en memoria
let estadoConcurso = {
  administradorAutenticado: false,
  jurados: [],
  grupos: [],
  eventoActivo: false
};

app.prepare().then(() => {
  app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Interceptor ligero para el Keep-Alive
    if (req.url === '/api/keep-alive') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'activo', timestamp: Date.now() }));
      return;
    }
    // Delegar el resto del tráfico a Next.js
    return handler(req, res);
  });
  
  const io = new Server(httpServer);
  
  // ... (El resto de tu lógica de WebSockets se mantiene exactamente igual)
  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    console.log(`[Socket] Cliente conectado: ${socket.id}`);
    socket.emit('estadoActualizado', estadoConcurso);

    socket.on('disconnect', () => {
      console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    });

    // -- EVENTOS DE GRUPOS --
    socket.on('agregarGrupo', (nombre) => {
      estadoConcurso.grupos.push({ id: Date.now().toString(), nombre, calificaciones: [], puntajePromedioFinal: 0 });
      io.emit('estadoActualizado', estadoConcurso);
    });

    socket.on('eliminarGrupo', (id) => {
      estadoConcurso.grupos = estadoConcurso.grupos.filter(g => g.id !== id);
      io.emit('estadoActualizado', estadoConcurso);
    });

    socket.on('editarGrupo', ({ id, nuevoNombre }) => {
      estadoConcurso.grupos = estadoConcurso.grupos.map(g => g.id === id ? { ...g, nombre: nuevoNombre } : g);
      io.emit('estadoActualizado', estadoConcurso);
    });

    // -- EVENTOS DE JURADOS --
    socket.on('aceptarJurado', (id) => {
      const jurado = estadoConcurso.jurados.find(j => j.id === id);
      if (jurado) jurado.aceptado = true;
      io.emit('estadoActualizado', estadoConcurso);
    });

    socket.on('rechazarJurado', (id) => {
      estadoConcurso.jurados = estadoConcurso.jurados.filter(j => j.id !== id);
      io.emit('estadoActualizado', estadoConcurso);
    });

    socket.on('solicitarUnion', (datos) => {
      const juradoId = datos.id;
      const existe = estadoConcurso.jurados.find(j => j.id === juradoId);
      if (!existe) {
        estadoConcurso.jurados.push({ id: juradoId, nombre: datos.nombre, foto: datos.foto || '', aceptado: false });
      } else {
        existe.nombre = datos.nombre;
        if (datos.foto) existe.foto = datos.foto;
      }
      io.emit('estadoActualizado', estadoConcurso);
    });

    socket.on('enviarCalificacion', ({ juradoId, grupoId, puntajes }) => {
      const grupo = estadoConcurso.grupos.find(g => g.id === grupoId);
      const jurado = estadoConcurso.jurados.find(j => j.id === juradoId);

      if (grupo && jurado) {
        const index = grupo.calificaciones.findIndex(c => c.juradoId === juradoId);
        const nuevaCalificacion = { juradoId, nombre: jurado.nombre, puntajes };
        
        if (index !== -1) {
          grupo.calificaciones[index] = nuevaCalificacion;
        } else {
          grupo.calificaciones.push(nuevaCalificacion);
        }

        let sumaTotal = 0;
        grupo.calificaciones.forEach(c => { sumaTotal += c.puntajes.total; });
        grupo.puntajePromedioFinal = sumaTotal / grupo.calificaciones.length;
        io.emit('estadoActualizado', estadoConcurso);
      }
    });

    // -- EVENTO DE ELIMINACIÓN CON TRAZABILIDAD --
    socket.on('eliminarJurado', (id) => {
      console.log(`\n--- INICIO DE ELIMINACIÓN ---`);
      console.log(`[Servidor] Solicitud de eliminación recibida para el ID:`, id);
      
      const juradoIndex = estadoConcurso.jurados.findIndex(j => j.id === id);
      if (juradoIndex === -1) {
        console.log(`[Servidor] ERROR: No se encontró al jurado en la memoria.`);
        return;
      }

      // 1. Eliminar jurado de la memoria
      estadoConcurso.jurados.splice(juradoIndex, 1);
      console.log(`[Servidor] Jurado borrado. Jurados restantes en el sistema:`, estadoConcurso.jurados.length);
      
      // 2. Limpieza en cascada de sus notas
      let notasBorradas = 0;
      estadoConcurso.grupos.forEach(grupo => {
        const califIndex = grupo.calificaciones.findIndex(c => c.juradoId === id);
        if (califIndex !== -1) {
          grupo.calificaciones.splice(califIndex, 1);
          notasBorradas++;
          
          if (grupo.calificaciones.length === 0) {
            grupo.puntajePromedioFinal = 0;
          } else {
            let sumaTotal = 0;
            grupo.calificaciones.forEach(c => { sumaTotal += c.puntajes.total; });
            grupo.puntajePromedioFinal = sumaTotal / grupo.calificaciones.length;
          }
        }
      });
      
      console.log(`[Servidor] Se purgaron ${notasBorradas} calificaciones de este jurado de todos los grupos.`);
      console.log(`--- FIN DE ELIMINACIÓN ---\n`);
      
      io.emit('estadoActualizado', estadoConcurso);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Sistema inicializado y escuchando en http://${hostname}:${port}`);
  });
});