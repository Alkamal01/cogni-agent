const PY_BACKEND_URL: string = (import.meta as any).env?.VITE_PY_BACKEND_URL || '';

function readCookie(name: string): string | null {
  try {
    const nameEQ = name + '=';
    const ca = (typeof document !== 'undefined' ? document.cookie.split(';') : []);
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  } catch {}
  return null;
}

function setCookie(name: string, value: string, days: number = 1) {
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    document.cookie = `${name}=${value};${expires};path=/`;
  } catch {}
}

async function jsonRequest<T>(path: string, method: string, body?: any, token?: string): Promise<T> {
  if (!PY_BACKEND_URL) throw new Error('VITE_PY_BACKEND_URL not configured');
  const res = await fetch(`${PY_BACKEND_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text().catch(() => res.statusText)}`);
  return res.json() as Promise<T>;
}

export const pythonAuthService = {
  async login(email: string, password: string): Promise<{ access_token?: string; refresh_token?: string; user?: any }> {
    const data = await jsonRequest<{ access_token?: string; refresh_token?: string; user?: any }>(
      '/api/auth/login',
      'POST',
      { email, password }
    );
    const access = data.access_token;
    const refresh = (data as any).refresh_token;
    if (access) {
      localStorage.setItem('token', access);
      localStorage.setItem('auth_token', access);
      setCookie('token', access);
    }
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
      setCookie('refresh_token', refresh);
    }
    return data;
  },

  async register(username: string, email: string, password: string): Promise<any> {
    return jsonRequest('/api/auth/register', 'POST', { username, email, password });
  },

  async me(): Promise<any> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || readCookie('token') || undefined;
    return jsonRequest('/api/auth/me', 'GET', undefined, token);
  },

  async refresh(): Promise<{ access_token: string }> {
    const refresh = localStorage.getItem('refresh_token') || readCookie('refresh_token') || '';
    const data = await jsonRequest<{ access_token: string }>(
      '/api/auth/refresh',
      'POST',
      {},
      refresh
    );
    if (data?.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('auth_token', data.access_token);
      setCookie('token', data.access_token);
    }
    return data;
  },

  async requestPasswordReset(email: string): Promise<any> {
    return jsonRequest('/api/auth/forgot-password', 'POST', { email });
  },

  async resetPassword(token: string, password: string): Promise<any> {
    return jsonRequest('/api/auth/reset-password', 'POST', { token, password });
  },

  async verifyEmail(token: string): Promise<any> {
    return jsonRequest('/api/auth/verify', 'POST', { token });
  },

  loginWithGoogle(): void {
    if (!PY_BACKEND_URL) return;
    window.location.href = `${PY_BACKEND_URL}/api/auth/google`;
  },

  logout(): void {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setCookie('token', '', -1);
      setCookie('refresh_token', '', -1);
    } catch {}
  },
};

export default pythonAuthService;


