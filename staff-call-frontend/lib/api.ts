import type { Call } from './types';
import { asCallArray } from './callUtils';
import { getApiBaseUrl } from './network';

async function json<T>(res: Response): Promise<T> {
  const raw = await res.text();
  let body: { data?: T; message?: string } | null = null;

  if (raw) {
    try {
      body = JSON.parse(raw) as { data?: T; message?: string };
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    throw new Error(body?.message ?? (raw || res.statusText));
  }

  if (!body || !('data' in body)) {
    throw new Error(raw || 'Invalid API response');
  }

  return body.data as T;
}

export async function getActiveCalls(): Promise<Call[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/calls/active`);
  return asCallArray(await json<Call[] | null>(res));
}

export async function createCall(params: {
  table_id: string;
  table_label: string;
  type: string;
  special_request?: string;
}): Promise<Call> {
  const res = await fetch(`${getApiBaseUrl()}/api/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return json<Call>(res);
}

export async function assignCall(callId: string, staffId: string, staffName: string): Promise<Call> {
  const res = await fetch(`${getApiBaseUrl()}/api/calls/${callId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staff_id: staffId, staff_name: staffName }),
  });
  return json<Call>(res);
}

export async function resolveCall(callId: string): Promise<Call> {
  const res = await fetch(`${getApiBaseUrl()}/api/calls/${callId}/resolve`, {
    method: 'PATCH',
  });
  return json<Call>(res);
}

export async function cancelCall(callId: string): Promise<Call> {
  const cancelRes = await fetch(`${getApiBaseUrl()}/api/calls/${callId}/cancel`, {
    method: 'PATCH',
  });

  if (cancelRes.ok) {
    return json<Call>(cancelRes);
  }

  const cancelText = await cancelRes.clone().text();
  const routeMissing = cancelRes.status === 404
    || cancelRes.status === 405
    || cancelText.includes('Cannot PATCH');

  if (!routeMissing) {
    return json<Call>(cancelRes);
  }

  const resolveRes = await fetch(`${getApiBaseUrl()}/api/calls/${callId}/resolve`, {
    method: 'PATCH',
  });
  return json<Call>(resolveRes);
}
