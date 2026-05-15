'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import type { Call } from '@/lib/types';
import { getWsBaseUrl } from '@/lib/network';

export interface WSEvent {
  type: 'call_created' | 'call_assigned' | 'call_resolved' | 'call_cancelled';
  payload: Call;
}

export function useWebSocket(onEvent: (e: WSEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const emitEvent = useEffectEvent(onEvent);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const url = getWsBaseUrl() + '/ws';
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as WSEvent;
          emitEvent(event);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        // reconnect after 2 s if not intentionally closed
        if (wsRef.current !== null) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      const ws = wsRef.current;
      wsRef.current = null;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);
}
