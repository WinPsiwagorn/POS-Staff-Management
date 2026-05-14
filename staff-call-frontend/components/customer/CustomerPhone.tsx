'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { PALETTE, REQUEST_TYPES, TABLE_BY_ID, TABLE_BY_OBJECT_ID, COOLDOWN_MS } from '@/lib/constants';
import { createCall, getActiveCalls } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  IcBell, IcCheck, IcUser, IcClock, IcChat,
  ICON_BY_TYPE,
} from '@/components/icons';
import type { Call, RequestTypeDef } from '@/lib/types';

// ── Elapsed helper ────────────────────────────────────────────────

function elapsedString(isoDate: string, now: number): string {
  const s = Math.max(0, Math.floor((now - new Date(isoDate).getTime()) / 1000));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60), r = s % 60;
  return m + 'm ' + String(r).padStart(2, '0') + 's';
}

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ── Request button ────────────────────────────────────────────────

function RequestButton({ type, cooldown, onPick }: {
  type: RequestTypeDef;
  cooldown: number;
  onPick: (id: string) => void;
}) {
  const Icon = ICON_BY_TYPE[type.id] ?? IcBell;
  const isUrgent = type.id === 'urgent';
  const isCooling = cooldown > 0;

  let bg: string, fg: string, iconBg: string, iconFg: string, sub: string, shadow: string, border: string;

  if (isCooling) {
    bg = PALETTE.sand; fg = PALETTE.ink;
    iconBg = 'rgba(44,32,26,0.10)'; iconFg = PALETTE.ink;
    sub = 'rgba(44,32,26,0.65)'; shadow = 'inset 0 0 0 1px rgba(44,32,26,0.06)'; border = 'none';
  } else if (isUrgent) {
    bg = PALETTE.rust; fg = '#fff';
    iconBg = 'rgba(255,255,255,0.18)'; iconFg = '#fff';
    sub = 'rgba(255,255,255,0.78)'; shadow = '0 6px 18px rgba(138,58,25,0.30)'; border = 'none';
  } else {
    bg = PALETTE.terracotta; fg = '#fff';
    iconBg = 'rgba(255,255,255,0.18)'; iconFg = '#fff';
    sub = 'rgba(255,255,255,0.78)'; shadow = '0 4px 14px rgba(184,92,49,0.22)'; border = 'none';
  }

  return (
    <button
      onClick={() => !isCooling && onPick(type.id)}
      aria-disabled={isCooling}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        textAlign: 'left', padding: 14, height: 134,
        borderRadius: 16, border,
        background: bg, color: fg,
        boxShadow: shadow,
        cursor: isCooling ? 'default' : 'pointer',
        pointerEvents: isCooling ? 'none' : 'auto',
        transition: 'transform .12s ease, background .25s ease, color .25s ease, box-shadow .25s ease',
        fontFamily: 'inherit', width: '100%',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: iconBg, color: iconFg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isCooling
          ? <IcCheck size={22} stroke={iconFg} sw={2.4}/>
          : <Icon size={22} stroke={iconFg} sw={1.9}/>}
      </div>
      <div>
        <div style={{
          fontSize: 16.5, lineHeight: 1.15, color: fg,
          fontWeight: 600, letterSpacing: '-0.01em',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {isCooling && <IcCheck size={14} stroke={fg} sw={2.6}/>}
          {isCooling ? 'Notified' : type.label}
        </div>
        <div style={{ marginTop: 3, fontSize: 11.5, color: sub, fontWeight: 500 }}>
          {isCooling ? `Sent · wait ${cooldown}s` : type.sub}
        </div>
      </div>
    </button>
  );
}

// ── Active request status card ─────────────────────────────────

function CustomerStatusCard({ call, now, onCancel }: { call: Call; now: number; onCancel: () => void }) {
  const isAssigned = call.status === 'assigned';
  const isUrgent = call.type === 'urgent_help';
  const Icon = ICON_BY_TYPE[call.type] ?? IcBell;
  const cardBg = isAssigned ? PALETTE.terracotta : PALETTE.rust;
  const eyebrow = isAssigned ? 'On the way' : (isUrgent ? 'Urgent · sent' : 'Request sent');

  return (
    <div style={{
      margin: '14px 22px', padding: 16, borderRadius: 16,
      background: cardBg, color: '#fff', border: 'none',
      boxShadow: isAssigned ? '0 6px 20px rgba(184,92,49,0.28)' : '0 6px 20px rgba(138,58,25,0.28)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(255,255,255,0.20)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.18)',
          animation: isAssigned ? 'none' : 'pulse-ring 1.6s infinite',
        }}>
          <Icon size={22} stroke="#fff" sw={1.9}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)', fontWeight: 700 }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: 18, lineHeight: 1.2, marginTop: 3, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {isAssigned ? `${call.assigned_staff ?? 'Your server'} is coming over` : REQUEST_TYPES.find(t => t.backendType === call.type)?.label ?? call.type}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 12, paddingTop: 12,
        borderTop: '1px solid rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 12, color: 'rgba(255,255,255,0.78)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IcClock size={13} stroke="rgba(255,255,255,0.78)" sw={1.9}/>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#fff' }}>
            {elapsedString(call.created_at, now)}
          </span>
          <span style={{ opacity: .75 }}>· typical wait 1–2m</span>
        </div>
        {!isAssigned && (
          <button onClick={onCancel} style={{
            border: 'none', background: 'transparent', color: '#fff',
            fontSize: 12, fontWeight: 600, padding: 0, cursor: 'pointer',
            textDecoration: 'underline', textUnderlineOffset: 2,
          }}>Cancel</button>
        )}
      </div>

      {call.special_request && (
        <div style={{
          marginTop: 10, padding: '10px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.16)',
          fontSize: 13, color: '#fff', fontStyle: 'italic',
          border: '1px solid rgba(255,255,255,0.18)',
        }}>
          "{call.special_request}"
        </div>
      )}
    </div>
  );
}

// ── Resolved toast ────────────────────────────────────────────────

function ResolvedToast({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', top: 88, left: 22, right: 22, zIndex: 25,
      background: PALETTE.sand, color: PALETTE.ink,
      padding: '12px 14px', borderRadius: 14,
      display: 'flex', alignItems: 'center', gap: 12,
      border: '1px solid ' + PALETTE.sandDeep,
      boxShadow: '0 10px 28px rgba(44,32,26,0.10)',
      animation: 'fade-up .3s ease both',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: PALETTE.ink, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <IcCheck size={17} stroke="#fff" sw={2.4}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: PALETTE.ink }}>Resolved — thanks!</div>
        <div style={{ fontSize: 11.5, color: PALETTE.ink2, marginTop: 1 }}>
          Tap a card below if you need anything else.
        </div>
      </div>
    </div>
  );
}

// ── Special request bottom sheet ───────────────────────────────

function SpecialRequestSheet({ open, onClose, onSubmit }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState('');
  useEffect(() => { if (open) setNote(''); }, [open]);
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 30,
      background: 'rgba(44,32,26,0.42)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fade-up .25s ease both',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '22px 22px 28px',
        boxShadow: '0 -10px 30px rgba(0,0,0,.18)',
        border: '1px solid ' + PALETTE.hair,
        borderBottom: 'none',
      }}>
        <div style={{
          width: 40, height: 4, background: PALETTE.hair,
          borderRadius: 2, margin: '-6px auto 14px',
        }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: PALETTE.terracottaBg, color: PALETTE.terracotta,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IcChat size={18} stroke={PALETTE.terracotta} sw={1.9}/>
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: PALETTE.ink }}>
            Send a note
          </h2>
        </div>
        <p style={{ margin: '0 0 14px 46px', fontSize: 12.5, color: PALETTE.muted }}>
          Allergies, modifications, anything special.
        </p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. could we get an extra napkin and a high chair?"
          rows={4}
          style={{
            width: '100%', padding: 14, borderRadius: 12,
            border: '1px solid ' + PALETTE.hair,
            background: PALETTE.canvas, color: PALETTE.ink,
            fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={onClose} style={{
            flex: 1, height: 50, borderRadius: 12, border: '1px solid ' + PALETTE.hair,
            background: '#fff', color: PALETTE.ink, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button
            onClick={() => { if (note.trim()) { onSubmit(note.trim()); onClose(); } }}
            style={{
              flex: 1.4, height: 50, borderRadius: 12, border: 'none',
              background: PALETTE.terracotta, color: '#fff', fontSize: 14, fontWeight: 600,
              opacity: note.trim() ? 1 : 0.45, cursor: note.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit',
            }}>
            Send note
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main customer phone ────────────────────────────────────────

export default function CustomerPhone({ tableId }: { tableId: string }) {
  const table = TABLE_BY_ID[tableId];
  const [activeCalls, setActiveCalls] = useState<Call[]>([]);
  const [recentlyResolved, setRecentlyResolved] = useState(false);
  const [cooldownStarts, setCooldownStarts] = useState<Record<string, number>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const now = useNow();
  const resolvedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Initial fetch of active calls for this table
  useEffect(() => {
    if (!table) return;
    getActiveCalls()
      .then(calls => setActiveCalls(calls.filter(c => c.table_id === table.objectId)))
      .catch(console.error);
  }, [table]);

  // WebSocket: track this table's calls
  useWebSocket(useCallback(({ type, payload }) => {
    if (!table || payload.table_id !== table.objectId) return;
    if (type === 'call_created') {
      setActiveCalls(cs => cs.some(c => c.id === payload.id) ? cs : [...cs, payload]);
    } else if (type === 'call_assigned') {
      setActiveCalls(cs => cs.map(c => c.id === payload.id ? payload : c));
    } else if (type === 'call_resolved') {
      setActiveCalls(cs => cs.filter(c => c.id !== payload.id));
      setRecentlyResolved(true);
      clearTimeout(resolvedTimerRef.current);
      resolvedTimerRef.current = setTimeout(() => setRecentlyResolved(false), 4000);
    }
  }, [table]));

  const cooldowns = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(cooldownStarts).forEach(([typeId, ts]) => {
      const remain = Math.max(0, COOLDOWN_MS - (now - ts));
      if (remain > 0) map[typeId] = Math.ceil(remain / 1000);
    });
    return map;
  }, [cooldownStarts, now]);

  // Most recent active call for this table
  const activeCall = activeCalls[0] ?? null;

  const onPick = async (typeId: string) => {
    if (!table) return;
    if (typeId === 'special') { setSheetOpen(true); return; }
    const requestType = REQUEST_TYPES.find(t => t.id === typeId);
    if (!requestType) return;
    setCooldownStarts(c => ({ ...c, [typeId]: Date.now() }));
    try {
      await createCall({
        table_id: table.objectId,
        table_label: table.label,
        type: requestType.backendType,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const onSubmitNote = async (note: string) => {
    if (!table) return;
    setCooldownStarts(c => ({ ...c, special: Date.now() }));
    try {
      await createCall({
        table_id: table.objectId,
        table_label: table.label,
        type: 'special',
        special_request: note,
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!table) {
    return (
      <div style={{
        minHeight: '100vh', background: PALETTE.canvas,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
        color: PALETTE.ink, padding: 24, textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Table not found</div>
          <div style={{ fontSize: 14, color: PALETTE.muted, marginTop: 8 }}>
            Check the URL — table &ldquo;{tableId}&rdquo; is not configured.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: PALETTE.canvas,
      color: PALETTE.ink, paddingBottom: 40, position: 'relative',
      fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
      maxWidth: 480, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '60px 22px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: PALETTE.ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700,
          }}>C</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: PALETTE.ink }}>The Café</div>
        </div>
        <div style={{
          padding: '6px 12px', borderRadius: 999,
          background: '#fff', border: '1px solid ' + PALETTE.hair,
          color: PALETTE.ink2, fontSize: 11, letterSpacing: '0.06em',
          textTransform: 'uppercase', fontWeight: 600,
        }}>
          Table {table.label}
        </div>
      </div>

      <ResolvedToast show={recentlyResolved}/>

      {/* Hero */}
      <div style={{ padding: '24px 22px 6px' }}>
        <div style={{ color: PALETTE.muted, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
          Service · Table {table.label}
        </div>
        <h1 style={{
          margin: '10px 0 8px', fontSize: 32, lineHeight: 1.08,
          fontWeight: 700, letterSpacing: '-0.025em', color: PALETTE.ink,
        }}>
          How can we help?
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: PALETTE.muted, maxWidth: 300 }}>
          Tap a request below — your server will be notified instantly.
        </p>
      </div>

      {/* Active call card */}
      {activeCall && (
        <CustomerStatusCard
          call={activeCall} now={now}
          onCancel={() => setActiveCalls(cs => cs.filter(c => c.id !== activeCall.id))}
        />
      )}

      {/* Request grid */}
      <div style={{
        padding: '8px 22px 24px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
      }}>
        {REQUEST_TYPES.map(type => (
          <RequestButton
            key={type.id}
            type={type}
            cooldown={cooldowns[type.id] ?? 0}
            onPick={onPick}
          />
        ))}
      </div>

      {/* Staff info strip */}
      <div style={{
        margin: '4px 22px 0', padding: 12,
        background: '#fff', borderRadius: 12,
        border: '1px solid ' + PALETTE.hair,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: PALETTE.sand, color: PALETTE.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IcUser size={17} stroke={PALETTE.ink} sw={1.9}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, color: PALETTE.ink, fontWeight: 600 }}>
            Your section · Marina &amp; Hugo
          </div>
          <div style={{ fontSize: 11, color: PALETTE.muted, marginTop: 1 }}>
            Avg response today · <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: PALETTE.ink2 }}>42s</span>
          </div>
        </div>
      </div>

      <SpecialRequestSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={onSubmitNote}
      />
    </div>
  );
}
