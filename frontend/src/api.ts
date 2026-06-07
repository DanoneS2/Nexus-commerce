import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Inject auth token from store
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexus-auth');
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.accessToken) {
            config.headers['Authorization'] = `Bearer ${state.accessToken}`;
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Add request ID for tracing
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor (Token Refresh) ────────────────────────────────────
let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  pendingRequests.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  pendingRequests = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const stored = localStorage.getItem('nexus-auth');
        if (!stored) throw new Error('No auth state');

        const { state } = JSON.parse(stored);
        if (!state?.refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: state.refreshToken,
        });

        const { accessToken, refreshToken: newRefresh } = data.data;

        // Update localStorage
        const updatedState = { ...state, accessToken, refreshToken: newRefresh };
        localStorage.setItem('nexus-auth', JSON.stringify({ state: updatedState }));

        // Update axios header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        // Clear auth state
        localStorage.removeItem('nexus-auth');
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=1';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Typed API helpers ────────────────────────────────────────────────────────
export const apiHelpers = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: T }>(url, { params }),

  post: <T>(url: string, body?: unknown) =>
    api.post<{ success: boolean; data: T; message?: string }>(url, body),

  put: <T>(url: string, body?: unknown) =>
    api.put<{ success: boolean; data: T; message?: string }>(url, body),

  patch: <T>(url: string, body?: unknown) =>
    api.patch<{ success: boolean; data: T; message?: string }>(url, body),

  delete: <T>(url: string) =>
    api.delete<{ success: boolean; data: T; message?: string }>(url),
};
