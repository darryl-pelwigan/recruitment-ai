import { create } from "zustand";
import { api } from "../api/api";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (full_name: string, email: string, password: string, role: string) => Promise<void>;
  updateUser: (updated: User) => void;
  logout: () => void;
}

const storedUser = localStorage.getItem("user");

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!localStorage.getItem("token"),

  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { access_token, user } = res.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token: access_token, user, isAuthenticated: true });
  },

  register: async (full_name, email, password, role) => {
    await api.post("/auth/register", { full_name, email, password, role });
  },

  updateUser: (updated) => {
    localStorage.setItem("user", JSON.stringify(updated));
    set({ user: updated });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
