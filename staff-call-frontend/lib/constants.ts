import type { TableDef, StaffMember, RequestTypeDef } from './types';

export const PALETTE = {
  canvas:         '#F2EAE0',
  card:           '#FFFFFF',
  ink:            '#2C201A',
  ink2:           '#594236',
  muted:          '#8C7A6B',
  hair:           '#E4D0B6',
  hair2:          '#EADFD0',
  rust:           '#8A3A19',
  rustBg:         '#EFD6C8',
  rustDeep:       '#5E2410',
  terracotta:     '#B85C31',
  terracottaBg:   '#F4D7C3',
  terracottaDeep: '#8E4521',
  sand:           '#E4D0B6',
  sandBg:         '#EFE2CD',
  sandDeep:       '#C2A57E',
};

export const TABLES: TableDef[] = [
  { id: 'T01', objectId: '000000000000000000000001', label: 'T01', seats: 2, col: 1, row: 1, zone: 'window' },
  { id: 'T02', objectId: '000000000000000000000002', label: 'T02', seats: 2, col: 2, row: 1, zone: 'window' },
  { id: 'T03', objectId: '000000000000000000000003', label: 'T03', seats: 4, col: 3, row: 1, zone: 'window' },
  { id: 'T04', objectId: '000000000000000000000004', label: 'T04', seats: 4, col: 4, row: 1, zone: 'window' },
  { id: 'T05', objectId: '000000000000000000000005', label: 'T05', seats: 6, col: 5, row: 1, zone: 'window' },
  { id: 'T06', objectId: '000000000000000000000006', label: 'T06', seats: 4, col: 1, row: 2, zone: 'main'   },
  { id: 'T07', objectId: '000000000000000000000007', label: 'T07', seats: 4, col: 2, row: 2, zone: 'main'   },
  { id: 'BAR', objectId: '000000000000000000000008', label: 'BAR', seats: 8, col: 3, row: 2, zone: 'bar'    },
  { id: 'T08', objectId: '000000000000000000000009', label: 'T08', seats: 2, col: 4, row: 2, zone: 'main'   },
  { id: 'T09', objectId: '00000000000000000000000a', label: 'T09', seats: 2, col: 5, row: 2, zone: 'main'   },
  { id: 'B01', objectId: '00000000000000000000000b', label: 'B01', seats: 6, col: 1, row: 3, zone: 'booth'  },
  { id: 'B02', objectId: '00000000000000000000000c', label: 'B02', seats: 6, col: 2, row: 3, zone: 'booth'  },
  { id: 'P01', objectId: '00000000000000000000000d', label: 'P01', seats: 4, col: 4, row: 3, zone: 'patio'  },
  { id: 'P02', objectId: '00000000000000000000000e', label: 'P02', seats: 4, col: 5, row: 3, zone: 'patio'  },
];

export const TABLE_BY_ID: Record<string, TableDef> = Object.fromEntries(
  TABLES.map(t => [t.id, t])
);
export const TABLE_BY_OBJECT_ID: Record<string, TableDef> = Object.fromEntries(
  TABLES.map(t => [t.objectId, t])
);

export const STAFF: StaffMember[] = [
  { id: '100000000000000000000001', name: 'Marina',  role: 'Server',  initials: 'MR' },
  { id: '100000000000000000000002', name: 'Hugo',    role: 'Server',  initials: 'HC' },
  { id: '100000000000000000000003', name: 'Yuki',    role: 'Runner',  initials: 'YK' },
  { id: '100000000000000000000004', name: 'Diego',   role: 'Manager', initials: 'DM' },
];

// Default staff member used when acknowledging a call
export const DEFAULT_STAFF = STAFF[0];

export const REQUEST_TYPES: RequestTypeDef[] = [
  { id: 'server',  label: 'Call Server',     short: 'Server',  backendType: 'server',       semantic: 'service', sub: 'A team member will visit'   },
  { id: 'refill',  label: 'Refill Water',    short: 'Refill',  backendType: 'refill',       semantic: 'service', sub: 'Water or drink top-up'      },
  { id: 'bill',    label: 'Request Bill',    short: 'Bill',    backendType: 'request_bill', semantic: 'service', sub: 'Please bring our check'     },
  { id: 'order',   label: 'Order More',      short: 'Order',   backendType: 'order',        semantic: 'service', sub: 'Take an additional order'   },
  { id: 'special', label: 'Special Request', short: 'Note',    backendType: 'special',      semantic: 'service', sub: 'Write us a note'            },
  { id: 'urgent',  label: 'Urgent Help',     short: 'Urgent',  backendType: 'urgent_help',  semantic: 'urgent',  sub: 'Allergy, spill, emergency'  },
];

export const REQUEST_TYPE_BY_ID: Record<string, RequestTypeDef> = Object.fromEntries(
  REQUEST_TYPES.map(t => [t.id, t])
);

// Map backend type string → RequestTypeDef
export const REQUEST_TYPE_BY_BACKEND: Record<string, RequestTypeDef> = Object.fromEntries(
  REQUEST_TYPES.map(t => [t.backendType, t])
);

export const RESOLVED_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const COOLDOWN_MS = 12000;
