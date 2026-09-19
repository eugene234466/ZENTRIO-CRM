export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

export async function authRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

export const authApi = {
  me: (): Promise<AuthUser> => authRequest('/auth/me'),

  login: (username: string, password: string): Promise<AuthUser> =>
    authRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: (): Promise<void> => authRequest('/auth/logout', { method: 'POST' }),

  forgotPassword: (email: string): Promise<void> =>
    authRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  acceptInvite: (token: string, password: string): Promise<AuthUser> =>
    authRequest('/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};