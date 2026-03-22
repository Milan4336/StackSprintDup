import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AuthUser } from '../types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setToken: (token: string) => void;
  logout: () => void;
}

const parseJwt = (token: string): AuthUser | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized)) as AuthUser;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token: string) => {
        set({ token, user: parseJwt(token) });
      },
      logout: () => {
        set({ token: null, user: null });
      }
    }),
    {
      name: 'fraud-auth',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
