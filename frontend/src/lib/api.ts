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

export interface BoardMessage {
  id: number;
  content: string;
  author: AuthUser;
  is_pinned: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export const api = {
  // Auth endpoints intentionally live in @/components/Login-register/authApi.
  // Keep this module to app data only (search, notifications).
  notifications: () =>
    request<{ notifications: AppNotification[] }>('/api/notifications'),

  markNotificationRead: (id: number) =>
    request<{ msg: string }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<{ msg: string }>('/api/notifications/read-all', { method: 'PATCH' }),

  search: (q: string) =>
    request<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`),

  messages: () => request<{ messages: BoardMessage[] }>('/api/messages'),

  createMessage: (content: string) =>
    request<BoardMessage>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  updateMessage: (id: number, content: string) =>
    request<BoardMessage>(`/api/messages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),

  deleteMessage: (id: number) =>
    request<{ message: string }>(`/api/messages/${id}`, {
      method: 'DELETE',
    }),

  setMessagePinned: (id: number, isPinned: boolean) =>
    request<BoardMessage>(`/api/messages/${id}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ is_pinned: isPinned }),
    }),
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