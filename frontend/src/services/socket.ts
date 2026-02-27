import { Socket, io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io(API_URL, {
      transports: ['websocket'],
      auth: token ? { token } : undefined
    });
  }
  return socket;
};

export const connectSocket = (): Socket => {
  return getSocket();
};

export const disconnectSocket = (): void => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

export const updateSocketAuth = (token: string | null): void => {
  if (!socket) return;

  if (token) {
    socket.auth = { token };
    // Force a full connection bounce to re-run auth middleware
    socket.disconnect().connect();
  } else {
    socket.auth = {};
    socket.disconnect();
  }
};
