export interface SessionUser {
  user_id: number;
  expires_at?: string;
  role?: string;
  nama?: string;
  email?: string;
  username?: string;
  phone?: string | null;
  provider?: string;
  has_password?: boolean;
  [key: string]: unknown;
}

export class AuthError extends Error {
  constructor(public status: number) {
    super(status === 403 ? '403 — Akses ditolak. Anda tidak memiliki izin.' : 'Sesi berakhir. Silakan masuk kembali.');
  }
}

type ClientOptions = {
  apiUrl: string;
  origin: string;
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  fetchImpl?: typeof fetch;
  csrfToken?: () => string | null;
  onAuthEvent?: (event: string) => void;
};

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function safeProfile(value: any): SessionUser | null {
  if (!value || !Number.isInteger(value.user_id) || value.user_id <= 0) return null;
  const {
    user_id, expires_at, role, nama, email, username, phone, provider, has_password,
  } = value;
  return {user_id, expires_at, role, nama, email, username, phone, provider, has_password};
}

export function createAuthClient({
  apiUrl, origin, storage, fetchImpl = fetch, csrfToken = () => null,
  onAuthEvent = () => {},
}: ClientOptions) {
  const base = new URL(apiUrl || origin, origin);

  function clearSession() {
    try { storage.removeItem('user'); } catch { /* Storage may be unavailable. */ }
    onAuthEvent('changed');
  }

  function readSession(): SessionUser | null {
    try {
      const user = safeProfile(JSON.parse(storage.getItem('user') || 'null'));
      if (user) return user;
      storage.removeItem('user');
    } catch { /* Malformed or inaccessible storage is not authentication. */ }
    return null;
  }

  function saveSession(value: unknown): SessionUser {
    const user = safeProfile(value);
    if (!user) throw new Error('Respons sesi tidak valid. Silakan masuk kembali.');
    storage.setItem('user', JSON.stringify(user));
    onAuthEvent('changed');
    return user;
  }

  async function request(input: string | URL, init: RequestInit = {}, authenticated = true) {
    const url = new URL(input, base);
    const headers = new Headers(init.headers);
    headers.delete('Authorization');
    const sameBackend = url.origin === base.origin;
    const method = (init.method || 'GET').toUpperCase();
    if (sameBackend && MUTATING_METHODS.has(method)) {
      const token = csrfToken();
      if (token) headers.set('X-CSRF-Token', token);
    }
    const response = await fetchImpl(url.href, {
      ...init,
      headers,
      credentials: sameBackend ? 'include' : 'omit',
      redirect: 'error',
    });
    if (authenticated && sameBackend && (response.status === 401 || response.status === 403)) {
      if (response.status === 401) clearSession();
      onAuthEvent(response.status === 401 ? 'unauthorized' : 'forbidden');
      throw new AuthError(response.status);
    }
    return response;
  }

  const apiFetch = (input: string | URL, init?: RequestInit) => request(input, init);
  const publicFetch = (input: string | URL, init?: RequestInit) => request(input, init, false);

  async function validateSession(): Promise<SessionUser | null> {
    const current = readSession();
    const response = await apiFetch('/api/auth/me');
    if (!response.ok) throw new AuthError(response.status);
    const user = await response.json();
    if (current && user.user_id !== current.user_id) clearSession();
    return saveSession({...current, ...user});
  }

  async function logout() {
    try {
      const response = await apiFetch('/api/logout', {method: 'POST'});
      if (!response.ok) throw new Error('Pencabutan sesi server gagal.');
    } finally {
      clearSession();
    }
  }

  return {apiFetch, publicFetch, readSession, saveSession, clearSession, validateSession, logout};
}

const API_URL = typeof window !== 'undefined'
  ? ((import.meta as any).env?.VITE_API_URL || '') as string
  : '';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

export const authClient = typeof window !== 'undefined'
  ? createAuthClient({
      apiUrl: API_URL,
      origin: window.location.origin,
      storage: localStorage,
      csrfToken: () => readCookie('plantvision_csrf'),
    })
  : (null as unknown as ReturnType<typeof createAuthClient>);

export function getStoredUser(): SessionUser | null {
  return authClient?.readSession() ?? null;
}

export function saveStoredUser(data: unknown): SessionUser {
  return authClient.saveSession(data);
}

export function removeStoredUser(): void {
  authClient?.clearSession();
}

/** Legacy callers no longer receive a bearer token; cookies authenticate requests. */
export function getAuthHeaders(): Record<string, string> {
  return {};
}

let _interceptorInstalled = false;

/**
 * Menjaga pemanggilan fetch lama tetap kompatibel dengan autentikasi cookie:
 * kredensial hanya dikirim ke origin backend dan request mutasi membawa CSRF.
 */
export function installAuthInterceptor(): void {
  if (_interceptorInstalled || typeof window === 'undefined') return;
  _interceptorInstalled = true;
  const originalFetch = window.fetch.bind(window);
  const backendOrigin = API_URL
    ? new URL(API_URL, window.location.origin).origin
    : window.location.origin;

  window.fetch = function patchedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    try {
      const url = new URL(
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
        window.location.origin,
      );
      if (url.origin === backendOrigin) {
        const headers = new Headers(init.headers);
        headers.delete('Authorization');
        const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
        if (MUTATING_METHODS.has(method)) {
          const csrf = readCookie('plantvision_csrf');
          if (csrf) headers.set('X-CSRF-Token', csrf);
        }
        return originalFetch(input, {...init, headers, credentials: 'include'});
      }
    } catch { /* URL parsing failed; use a credential-free request below. */ }
    return originalFetch(input, {...init, credentials: 'omit'});
  } as typeof fetch;
}
