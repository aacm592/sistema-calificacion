// src/lib/socketClient.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(); // Se conecta automáticamente al host actual
  }
  return socket;
};