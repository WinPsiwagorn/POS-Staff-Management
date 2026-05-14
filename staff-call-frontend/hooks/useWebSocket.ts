'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Call } from '@/lib/types';

export interface WSEvent {
  type: 'call_created' | 'call_assigned' | 'call_resolved';
  payload: Call;
}

export function useWebSocket(onEvent: (e: WSEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    const url = (process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8080') + '/ws';
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as WSEvent;
        onEventRef.current(event);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      // reconnect after 2 s if not intentionally closed
      if (wsRef.current !== null) {
        setTimeout(connect, 2000);
      }
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
    };
  }, [connect]);
}
