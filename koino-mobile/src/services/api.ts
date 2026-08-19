import { API_BASE_URL } from '@/config/env';
import { getCurrentLanguage } from '@/features/localization/language';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    'X-Koino-Language': getCurrentLanguage(),
    ...options.headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    const pt = getCurrentLanguage() === 'pt';
    throw new ApiError(
      pt ? 'Não foi possível ligar ao Koino. Verifique a sua ligação.' : 'Unable to connect to Koino. Check your connection and API address.',
      0,
      error,
    );
  }

  if (response.status === 204) return null as T;

  const contentType = response.headers.get('content-type') || '';
  let payload: unknown = null;
  try {
    payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String(payload.message)
        : typeof payload === 'string' && payload.trim()
          ? payload.trim()
          : getCurrentLanguage() === 'pt' ? 'Ocorreu um erro. Tente novamente.' : 'Something went wrong. Please try again.';
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
