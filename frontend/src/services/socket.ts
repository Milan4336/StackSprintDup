import { Socket, io } from 'socket.io-client';

let socket: Socket | null = null;

const resolveSocketUrl = (): string => {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicit) return explicit;

  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8080/api/v1';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
};

export const connectSocket = (): Socket => {
  if (socket) return socket;

  const token = localStorage.getItem('token');
  socket = io(resolveSocketUrl(), {
    transports: ['websocket'],
    auth: token ? { token } : undefined
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

export const getSocket = (): Socket | null => socket;
