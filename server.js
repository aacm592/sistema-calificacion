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
  });

  httpServer.listen(port, () => {
    console.log(`> Sistema inicializado y escuchando en http://${hostname}:${port}`);
  });
});