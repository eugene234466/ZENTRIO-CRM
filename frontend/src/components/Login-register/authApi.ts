export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  // Set by the avatar upload endpoint; empty string when unset.
  avatar?: string;
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

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
  });
  if (response.status === 401) {
    return null;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to check session.');
  }
  return data as AuthUser;
}

export const authApi = {
  me: fetchCurrentUser,

  signup: (input: { username: string; email: string; password: string }): Promise<{ msg: string; username: string; email: string }> =>
    authRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // Backend /auth/login only returns { msg, username, role }; fetch /auth/me
  // right after so callers get the full AuthUser (id, username, email, role, avatar).
  login: async (username: string, password: string): Promise<AuthUser> => {
    await authRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    const user = await fetchCurrentUser();
    if (!user) {
      throw new Error('Login succeeded but session could not be established.');
    }
    return user;
  },

  logout: (): Promise<void> => authRequest('/auth/logout', { method: 'POST' }),

  // Settings → Users tab.
  listUsers: (): Promise<{ users: AuthUser[] }> => authRequest('/auth/users'),

  updateRole: (userId: number, role: string): Promise<{ msg: string; user: AuthUser }> =>
    authRequest(`/auth/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  // Uploads the current user's avatar. Returns the refreshed user.
  uploadAvatar: async (file: File): Promise<AuthUser> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/auth/me/avatar`, {
      method: 'POST',
      credentials: 'include',
      // NOTE: no Content-Type — browser sets multipart boundary automatically.
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload avatar.');
    }

    const user = await fetchCurrentUser();
    if (!user) {
      throw new Error('Avatar uploaded but session could not be refreshed.');
    }
    return user;
  },

  // B3: "Forgot password" email.
  forgotPassword: (email: string): Promise<void> =>
    authRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // B3: accept invite.
  acceptInvite: (token: string, password: string): Promise<AuthUser> =>
    authRequest('/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};