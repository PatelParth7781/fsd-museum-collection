const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${BASE_URL}${cleanEndpoint}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (!isFormData && options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      errorMessage = data.message || data.error || errorMessage;
    } catch {
      // response is not json
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

export async function get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
  return request<T>(endpoint, { method: 'GET', params });
}

export async function post<T = any>(endpoint: string, body?: any): Promise<T> {
  return request<T>(endpoint, { method: 'POST', body });
}

export async function put<T = any>(endpoint: string, body?: any): Promise<T> {
  return request<T>(endpoint, { method: 'PUT', body });
}

export async function del<T = any>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' });
}

export const api = {
  get,
  post,
  put,
  del,
  delete: del,
};

export default api;
