import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io({
      transports: ['websocket'], // Fuerza el uso de WebSockets, eliminando el spam de HTTP XHR
      reconnectionAttempts: 5,   // Limita los intentos de reconexión a 5
      reconnectionDelay: 3000,   // Espera 3 segundos entre cada intento
      autoConnect: true,
    });
  }
  return socket;
};