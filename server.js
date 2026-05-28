const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Estado global en memoria (Nuestra "Base de Datos")
let estadoConcurso = {
  administradorAutenticado: false,
  jurados: [], // Estructura: { id, nombre, aceptado }
  grupos: [],  // Estructura: { id, nombre, calificaciones, puntajePromedioFinal }
  eventoActivo: false
};

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    console.log(`[Socket] Cliente conectado: ${socket.id}`);

    // Al conectarse, enviamos el estado actual
    socket.emit('estadoActualizado', estadoConcurso);

    socket.on('disconnect', () => {
      console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    });
    // -- EVENTOS DE GRUPOS --
    socket.on('agregarGrupo', (nombre) => {
      const nuevoGrupo = { 
        id: Date.now().toString(), 
        nombre, 
        calificaciones: [], 
        puntajePromedioFinal: 0 
      };
      estadoConcurso.grupos.push(nuevoGrupo);
      io.emit('estadoActualizado', estadoConcurso);
    });

    socket.on('eliminarGrupo', (id) => {
      estadoConcurso.grupos = estadoConcurso.grupos.filter(g => g.id !== id);
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
  });

  httpServer.listen(port, () => {
    console.log(`> Sistema inicializado y escuchando en http://${hostname}:${port}`);
  });
});