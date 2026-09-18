export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

/**
 * The single place that talks to the auth endpoints. Uses cookie-based
 * sessions (credentials: 'include') to match B2/B3 — the server sets an
 * HTTP-only session cookie on login, so there's no token to store client-side.
 */
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

  login: (email: string, password: string): Promise<AuthUser> =>
    authRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: (): Promise<void> => authRequest('/auth/logout', { method: 'POST' }),

  // B3: "Forgot password" email. The backend should always respond success
  // here regardless of whether the email exists, so this call never reveals
  // which emails are registered.
  forgotPassword: (email: string): Promise<void> =>
    authRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // B3: invite links expire after 48 hours and work once — the token comes
  // from the ?invite= URL param and is validated server-side.
  acceptInvite: (token: string, password: string): Promise<AuthUser> =>
    authRequest('/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};
