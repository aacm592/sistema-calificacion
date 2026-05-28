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

    // -- EN LA SECCIÓN DE EVENTOS DE GRUPOS --
    socket.on('editarGrupo', ({ id, nuevoNombre }) => {
      // Usamos .map para crear una nueva referencia en memoria (Inmutabilidad)
      estadoConcurso.grupos = estadoConcurso.grupos.map(g => 
        g.id === id ? { ...g, nombre: nuevoNombre } : g
      );
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

    // -- NUEVOS EVENTOS DE JURADOS --
    // -- EN LA SECCIÓN DE EVENTOS DE JURADOS --
    socket.on('solicitarUnion', (datos) => {
      const juradoId = datos.id; // Ahora recibimos el ID persistente desde el cliente
      
      const existe = estadoConcurso.jurados.find(j => j.id === juradoId);
      
      if (!existe) {
        const nuevoJurado = {
          id: juradoId,
          nombre: datos.nombre,
          foto: datos.foto || '',
          aceptado: false
        };
        estadoConcurso.jurados.push(nuevoJurado);
      } else {
        // Si el jurado ya existe (recargó la página), actualizamos sus datos
        existe.nombre = datos.nombre;
        if (datos.foto) existe.foto = datos.foto;
      }
      
      io.emit('estadoActualizado', estadoConcurso);
    });

    socket.on('enviarCalificacion', ({ juradoId, grupoId, puntajes }) => {
      const grupo = estadoConcurso.grupos.find(g => g.id === grupoId);
      const jurado = estadoConcurso.jurados.find(j => j.id === juradoId);

      if (grupo && jurado) {
        // Buscar si el jurado ya había calificado a este grupo para actualizar o insertar
        const index = grupo.calificaciones.findIndex(c => c.juradoId === juradoId);
        const nuevaCalificacion = { juradoId, nombre: jurado.nombre, puntajes };
        
        if (index !== -1) {
          grupo.calificaciones[index] = nuevaCalificacion;
        } else {
          grupo.calificaciones.push(nuevaCalificacion);
        }

        // Sumatoria y promedio automático
        let sumaTotal = 0;
        grupo.calificaciones.forEach(c => {
          sumaTotal += c.puntajes.total;
        });
        // Calculamos el promedio dividiendo la suma total entre la cantidad de jurados que han calificado
        grupo.puntajePromedioFinal = sumaTotal / grupo.calificaciones.length;

        io.emit('estadoActualizado', estadoConcurso);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Sistema inicializado y escuchando en http://${hostname}:${port}`);
  });
});