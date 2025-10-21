// src/lib/api.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Use different base URLs for browser vs. SSR
const isBrowser = typeof window !== 'undefined';
const BASE_URL = isBrowser
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333')
  : (process.env.API_URL_SERVER || process.env.NEXT_PUBLIC_API_URL || 'http://server:3333');

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    // Pegamos o estado do store
    const { token } = useAuthStore.getState();
    
    // --- DEBUG LOG ---
    console.log('[API Interceptor] Token sendo enviado:', token ? `Bearer ${token.substring(0, 15)}...` : 'Nenhum token');
    // --- FIM DEBUG LOG ---

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
