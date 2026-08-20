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

function publicMessage(message: string, status: number) {
  const pt = getCurrentLanguage() === 'pt';
  if (status >= 500) return pt ? 'O Koino está temporariamente indisponível. Tente novamente dentro de instantes.' : 'Koino is temporarily unavailable. Please try again in a moment.';
  const technical = /exception|stack|hibernate|jdbc|sql|cloudinary|gemini|\bapi\b|client id|developer_error|internal server|\bfailed\b|\bfailure\b|\berror\b|network request|java\.|org\.spring|https?:\/\/|econn|timeout/i;
  if (!message || technical.test(message)) return pt ? 'Não foi possível concluir esta ação agora. Tente novamente.' : 'We could not complete that action right now. Please try again.';
  return message;
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
  } catch {
    const pt = getCurrentLanguage() === 'pt';
    throw new ApiError(
      pt ? 'Parece que está sem ligação. Verifique a internet e tente novamente.' : 'You appear to be offline. Check your connection and try again.',
      0,
      null,
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
          : getCurrentLanguage() === 'pt' ? 'Esta ação precisa de um momento. Tente novamente.' : 'This action needs a moment. Please try again.';
    throw new ApiError(publicMessage(message, response.status), response.status, null);
  }

  return payload as T;
}
