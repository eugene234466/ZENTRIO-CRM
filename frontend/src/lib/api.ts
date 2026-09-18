const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ??
      (data as { msg?: string } | null)?.msg ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export const api = {
  signup: (input: { username: string; email: string; password: string }) =>
    request<{ msg: string; username: string; email: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  login: (input: { username: string; password: string }) =>
    request<{ msg: string; username: string; role: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  me: () => request<AuthUser>('/auth/me'),

  logout: () => request<{ msg: string }>('/auth/logout', { method: 'POST' }),

  notifications: () =>
    request<{ notifications: AppNotification[] }>('/api/notifications'),

  markNotificationRead: (id: number) =>
    request<{ msg: string }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<{ msg: string }>('/api/notifications/read-all', { method: 'PATCH' }),

  search: (q: string) =>
    request<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`),
};

export interface SearchResult {
  type: 'client' | 'lead' | 'invoice';
  id: number;
  title: string;
  subtitle: string;
  link: string;
}

export interface AppNotification {
  id: number;
  kind: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string | null;
}
