export type CallStatus = 'pending' | 'assigned' | 'resolved';
export type CallTypeId = 'server' | 'refill' | 'bill' | 'order' | 'special' | 'urgent';
export type TableState = 'idle' | 'inCall' | 'urgent' | 'inProgress';
export type FilterTab = 'inCall' | 'inProgress' | 'resolved';

export interface Call {
  id: string;
  table_id: string;
  table_label: string;
  type: string;
  status: CallStatus;
  special_request?: string;
  priority: number;
  assigned_staff_id?: string;
  assigned_staff?: string;
  created_at: string;
  assigned_at?: string;
  resolved_at?: string;
}

export interface TableDef {
  id: string;
  objectId: string;
  label: string;
  seats: number;
  col: number;
  row: number;
  zone: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  initials: string;
}

export interface RequestTypeDef {
  id: CallTypeId;
  label: string;
  short: string;
  backendType: string;
  semantic: 'urgent' | 'service';
  sub: string;
}

export interface TableGroup {
  tableId: string;
  objectId: string;
  requests: Call[];
  state: TableState;
  oldest: number;
}

export interface Toast {
  id: string;
  tableLabel: string;
  label: string;
  urgent: boolean;
  typeId: string;
}
