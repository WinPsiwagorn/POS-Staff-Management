import type { Call } from './types';

export function asCallArray(value: Call[] | null | undefined): Call[] {
  return Array.isArray(value) ? value : [];
}

export function mergeUniqueCalls(calls: Call[]): Call[] {
  const byId = new Map<string, Call>();

  for (const call of calls) {
    byId.set(call.id, call);
  }

  return [...byId.values()].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
