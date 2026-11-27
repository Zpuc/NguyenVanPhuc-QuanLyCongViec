const rawOrigin = (
  import.meta.env.VITE_API_ORIGIN as string | undefined
)?.trim();

export const API_ORIGIN = rawOrigin ? rawOrigin.replace(/\/+$/, '') : '';

export const API_BASE_URL = `${API_ORIGIN}/api`;

export const SOCKET_ORIGIN: string | undefined = API_ORIGIN || undefined;

export const resolveMediaUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('/uploads/')) {
    return `${API_ORIGIN}${url}`;
  }
  return url;
};
