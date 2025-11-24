
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
  TM_02_LUZ = 'TM 02 de LUZ',
  TM_02_ANR = 'TM 02 de ANR',
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
  _rowId?: string; // Optional field to store Supabase Primary Key
}

// Supabase Types for Global Window Object
declare global {
  interface Window {
    supabase: {
      createClient: (url: string, key: string) => any;
    };
  }
}

export type DataMode = 'LOCAL' | 'CLOUD';
