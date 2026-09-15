export interface SessionUser {
  user_id: number;
  access_token: string;
  expires_at: string;
  role?: string;
  nama?: string;
  email?: string;
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
  onAuthEvent?: (event: string) => void;
};

export function createAuthClient({apiUrl, origin, storage, fetchImpl = fetch, onAuthEvent = () => {}}: ClientOptions) {
  const base = new URL(apiUrl || origin, origin);
  function isSession(user: any): user is SessionUser {
    return !!user && Number.isInteger(user.user_id) && user.user_id > 0 &&
      typeof user.access_token === 'string' && !!user.access_token.trim() &&
      !/\s/.test(user.access_token) && typeof user.expires_at === 'string' &&
      Date.parse(user.expires_at) > Date.now();
  }
  function clearSession() {
    try { storage.removeItem('user'); } catch { /* Storage may be unavailable. */ }
    onAuthEvent('changed');
  }
  function readSession(): SessionUser | null {
    try {
      const user = JSON.parse(storage.getItem('user') || 'null');
      if (isSession(user)) return user;
      storage.removeItem('user');
    } catch { /* Malformed or inaccessible storage is not authentication. */ }
    return null;
  }
  function saveSession(user: unknown): SessionUser {
    if (!isSession(user)) throw new Error('Respons sesi tidak valid. Silakan masuk kembali.');
    storage.setItem('user', JSON.stringify(user));
    onAuthEvent('changed');
    return user;
  }
  async function request(input: string | URL, init: RequestInit = {}, authenticated = true) {
    const url = new URL(input, base);
    const headers = new Headers(init.headers);
    headers.delete('Authorization');
    if (authenticated && url.origin === base.origin) {
      const user = readSession();
      if (user) headers.set('Authorization', `Bearer ${user.access_token}`);
    }
    const response = await fetchImpl(url.href, {...init, headers, credentials: 'omit', redirect: 'error'});
    if (authenticated && url.origin === base.origin && (response.status === 401 || response.status === 403)) {
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
    if (!current) return null;
    const response = await apiFetch('/api/auth/me');
    if (!response.ok) throw new Error('Tidak dapat memvalidasi sesi. Coba lagi.');
    const user = await response.json();
    if (user.user_id !== current.user_id || typeof user.role !== 'string') {
      clearSession();
      throw new AuthError(401);
    }
    // A late response must never resurrect a logged-out or replaced session.
    if (readSession()?.access_token !== current.access_token) return null;
    return saveSession({...user, access_token: current.access_token, expires_at: user.expires_at || current.expires_at});
  }
  async function logout() {
    try {
      if (readSession()) {
        const response = await apiFetch('/api/logout', {method: 'POST'});
        if (!response.ok) throw new Error('Pencabutan sesi server gagal.');
      }
    } finally { clearSession(); }
  }
  return {apiFetch, publicFetch, readSession, saveSession, clearSession, validateSession, logout};
}

// ---------------------------------------------------------------------------
// Browser singleton & convenience helpers
// ---------------------------------------------------------------------------

const API_URL = typeof window !== 'undefined'
  ? ((import.meta as any).env?.VITE_API_URL || '') as string
  : '';

/** Singleton auth client for the browser app. */
export const authClient = typeof window !== 'undefined'
  ? createAuthClient({
      apiUrl: API_URL,
      origin: window.location.origin,
      storage: localStorage,
    })
  : (null as unknown as ReturnType<typeof createAuthClient>);

/** Read the current session user from localStorage, or null. */
export function getStoredUser(): SessionUser | null {
  return authClient?.readSession() ?? null;
}

/** Persist a login response into localStorage. */
export function saveStoredUser(data: unknown): SessionUser {
  return authClient.saveSession(data);
}

/** Remove the session from localStorage. */
export function removeStoredUser(): void {
  authClient?.clearSession();
}

/** Build an Authorization header object for manual fetch calls. */
export function getAuthHeaders(): Record<string, string> {
  const user = getStoredUser();
  if (user) return { Authorization: `Bearer ${user.access_token}` };
  return {};
}

// ---------------------------------------------------------------------------
// Global fetch interceptor
// ---------------------------------------------------------------------------
let _interceptorInstalled = false;

/**
 * Monkey-patches window.fetch so that every request to the backend API
 * origin automatically includes the `Authorization: Bearer <token>` header.
 *
 * This eliminates the need to modify every existing component's fetch calls.
 * Safe to call multiple times — the interceptor is installed only once.
 */
export function installAuthInterceptor(): void {
  if (_interceptorInstalled || typeof window === 'undefined') return;
  _interceptorInstalled = true;

  const _originalFetch = window.fetch.bind(window);

  // Determine the backend base origin. For same-origin deployments (API_URL
  // is empty), this is simply window.location.origin.
  const backendOrigin = API_URL
    ? new URL(API_URL, window.location.origin).origin
    : window.location.origin;

  window.fetch = function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    try {
      const url = new URL(
        typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url,
        window.location.origin,
      );

      // Only attach credentials for requests targeting our backend origin
      if (url.origin === backendOrigin && url.pathname.startsWith('/api/')) {
        const user = getStoredUser();
        if (user) {
          const headers = new Headers((init && init.headers) || {});
          // Don't overwrite if the caller explicitly set an Authorization header
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${user.access_token}`);
          }
          return _originalFetch(input, { ...init, headers });
        }
      }
    } catch {
      // URL parsing failed — fall through to original fetch
    }
    return _originalFetch(input, init);
  } as typeof fetch;
}
