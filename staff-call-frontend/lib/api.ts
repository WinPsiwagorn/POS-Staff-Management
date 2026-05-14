import type { Call } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

async function json<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) throw new Error(body?.message ?? res.statusText);
  return body.data as T;
}

export async function getActiveCalls(): Promise<Call[]> {
  const res = await fetch(`${BASE}/api/calls/active`);
  return json<Call[]>(res);
}

export async function createCall(params: {
  table_id: string;
  table_label: string;
  type: string;
  special_request?: string;
}): Promise<Call> {
  const res = await fetch(`${BASE}/api/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return json<Call>(res);
}

export async function assignCall(callId: string, staffId: string, staffName: string): Promise<Call> {
  const res = await fetch(`${BASE}/api/calls/${callId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staff_id: staffId, staff_name: staffName }),
  });
  return json<Call>(res);
}

export async function resolveCall(callId: string): Promise<Call> {
  const res = await fetch(`${BASE}/api/calls/${callId}/resolve`, {
    method: 'PATCH',
  });
  return json<Call>(res);
}
