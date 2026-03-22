import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const encoded = token.split('.')[1];
    if (!encoded) return null;

    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    return payload;
  } catch {
    return null;
  }
};

const isTokenValid = (token: string): boolean => {
  const payload = parseJwtPayload(token);
  if (!payload) return false;

  const exp = payload.exp;
  if (typeof exp !== 'number') return true;

  const nowSeconds = Math.floor(Date.now() / 1000);
  return exp > nowSeconds;
};

const getInitialToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (!isTokenValid(token)) {
    localStorage.removeItem('token');
    return null;
  }

  return token;
};

const initialToken = getInitialToken();

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  isAuthenticated: Boolean(initialToken),
  login: (token: string) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, isAuthenticated: false });
  }
}));
