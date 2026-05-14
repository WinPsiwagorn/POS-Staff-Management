function browserHost() {
  if (typeof window === 'undefined') return null;
  return window.location.hostname;
}

export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured;

  const host = browserHost();
  if (host) {
    return `${window.location.protocol}//${host}:8080`;
  }

  return 'http://localhost:8080';
}

export function getWsBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_WS_URL;
  if (configured) return configured;

  const host = browserHost();
  if (host) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${host}:8080`;
  }

  return 'ws://localhost:8080';
}
