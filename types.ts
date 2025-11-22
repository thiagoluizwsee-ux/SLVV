export enum LocationEnum {
  PAT = 'PAT',
  ETC_5 = 'ETC 5',
  ETC_6 = 'ETC 6',
  ETC_7 = 'ETC 7',
  ECL_3 = 'ECL 3',
  ECL_4 = 'ECL 4',
  PIT = 'PIT',
  PTI = 'PTI',
  RAMAL_5 = 'Ramal 5',
  RAMAL_6 = 'Ramal 6',
  OFICINA = 'Oficina',
}

export enum VehicleStatus {
  OPERATION = 'Em Operação',
  MAINTENANCE = 'Manutenção',
}

export interface Vehicle {
  id: string; // e.g., 'TM 01'
  lastLocation: LocationEnum | null;
  currentLocation: LocationEnum;
  operator: string;
  lastUpdate: string; // ISO Date string
  status: VehicleStatus;
  registration: string; // Unique record ID (incremental or uuid)
}

export interface HistoryLog {
  id: string;
  vehicleId: string;
  previousLocation: LocationEnum | null;
  newLocation: LocationEnum;
  operator: string;
  timestamp: string;
  actionType: 'LOCATION_UPDATE' | 'STATUS_CHANGE';
  details?: string;
  registration?: string;
}

export type ConnectionMode = 'LOCAL' | 'CLOUD';

// Declare alasql and Supabase on window for TypeScript
declare global {
  interface Window {
    alasql: (sql: string, params?: any[]) => any;
    supabase: any;
  }
}