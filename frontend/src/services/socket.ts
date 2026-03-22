import { Socket, io } from 'socket.io-client';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const WS_URL = import.meta.env.VITE_WS_URL || rawApiUrl.replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  const token = localStorage.getItem('token');

  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket'],
      auth: token ? { token } : undefined
    });
  } else if (!socket.connected) {
    // If socket exists but is disconnected (e.g., rejected early by server before auth),
    // update the auth payload and explicitly force a reconnect.
    socket.auth = token ? { token } : {};
    socket.connect();
  }

  return socket;
};

export const connectSocket = (): Socket => {
  return getSocket();
};

export const disconnectSocket = (): void => {
  // We keep the socket alive during tab swaps for HUD persistence.
  // Explicit disconnection is handled by updateSocketAuth(null) during logout.
  if (socket && !socket.connected) {
    socket.disconnect();
  }
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
