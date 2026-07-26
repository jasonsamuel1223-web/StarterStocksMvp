import { api } from './client';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: { id: number; username: string; email: string };
  message: string;
}

export interface RegisterResponse extends LoginResponse {}

export function login(email: string, password: string) {
  return api.post<LoginResponse>('/api/auth/login', { email, password });
}

export function register(username: string, email: string, password: string) {
  return api.post<RegisterResponse>('/api/auth/register', { username, email, password });
}

export function logout() {
  return api.post<{ message: string }>('/api/auth/logout', {});
}

export function saveTokens(token: string, refreshToken: string) {
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
}

export function getStoredToken() {
  return localStorage.getItem('token');
}
