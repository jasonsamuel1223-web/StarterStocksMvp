import { api, setAccessToken, getAccessToken } from './client';

export interface LoginResponse {
  token: string;
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

/** Store the access token in memory (never in localStorage). */
export function saveTokens(token: string): void {
  setAccessToken(token);
}

/** Clear the in-memory access token.
 *  The HttpOnly refresh cookie is cleared by the logout endpoint. */
export function clearTokens(): void {
  setAccessToken(null);
}

export function getStoredToken(): string | null {
  return getAccessToken();
}

/** Attempt to refresh the access token using the HttpOnly refresh cookie. */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await api.post<{ token: string }>('/api/auth/refresh', {});
    setAccessToken(res.token);
    return res.token;
  } catch {
    return null;
  }
}
