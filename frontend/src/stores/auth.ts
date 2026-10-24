import { create } from 'zustand';

export type Rol =
  | 'administrador_general'
  | 'gerente_sucursal'
  | 'jefe_produccion'
  | 'encargado_cierre'
  | 'encargado_logistica'
  | 'auditor';

export interface AuthUser {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  sucursalId: string | null;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null });
  },
}));
