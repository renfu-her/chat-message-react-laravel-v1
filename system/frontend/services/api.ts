const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

// 認證 API
export const authAPI = {
  register: (name: string, email: string, password: string, token?: string) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      token,
    }),

  login: (email: string, password: string) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: (token: string) =>
    request('/auth/logout', {
      method: 'POST',
      token,
    }),

  getUser: (token: string) =>
    request<any>('/auth/user', {
      method: 'GET',
      token,
    }),
};

// 聊天室 API
export const chatRoomAPI = {
  getAll: (token: string) =>
    request<{
      owned_rooms: any[];
      member_rooms: any[];
      public_rooms: any[];
    }>('/chat-rooms', {
      method: 'GET',
      token,
    }),

  getById: (id: number, token: string) =>
    request<any>(`/chat-rooms/${id}`, {
      method: 'GET',
      token,
    }),

  create: (data: {
    name: string;
    type: 'personal' | 'private' | 'public';
    member_ids?: number[];
  }, token: string) =>
    request<any>('/chat-rooms', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  join: (id: number, token: string) =>
    request(`/chat-rooms/${id}/join`, {
      method: 'POST',
      token,
    }),

  leave: (id: number, token: string) =>
    request(`/chat-rooms/${id}/leave`, {
      method: 'POST',
      token,
    }),

  delete: (id: number, token: string) =>
    request(`/chat-rooms/${id}`, {
      method: 'DELETE',
      token,
    }),
};

// 訊息 API
export const messageAPI = {
  getByChatRoom: (chatRoomId: number, token: string) =>
    request<any[]>(`/chat-rooms/${chatRoomId}/messages`, {
      method: 'GET',
      token,
    }),

  send: async (
    chatRoomId: number,
    data: { content?: string; attachment?: File },
    token: string
  ) => {
    const formData = new FormData();
    if (data.content) {
      formData.append('content', data.content);
    }
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }

    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/chat-rooms/${chatRoomId}/messages`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  },

  markAsRead: (chatRoomId: number, messageId: number, token: string) =>
    request(`/chat-rooms/${chatRoomId}/messages/${messageId}/read`, {
      method: 'POST',
      token,
    }),
};

