'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { PALETTE, TABLES, TABLE_BY_OBJECT_ID, REQUEST_TYPE_BY_BACKEND } from '@/lib/constants';
import { useCallStore } from '@/hooks/useCallStore';
import { playAlertSound } from '@/lib/alertSound';
import {
  IcBell, IcCheck, IcUser, IcSound, IcMute, IcX,
  ICON_BY_TYPE,
} from '@/components/icons';
import type { Call, TableGroup, FilterTab, TableState, Toast } from '@/lib/types';

// ── Helpers ──────────────────────────────────────────────────────

function elapsedString(isoDate: string, now: number): string {
  const s = Math.max(0, Math.floor((now - new Date(isoDate).getTime()) / 1000));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60), r = s % 60;
  return m + 'm ' + String(r).padStart(2, '0') + 's';
}

function elapsedSince(isoDate: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(isoDate).getTime()) / 1000));
}

function useNow() {
  const [now, setNow] = useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const STATE_STYLES: Record<TableState, { bg: string; border: string; ink: string; label: string }> = {
  idle:       { bg: '#fff',              border: PALETTE.hair,        ink: PALETTE.ink,  label: 'Idle'        },
  inProgress: { bg: PALETTE.terracotta, border: PALETTE.terracotta,  ink: '#fff',       label: 'In Progress' },
  inCall:     { bg: PALETTE.rust,       border: PALETTE.rust,        ink: '#fff',       label: 'In Call'     },
  urgent:     { bg: PALETTE.rust,       border: PALETTE.rustDeep,    ink: '#fff',       label: 'Urgent'      },
};

// ── Filter tabs ───────────────────────────────────────────────────

function FilterTabs({ value, onChange, counts }: {
  value: FilterTab;
  onChange: (v: FilterTab) => void;
  counts: Record<string, number>;
}) {
  const tabs: { id: FilterTab; label: string; accent: string }[] = [
    { id: 'inCall',     label: 'In Call',     accent: PALETTE.rust       },
    { id: 'inProgress', label: 'In Progress', accent: PALETTE.terracotta },
    { id: 'resolved',   label: 'Resolved',    accent: PALETTE.sandDeep   },
  ];
  return (
    <div style={{
      display: 'flex', background: PALETTE.canvas,
      border: '1px solid ' + PALETTE.hair,
      borderRadius: 10, padding: 3, gap: 2,
    }}>
      {tabs.map(t => {
        const active = value === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            padding: '7px 13px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: active ? '#fff' : 'transparent',
            boxShadow: active ? '0 1px 3px rgba(44,32,26,0.08)' : 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12.5, fontWeight: 600,
            color: active ? PALETTE.ink : PALETTE.ink2,
            fontFamily: 'inherit',
            transition: 'all .12s ease',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: t.accent,
              animation: (t.id === 'inCall' && counts.inCall > 0) ? 'pulse-ring 1.4s infinite' : 'none',
            }}/>
            {t.label}
            <span style={{
              fontSize: 11, padding: '1px 7px', borderRadius: 999,
              background: active ? t.accent : PALETTE.hair,
              color: active ? '#fff' : PALETTE.ink,
              fontWeight: 700, minWidth: 18, textAlign: 'center',
            }}>{counts[t.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Top bar ───────────────────────────────────────────────────────

function StaffTopbar({ filter, setFilter, counts, muted, setMuted }: {
  filter: FilterTab;
  setFilter: (v: FilterTab) => void;
  counts: Record<string, number>;
  muted: boolean;
  setMuted: (v: boolean) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px',
      borderBottom: '1px solid ' + PALETTE.hair,
      background: '#fff', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: PALETTE.ink, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14,
        }}>C</div>
        <div>
          <div style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: PALETTE.muted, fontWeight: 700 }}>
            Front of House
          </div>
          <div style={{ fontSize: 18, lineHeight: 1.1, fontWeight: 700, color: PALETTE.ink, letterSpacing: '-0.015em' }}>
            The Café · Floor
          </div>
        </div>
      </div>

      <FilterTabs value={filter} onChange={setFilter} counts={counts}/>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => setMuted(!muted)} title={muted ? 'Unmute' : 'Mute alerts'} style={{
          width: 38, height: 38, borderRadius: 10,
          border: '1px solid ' + (muted ? PALETTE.rust : PALETTE.hair),
          background: muted ? PALETTE.rustBg : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          {muted
            ? <IcMute size={18} stroke={PALETTE.rust} sw={2}/>
            : <IcSound size={18} stroke={PALETTE.ink2} sw={1.9}/>}
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12,
          borderLeft: '1px solid ' + PALETTE.hair,
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12.5, color: PALETTE.ink, fontWeight: 600 }}>Diego M.</div>
            <div style={{ fontSize: 10.5, color: PALETTE.muted, marginTop: 1 }}>Dinner service</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: PALETTE.terracotta, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
          }}>DM</div>
        </div>
      </div>
    </div>
  );
}

// ── Request pill ──────────────────────────────────────────────────

function RequestPill({ call, onColored }: { call: Call; onColored: boolean }) {
  const typeDef = REQUEST_TYPE_BY_BACKEND[call.type];
  const Icon = ICON_BY_TYPE[call.type] ?? IcBell;
  const isUrgent = call.type === 'urgent_help';
  const bg = onColored ? 'rgba(255,255,255,0.18)' : (isUrgent ? PALETTE.rust : PALETTE.terracotta);

  return (
    <div title={typeDef?.label ?? call.type} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px 4px 7px', borderRadius: 999,
      background: bg, color: '#fff',
      fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap',
      border: onColored ? '1px solid rgba(255,255,255,0.22)' : 'none',
    }}>
      <Icon size={13} stroke="#fff" sw={2}/>
      {typeDef?.short ?? call.type}
      {call.status === 'assigned' && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', opacity: .7, marginLeft: 1 }}/>
      )}
    </div>
  );
}

// ── Table group card (queue) ──────────────────────────────────────

function TableGroupCard({ group, now, onAckAll, onResolveAll, onFocus, focused }: {
  group: TableGroup;
  now: number;
  onAckAll: () => void;
  onResolveAll: () => void;
  onFocus: () => void;
  focused: boolean;
}) {
  const s = STATE_STYLES[group.state];
  const isUrgent = group.state === 'urgent';
  const isColored = group.state !== 'idle';
  const hasPending = group.requests.some(r => r.status === 'pending');
  const hasAssigned = group.requests.some(r => r.status === 'assigned');
  const table = TABLE_BY_OBJECT_ID[group.objectId];

  const oldestIso = group.requests.reduce<string>((acc, r) =>
    !acc || r.created_at < acc ? r.created_at : acc, '');

  let primaryLabel = '';
  let primaryAction: (() => void) | null = null;
  let primaryBg = '', primaryFg = '';
  if (hasPending) {
    primaryLabel = 'Acknowledge';
    primaryAction = onAckAll;
    primaryBg = isColored ? '#fff' : PALETTE.ink;
    primaryFg = isColored ? PALETTE.ink : '#fff';
  } else if (hasAssigned) {
    primaryLabel = 'Mark resolved';
    primaryAction = onResolveAll;
    primaryBg = PALETTE.ink;
    primaryFg = '#fff';
  }

  return (
    <div onClick={onFocus} style={{
      padding: 14, borderRadius: 14, flexShrink: 0, cursor: 'pointer',
      background: s.bg, color: s.ink,
      border: '1px solid ' + s.border,
      boxShadow: isUrgent
        ? '0 6px 22px rgba(138,58,25,0.28)'
        : (group.state === 'inCall' ? '0 4px 16px rgba(138,58,25,0.18)'
          : group.state === 'inProgress' ? '0 4px 14px rgba(184,92,49,0.18)'
          : '0 1px 2px rgba(44,32,26,0.04)'),
      outline: focused ? '2px solid ' + PALETTE.ink : 'none',
      outlineOffset: focused ? 2 : 0,
      position: 'relative',
    }}>
      {isUrgent && (
        <div style={{
          position: 'absolute', inset: -1, borderRadius: 15, pointerEvents: 'none',
          animation: 'pulse-ring 1.4s infinite',
        }}/>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 22, lineHeight: 1, color: s.ink, fontWeight: 700, letterSpacing: '-0.015em' }}>
          {table?.label ?? group.tableId}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: s.ink, opacity: .78 }}>
          <IcUser size={12} stroke={s.ink} sw={1.9}/>
          <span style={{ fontSize: 11.5, fontWeight: 600 }}>{table?.seats ?? '—'}</span>
        </div>
        <div style={{ fontSize: 10.5, letterSpacing: '0.10em', textTransform: 'uppercase', color: s.ink, opacity: .68, fontWeight: 600 }}>
          · {table?.zone ?? ''}
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{
          fontSize: 13.5, fontWeight: 700, color: s.ink, fontVariantNumeric: 'tabular-nums',
          padding: '3px 9px', borderRadius: 999,
          background: isColored ? 'rgba(255,255,255,0.20)' : PALETTE.canvas,
          border: isColored ? '1px solid rgba(255,255,255,0.22)' : '1px solid ' + PALETTE.hair,
        }}>
          {oldestIso ? elapsedString(oldestIso, now) : '—'}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {group.requests.map(r => (
          <RequestPill key={r.id} call={r} onColored={isColored}/>
        ))}
      </div>

      {group.requests.some(r => r.special_request) && (
        <div style={{
          marginTop: 8, padding: '8px 10px', borderRadius: 8,
          background: isColored ? 'rgba(255,255,255,0.16)' : PALETTE.canvas,
          fontSize: 12.5, color: s.ink, fontStyle: 'italic',
          border: isColored ? '1px solid rgba(255,255,255,0.22)' : '1px solid ' + PALETTE.hair,
        }}>
          {group.requests.filter(r => r.special_request).map(r => `"${r.special_request}"`).join(' · ')}
        </div>
      )}

      {primaryAction && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={e => { e.stopPropagation(); primaryAction!(); }} style={{
            padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: primaryBg, color: primaryFg,
            fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <IcCheck size={14} stroke={primaryFg} sw={2.2}/>
            {primaryLabel}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Resolved log row ──────────────────────────────────────────────

function ResolvedLogRow({ call, now }: { call: Call; now: number }) {
  const Icon = ICON_BY_TYPE[call.type] ?? IcBell;
  const typeDef = REQUEST_TYPE_BY_BACKEND[call.type];
  const table = TABLE_BY_OBJECT_ID[call.table_id];
  const secsAgo = elapsedSince(call.resolved_at!, now);
  const timeAgo = secsAgo < 60 ? `${secsAgo}s ago`
    : secsAgo < 3600 ? `${Math.floor(secsAgo / 60)}m ago`
    : `${Math.floor(secsAgo / 3600)}h ago`;

  return (
    <div style={{
      padding: '12px 14px', borderRadius: 12,
      background: PALETTE.sand, border: '1px solid ' + PALETTE.sandDeep,
      color: PALETTE.ink, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: PALETTE.ink, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <IcCheck size={18} stroke="#fff" sw={2.4}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: PALETTE.ink }}>{table?.label ?? call.table_label}</span>
          <span style={{ fontSize: 11.5, color: PALETTE.ink2, opacity: .75 }}>· {table?.zone ?? ''}</span>
          <span style={{ flex: 1 }}/>
          <span style={{ fontSize: 11.5, color: PALETTE.ink2, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{timeAgo}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: PALETTE.ink, fontSize: 12.5 }}>
          <Icon size={13} stroke={PALETTE.ink} sw={1.9}/>
          <span style={{ fontWeight: 600 }}>{typeDef?.label ?? call.type}</span>
          {call.special_request && (
            <span style={{ color: PALETTE.ink2, fontStyle: 'italic', opacity: .85 }}>· "{call.special_request}"</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Queue panel ───────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterTab }) {
  const copy: Record<FilterTab, { title: string; sub: string }> = {
    inCall:     { title: 'No incoming calls',      sub: 'Your floor is clear. New alerts will appear here.'      },
    inProgress: { title: 'Nothing in progress',    sub: 'Acknowledged requests will move here.'                  },
    resolved:   { title: 'No resolved calls yet',  sub: 'When you resolve a table, it appears here as a record.' },
  };
  const { title, sub } = copy[filter];
  return (
    <div style={{
      marginTop: 12, padding: '36px 18px', borderRadius: 14,
      background: '#fff', border: '1px dashed ' + PALETTE.sandDeep, textAlign: 'center',
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: PALETTE.ink }}>{title}</div>
      <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.4, color: PALETTE.muted }}>{sub}</div>
    </div>
  );
}

function Queue({ groups, resolvedCalls, filter, now, focusedObjectId, setFocused, onAckTable, onResolveTable }: {
  groups: TableGroup[];
  resolvedCalls: Call[];
  filter: FilterTab;
  now: number;
  focusedObjectId: string | null;
  setFocused: (id: string | null) => void;
  onAckTable: (id: string) => void;
  onResolveTable: (id: string) => void;
}) {
  const visible = useMemo(() => {
    if (filter === 'inCall')     return groups.filter(g => g.state === 'inCall' || g.state === 'urgent');
    if (filter === 'inProgress') return groups.filter(g => g.state === 'inProgress');
    return [];
  }, [groups, filter]);

  const sorted = useMemo(() => [...visible].sort((a, b) => {
    if (a.state === 'urgent' && b.state !== 'urgent') return -1;
    if (b.state === 'urgent' && a.state !== 'urgent') return 1;
    return a.oldest - b.oldest;
  }), [visible]);

  const showResolved = filter === 'resolved';
  const headingLabel = filter === 'inCall' ? 'Needs attention' : filter === 'inProgress' ? 'Being handled' : 'Resolved log';

  return (
    <div style={{
      width: 420, flexShrink: 0, padding: 18, gap: 12,
      borderRight: '1px solid ' + PALETTE.hair,
      background: PALETTE.canvas,
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: PALETTE.muted, fontWeight: 700 }}>
            Live Queue
          </div>
          <div style={{ fontSize: 22, lineHeight: 1.1, marginTop: 4, fontWeight: 700, color: PALETTE.ink, letterSpacing: '-0.02em' }}>
            {headingLabel}
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: PALETTE.muted, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: PALETTE.terracotta, animation: 'blink 1.6s infinite' }}/>
          LIVE
        </div>
      </div>

      <div className="scroll-hide" style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto', minHeight: 0 }}>
        {!showResolved && sorted.length === 0 && <EmptyState filter={filter}/>}
        {!showResolved && sorted.map(g => (
          <TableGroupCard key={g.objectId}
            group={g} now={now}
            focused={focusedObjectId === g.objectId}
            onFocus={() => setFocused(g.objectId)}
            onAckAll={() => onAckTable(g.objectId)}
            onResolveAll={() => onResolveTable(g.objectId)}/>
        ))}
        {showResolved && resolvedCalls.length === 0 && <EmptyState filter={filter}/>}
        {showResolved && resolvedCalls.map(r => (
          <ResolvedLogRow key={r.id} call={r} now={now}/>
        ))}
      </div>
    </div>
  );
}

// ── Floor plan ────────────────────────────────────────────────────

function FloorLegend() {
  const items = [
    { c: '#fff',              border: PALETTE.hair,       l: 'Idle'        },
    { c: PALETTE.rust,        border: PALETTE.rust,       l: 'In Call'     },
    { c: PALETTE.terracotta,  border: PALETTE.terracotta, l: 'In Progress' },
  ];
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '6px 12px', borderRadius: 10,
      background: '#fff', border: '1px solid ' + PALETTE.hair,
    }}>
      {items.map(it => (
        <div key={it.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: it.c, border: '1px solid ' + it.border }}/>
          <span style={{ fontSize: 11.5, color: PALETTE.ink2, fontWeight: 600 }}>{it.l}</span>
        </div>
      ))}
    </div>
  );
}

function TableTile({ table, group, focused, onClick, now }: {
  table: typeof TABLES[0];
  group?: TableGroup;
  focused: boolean;
  onClick: () => void;
  now: number;
}) {
  const stateKey: TableState = group?.state ?? 'idle';
  const s = STATE_STYLES[stateKey];
  const isLive = stateKey === 'inCall' || stateKey === 'urgent';
  const isColored = stateKey !== 'idle';

  let radius = 12;
  if (table.zone === 'booth' || table.zone === 'bar') radius = 4;

  const firstCall = group?.requests?.[0];
  const FirstIcon = firstCall ? (ICON_BY_TYPE[firstCall.type] ?? IcBell) : null;
  const oldestIso = group ? group.requests.reduce<string>((acc, r) =>
    !acc || r.created_at < acc ? r.created_at : acc, '') : '';

  return (
    <div onClick={onClick} style={{
      borderRadius: radius, padding: 10,
      background: s.bg, color: s.ink,
      border: '1px solid ' + s.border, cursor: 'pointer',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'visible',
      transition: 'transform .15s, box-shadow .2s, background .25s, color .25s, border-color .25s',
      boxShadow: focused
        ? `0 0 0 2px ${PALETTE.ink}, 0 0 0 4px rgba(255,255,255,0.6)`
        : (stateKey === 'urgent' ? '0 6px 18px rgba(138,58,25,0.30)'
          : stateKey === 'inCall' ? '0 4px 14px rgba(138,58,25,0.22)'
          : stateKey === 'inProgress' ? '0 4px 14px rgba(184,92,49,0.20)'
          : '0 1px 2px rgba(44,32,26,0.03)'),
    }}>
      {isLive && (
        <div style={{
          position: 'absolute', inset: -1, borderRadius: radius,
          animation: 'pulse-ring 1.4s infinite', pointerEvents: 'none',
        }}/>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 17, lineHeight: 1, color: s.ink, fontWeight: 700, letterSpacing: '-0.015em' }}>
          {table.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: s.ink, opacity: isColored ? .85 : .65 }}>
          <IcUser size={11} stroke={s.ink} sw={1.9}/>
          <span style={{ fontSize: 10.5, fontWeight: 600 }}>{table.seats}</span>
        </div>
      </div>

      {group && firstCall ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          {FirstIcon && <FirstIcon size={13} stroke={s.ink} sw={2}/>}
          <span style={{ fontSize: 11, color: s.ink, fontWeight: 600 }}>
            {group.requests.length > 1 ? `${group.requests.length} calls` : (REQUEST_TYPE_BY_BACKEND[firstCall.type]?.short ?? firstCall.type)}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: s.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {oldestIso ? elapsedString(oldestIso, now) : ''}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 10.5, color: PALETTE.muted, fontWeight: 600, letterSpacing: '0.04em' }}>
          {table.zone}
        </div>
      )}
    </div>
  );
}

function FloorPlan({ groups, focusedObjectId, setFocused, now }: {
  groups: TableGroup[];
  focusedObjectId: string | null;
  setFocused: (id: string | null) => void;
  now: number;
}) {
  const groupByObjectId = useMemo(() => {
    const m = new Map<string, TableGroup>();
    groups.forEach(g => m.set(g.objectId, g));
    return m;
  }, [groups]);

  return (
    <div style={{
      flex: 1, padding: 18, minHeight: 0,
      display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden',
      background: PALETTE.canvas,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: PALETTE.muted, fontWeight: 700 }}>
            Floor plan
          </div>
          <div style={{ fontSize: 22, lineHeight: 1.1, marginTop: 4, fontWeight: 700, color: PALETTE.ink, letterSpacing: '-0.02em' }}>
            Dining room · dinner service
          </div>
        </div>
        <FloorLegend/>
      </div>

      <div style={{
        flex: 1, borderRadius: 16, padding: '20px 22px',
        background: '#fff', border: '1px solid ' + PALETTE.hair,
        position: 'relative', overflow: 'hidden', minHeight: 0,
      }}>
        {/* Zone labels */}
        <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: PALETTE.sandDeep, fontWeight: 600 }}>
          — Window front —
        </div>
        <div style={{ position: 'absolute', bottom: 4, right: 12, fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: PALETTE.sandDeep, fontWeight: 600 }}>
          Patio →
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: 14, height: '100%',
        }}>
          {TABLES.map(t => (
            <TableTile key={t.id}
              table={t}
              group={groupByObjectId.get(t.objectId)}
              focused={focusedObjectId === t.objectId}
              onClick={() => setFocused(t.objectId)}
              now={now}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Focus panel ───────────────────────────────────────────────────

function FocusRequestRow({ call, now, onAck, onResolve }: {
  call: Call; now: number; onAck: () => void; onResolve: () => void;
}) {
  const Icon = ICON_BY_TYPE[call.type] ?? IcBell;
  const typeDef = REQUEST_TYPE_BY_BACKEND[call.type];
  const isPending = call.status === 'pending';
  const isUrgent = call.type === 'urgent_help';
  const railColor = isUrgent ? PALETTE.rust : (isPending ? PALETTE.rust : PALETTE.terracotta);
  const accentBg  = isPending ? PALETTE.rustBg : PALETTE.terracottaBg;
  const accentFg  = isPending ? PALETTE.rust   : PALETTE.terracotta;

  return (
    <div style={{
      padding: 12, borderRadius: 12,
      background: '#fff', border: '1px solid ' + PALETTE.hair,
      borderLeft: '4px solid ' + railColor,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: accentBg, color: accentFg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={18} stroke={accentFg} sw={2}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: PALETTE.ink }}>{typeDef?.label ?? call.type}</div>
          <div style={{ fontSize: 11.5, color: PALETTE.muted, marginTop: 3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '1px 7px', borderRadius: 999,
              background: isPending ? PALETTE.rust : PALETTE.terracotta,
              color: '#fff', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>{isPending ? 'Pending' : 'In progress'}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: PALETTE.ink2 }}>
              {elapsedString(call.created_at, now)}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {isPending && (
            <button onClick={onAck} style={{
              padding: '7px 11px', borderRadius: 7, border: '1px solid ' + PALETTE.hair,
              background: '#fff', color: PALETTE.ink, cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            }}>Ack</button>
          )}
          <button onClick={onResolve} style={{
            padding: '7px 11px', borderRadius: 7, border: 'none',
            background: PALETTE.ink, color: '#fff', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
          }}>Done</button>
        </div>
      </div>
      {call.special_request && (
        <div style={{
          marginTop: 10, padding: '8px 10px', borderRadius: 8,
          background: PALETTE.canvas, fontSize: 12.5, color: PALETTE.ink2,
          fontStyle: 'italic', border: '1px solid ' + PALETTE.hair,
        }}>"{call.special_request}"</div>
      )}
    </div>
  );
}

function TableFocusPanel({ objectId, group, now, onClose, onAck, onResolve }: {
  objectId: string | null;
  group?: TableGroup;
  now: number;
  onClose: () => void;
  onAck: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const isOpen = !!objectId;
  const table = objectId ? TABLE_BY_OBJECT_ID[objectId] : null;
  const stateKey: TableState = group?.state ?? 'idle';
  const s = STATE_STYLES[stateKey];
  const oldestIso = group ? group.requests.reduce<string>((acc, r) =>
    !acc || r.created_at < acc ? r.created_at : acc, '') : '';

  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 60,
        background: isOpen ? 'rgba(44,32,26,0.32)' : 'transparent',
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'background .2s ease',
      }}/>
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 61,
        width: 420, maxWidth: '94%',
        background: '#fff', borderLeft: '1px solid ' + PALETTE.hair,
        boxShadow: '-12px 0 40px rgba(44,32,26,0.14)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .28s cubic-bezier(.2,.8,.2,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {isOpen && table && (
          <>
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid ' + PALETTE.hair,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <button onClick={onClose} style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid ' + PALETTE.hair,
                background: '#fff', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IcX size={16} stroke={PALETTE.ink2} sw={2}/>
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: PALETTE.muted, fontWeight: 700 }}>
                  Table focus
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: PALETTE.ink, letterSpacing: '-0.02em', marginTop: 2 }}>
                  {table.label}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11.5, color: PALETTE.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {table.zone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, justifyContent: 'flex-end' }}>
                  <IcUser size={13} stroke={PALETTE.ink2} sw={2}/>
                  <span style={{ fontSize: 13, fontWeight: 700, color: PALETTE.ink }}>{table.seats}</span>
                </div>
              </div>
            </div>

            {/* State banner */}
            <div style={{
              margin: '14px 20px 0', padding: '10px 14px', borderRadius: 10,
              background: stateKey === 'idle' ? PALETTE.canvas : s.bg,
              border: stateKey === 'idle' ? '1px solid ' + PALETTE.hair : 'none',
              color: stateKey === 'idle' ? PALETTE.muted : s.ink,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: stateKey === 'idle' ? PALETTE.sandDeep : '#fff',
                animation: (stateKey === 'inCall' || stateKey === 'urgent') ? 'blink 1.4s infinite' : 'none',
              }}/>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</span>
              {group && oldestIso && (
                <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {elapsedString(oldestIso, now)}
                </span>
              )}
            </div>

            {/* Requests */}
            <div className="scroll-hide" style={{ flex: 1, overflow: 'auto', padding: '14px 20px', minHeight: 0 }}>
              {!group ? (
                <div style={{
                  marginTop: 12, padding: '40px 20px', borderRadius: 12,
                  background: PALETTE.canvas, border: '1px dashed ' + PALETTE.sandDeep, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: PALETTE.ink }}>No active requests</div>
                  <div style={{ fontSize: 12.5, marginTop: 6, color: PALETTE.muted }}>
                    This table is idle. New requests will appear here as they come in.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {group.requests.map(r => (
                    <FocusRequestRow key={r.id} call={r} now={now}
                      onAck={() => onAck(r.id)} onResolve={() => onResolve(r.id)}/>
                  ))}
                </div>
              )}
            </div>

            {/* Bulk actions */}
            {group && (
              <div style={{
                padding: '12px 20px', borderTop: '1px solid ' + PALETTE.hair,
                background: PALETTE.canvas, display: 'flex', gap: 8,
              }}>
                {group.requests.some(r => r.status === 'pending') && (
                  <button onClick={() => group.requests.filter(r => r.status === 'pending').forEach(r => onAck(r.id))} style={{
                    flex: 1, height: 42, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: PALETTE.terracotta, color: '#fff',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  }}>
                    <IcCheck size={15} stroke="#fff" sw={2.4}/>
                    Acknowledge all
                  </button>
                )}
                <button onClick={() => group.requests.forEach(r => onResolve(r.id))} style={{
                  flex: 1, height: 42, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: PALETTE.ink, color: '#fff',
                  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}>
                  <IcCheck size={15} stroke="#fff" sw={2.4}/>
                  Resolve all
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ── Toast stack ───────────────────────────────────────────────────

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={{
      position: 'absolute', right: 22, bottom: 22, zIndex: 50,
      display: 'flex', flexDirection: 'column-reverse', gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const Icon = ICON_BY_TYPE[t.typeId] ?? IcBell;
        return (
          <div key={t.id} style={{
            padding: '12px 16px 12px 14px', borderRadius: 12,
            background: PALETTE.ink, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 10px 30px rgba(44,32,26,0.30)',
            minWidth: 280, maxWidth: 360,
            animation: 'fade-up .25s ease both',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: t.urgent ? PALETTE.rust : PALETTE.terracotta,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={16} stroke="#fff" sw={2}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                Table {t.tableLabel}
              </div>
              <div style={{ fontSize: 13, marginTop: 1, fontWeight: 500 }}>{t.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────

export default function StaffDashboard() {
  const { groups, resolvedCalls, counts, toasts, ackCall, ackTable, doneCall, doneTable } = useCallStore();
  const [filter, setFilter] = useState<FilterTab>('inCall');
  const [focusedObjectId, setFocusedObjectId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const now = useNow();

  const focusedGroup = focusedObjectId ? groups.find(g => g.objectId === focusedObjectId) : undefined;

  // Play alert sound for each new toast, unless muted
  const seenToastIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (muted) return;
    toasts.forEach(t => {
      if (!seenToastIds.current.has(t.id)) {
        seenToastIds.current.add(t.id);
        playAlertSound(t.urgent);
      }
    });
  }, [toasts, muted]);

  const handleSetFocused = useCallback((id: string | null) => {
    setFocusedObjectId(id);
  }, []);

  return (
    <div style={{
      height: '100%', width: '100%',
      display: 'flex', flexDirection: 'column',
      background: PALETTE.canvas, color: PALETTE.ink,
      fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      <StaffTopbar
        filter={filter} setFilter={setFilter}
        counts={counts} muted={muted} setMuted={setMuted}
      />
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        <Queue
          groups={groups} resolvedCalls={resolvedCalls}
          filter={filter} now={now}
          focusedObjectId={focusedObjectId} setFocused={handleSetFocused}
          onAckTable={ackTable} onResolveTable={doneTable}
        />
        <FloorPlan
          groups={groups} now={now}
          focusedObjectId={focusedObjectId} setFocused={handleSetFocused}
        />
        <TableFocusPanel
          objectId={focusedObjectId}
          group={focusedGroup}
          now={now}
          onClose={() => setFocusedObjectId(null)}
          onAck={ackCall}
          onResolve={doneCall}
        />
        <ToastStack toasts={toasts}/>
      </div>
    </div>
  );
}
