const BASE = '/api';

async function request(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSessions() {
  const data = await request('/sessions');
  return data.sessions;
}

export async function fetchSessionEvents(sessionId) {
  const data = await request(`/sessions/${encodeURIComponent(sessionId)}/events`);
  return data.events;
}

export async function fetchHeatmap(pageUrl) {
  const data = await request(`/heatmap?url=${encodeURIComponent(pageUrl)}`);
  return data;
}

export async function fetchHealth() {
  return request('/health');
}
