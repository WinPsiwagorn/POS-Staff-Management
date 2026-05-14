'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getActiveCalls, assignCall, resolveCall } from '@/lib/api';
import { useWebSocket } from './useWebSocket';
import { TABLE_BY_OBJECT_ID, DEFAULT_STAFF, RESOLVED_TTL_MS } from '@/lib/constants';
import type { Call, TableGroup, TableState, Toast } from '@/lib/types';

function computeTableState(calls: Call[]): TableState {
  const pending  = calls.filter(c => c.status === 'pending');
  const urgent   = pending.some(c => c.type === 'urgent_help');
  if (urgent)           return 'urgent';
  if (pending.length)   return 'inCall';
  if (calls.some(c => c.status === 'assigned')) return 'inProgress';
  return 'idle';
}

function groupActive(activeCalls: Call[]): TableGroup[] {
  const map = new Map<string, Call[]>();
  activeCalls.forEach(c => {
    const arr = map.get(c.table_id) ?? [];
    arr.push(c);
    map.set(c.table_id, arr);
  });
  return [...map.entries()].map(([objectId, calls]) => {
    const table = TABLE_BY_OBJECT_ID[objectId];
    return {
      tableId: table?.id ?? objectId,
      objectId,
      requests: calls,
      state: computeTableState(calls),
      oldest: Math.min(...calls.map(c => new Date(c.created_at).getTime())),
    };
  });
}

export function useCallStore() {
  const [activeCalls, setActiveCalls]   = useState<Call[]>([]);
  const [resolvedCalls, setResolvedCalls] = useState<Call[]>([]);
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const seenIds = useRef<Set<string>>(new Set());

  // Initial load
  useEffect(() => {
    getActiveCalls()
      .then(calls => {
        setActiveCalls(calls);
        calls.forEach(c => seenIds.current.add(c.id));
      })
      .catch(console.error);
  }, []);

  // Purge resolved calls older than TTL
  useEffect(() => {
    const id = setInterval(() => {
      const cutoff = Date.now() - RESOLVED_TTL_MS;
      setResolvedCalls(rs => rs.filter(r =>
        new Date(r.resolved_at!).getTime() > cutoff
      ));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const pushToast = useCallback((call: Call) => {
    const toast: Toast = {
      id: call.id + '-toast-' + Date.now(),
      tableLabel: TABLE_BY_OBJECT_ID[call.table_id]?.label ?? call.table_label,
      label: call.type.replace(/_/g, ' '),
      urgent: call.type === 'urgent_help',
      typeId: call.type,
    };
    setToasts(ts => [...ts, toast]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== toast.id)), 4500);
  }, []);

  useWebSocket(useCallback(({ type, payload }) => {
    if (type === 'call_created') {
      if (!seenIds.current.has(payload.id)) {
        seenIds.current.add(payload.id);
        setActiveCalls(cs => [...cs, payload]);
        pushToast(payload);
      }
    } else if (type === 'call_assigned') {
      setActiveCalls(cs =>
        cs.map(c => c.id === payload.id ? payload : c)
      );
    } else if (type === 'call_resolved') {
      setActiveCalls(cs => cs.filter(c => c.id !== payload.id));
      setResolvedCalls(rs => [payload, ...rs]);
    }
  }, [pushToast]));

  const ackCall = useCallback(async (callId: string) => {
    try {
      const updated = await assignCall(callId, DEFAULT_STAFF.id, DEFAULT_STAFF.name);
      setActiveCalls(cs => cs.map(c => c.id === updated.id ? updated : c));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const ackTable = useCallback(async (objectId: string) => {
    const pending = activeCalls.filter(
      c => c.table_id === objectId && c.status === 'pending'
    );
    await Promise.all(pending.map(c => ackCall(c.id)));
  }, [activeCalls, ackCall]);

  const doneCall = useCallback(async (callId: string) => {
    try {
      const updated = await resolveCall(callId);
      setActiveCalls(cs => cs.filter(c => c.id !== updated.id));
      setResolvedCalls(rs => [updated, ...rs]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const doneTable = useCallback(async (objectId: string) => {
    const calls = activeCalls.filter(c => c.table_id === objectId);
    await Promise.all(calls.map(c => doneCall(c.id)));
  }, [activeCalls, doneCall]);

  const groups = useMemo(() => groupActive(activeCalls), [activeCalls]);

  const counts = useMemo(() => ({
    inCall:     groups.filter(g => g.state === 'inCall' || g.state === 'urgent').length,
    inProgress: groups.filter(g => g.state === 'inProgress').length,
    resolved:   resolvedCalls.length,
  }), [groups, resolvedCalls]);

  return {
    activeCalls,
    resolvedCalls,
    groups,
    counts,
    toasts,
    ackCall,
    ackTable,
    doneCall,
    doneTable,
  };
}
