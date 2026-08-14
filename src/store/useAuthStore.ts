import { create } from 'zustand';

interface AuthState {
  token: string | null;
  username: string | null;
  name: string | null;
  roles: string[];
  setAuth: (token: string, username: string, name: string, roles: string[]) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  name: localStorage.getItem('name'),
  roles: JSON.parse(localStorage.getItem('roles') || '[]'),

  setAuth: (token, username, name, roles) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('name', name);
    localStorage.setItem('roles', JSON.stringify(roles));
    set({ token, username, name, roles });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('roles');
    set({ token: null, username: null, name: null, roles: [] });
  },

  isAuthenticated: () => !!get().token,
  hasRole: (role) => get().roles.includes(role),
}));
