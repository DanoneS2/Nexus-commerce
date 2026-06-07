import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'CUSTOMER' | 'MODERATOR' | 'ADMIN' | 'SUPERADMIN';
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
        // Update API instance header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },

      setUser: (user) => set({ user }),

      logout: async () => {
        const { refreshToken } = get();
        try {
          await api.post('/auth/logout', { refreshToken });
        } catch {
          // Still clear local state even if server fails
        }
        delete api.defaults.headers.common['Authorization'];
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const { data } = await api.post('/auth/refresh', { refreshToken });
          const { accessToken: newAccess, refreshToken: newRefresh } = data.data;
          get().setTokens(newAccess, newRefresh);
          return true;
        } catch {
          // Refresh failed — force logout
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      fetchProfile: async () => {
        try {
          const { data } = await api.get('/users/me');
          set({ user: data.data });
        } catch {
          // Token may be expired
        }
      },
    }),
    {
      name: 'nexus-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
