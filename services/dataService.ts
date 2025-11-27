
import { INITIAL_VEHICLES, SUPABASE_KEY, SUPABASE_URL } from "../constants";
import { DataMode, HistoryLog, Vehicle } from "../types";

// Helper for safe LocalStorage access (Firefox throws errors in strict mode/iframes)
const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('LocalStorage access denied (Firefox Strict Mode?):', e);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('LocalStorage write denied (Firefox Strict Mode?):', e);
    }
  }
};

let supabaseClient: any = null;
let currentMode: DataMode = 'LOCAL';

export const initDataService = (): DataMode => {
  if (window.supabase && SUPABASE_URL && SUPABASE_KEY) {
    try {
      // Use global window.supabase
      // persistSession: false is CRITICAL for Firefox to avoid localStorage blocking issues in auth
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
      currentMode = 'CLOUD';
      console.log("Conectado ao Supabase (Modo Nuvem - Global Script)");
    } catch (error) {
      console.error("Falha ao conectar Supabase, revertendo para local:", error);
      currentMode = 'LOCAL';
    }
  } else {
    currentMode = 'LOCAL';
    console.log("Executando em Modo Local (Navegador)");
  }
  return currentMode;
};

// Helper to get local vehicles
const getLocalVehiclesData = (): Vehicle[] => {
  const saved = safeStorage.getItem('metro_vehicles');
  const localVehicles = saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  
  const merged = [...localVehicles];
  for (const initial of INITIAL_VEHICLES) {
    if (!localVehicles.find((v: Vehicle) => v.id === initial.id)) {
      merged.push(initial);
    }
  }
  return merged;
};

export const getVehicles = async (): Promise<Vehicle[]> => {
  if (currentMode === 'CLOUD' && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('vehicles').select('*');
      
      if (error) throw error;

      if (data && data.length > 0) {
        const cloudVehicles = data.map((row: any) => row.data);
        const merged = [...cloudVehicles];
        for (const initial of INITIAL_VEHICLES) {
          if (!cloudVehicles.find((v: Vehicle) => v.id === initial.id)) {
            merged.push(initial);
            await saveVehicle(initial); 
          }
        }
        return merged;
      } else {
        // Se a tabela estiver vazia na nuvem, inicializa com os dados locais/padrão
        for (const v of INITIAL_VEHICLES) {
            await saveVehicle(v);
        }
        return INITIAL_VEHICLES;
      }
    } catch (err: any) {
      console.error("Erro nuvem (getVehicles):", err);
      // Fallback silencioso para local em caso de erro de rede momentâneo
      return getLocalVehiclesData();
    }
  }
  return getLocalVehiclesData();
};

export const saveVehicle = async (vehicle: Vehicle) => {
  // Salvar Localmente (Backup/Instantâneo) - usando safeStorage
  const saved = safeStorage.getItem('metro_vehicles');
  let vehicles = saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  const index = vehicles.findIndex((v: Vehicle) => v.id === vehicle.id);
  if (index >= 0) {
    vehicles[index] = vehicle;
  } else {
    vehicles.push(vehicle);
  }
  safeStorage.setItem('metro_vehicles', JSON.stringify(vehicles));

  // Salvar na Nuvem
  if (currentMode === 'CLOUD' && supabaseClient) {
    try {
      await supabaseClient.from('vehicles').upsert({ id: vehicle.id, data: vehicle });
    } catch (err) {
      console.error("Erro saveVehicle Supabase:", err);
    }
  }
};

// ============================================================================
// HISTORY LOGIC - DIRECT ID STRATEGY
// ============================================================================

export const getHistory = async (): Promise<HistoryLog[]> => {
    // 1. Local Load (Always fast fallback)
    const localSaved = safeStorage.getItem('metro_history');
    let localLogs = localSaved ? JSON.parse(localSaved) : [];

    // 2. Cloud Load (Sync)
    if (currentMode === 'CLOUD' && supabaseClient) {
        try {
            // Select columns matching new schema
            const { data, error } = await supabaseClient
                .from('history_logs')
                .select('*'); // id, vehicle_id, data
                
            if (!error && data) {
                // Map back to HistoryLog objects
                // The 'data' column contains the details, but 'id' is the real key
                const cloudLogs = data.map((row: any) => ({
                    ...row.data,
                    id: row.id // Ensure ID matches the Primary Key
                }));
                
                // Update Local Cache with Cloud Data
                safeStorage.setItem('metro_history', JSON.stringify(cloudLogs));
                return cloudLogs;
            } else if (error) {
                console.error("Erro getHistory API:", error);
            }
        } catch (err) {
            console.error("Erro getHistory Cloud:", err);
        }
    }
    
    return localLogs;
}

export const addHistoryLog = async (log: HistoryLog) => {
    // 1. Save Local
    const saved = safeStorage.getItem('metro_history');
    const history = saved ? JSON.parse(saved) : [];
    history.push(log);
    safeStorage.setItem('metro_history', JSON.stringify(history));

    // 2. Save Cloud (New Schema: ID is Primary Key)
    if (currentMode === 'CLOUD' && supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('history_logs')
                .insert({
                    id: log.id,           // PRIMARY KEY
                    vehicle_id: log.vehicleId,
                    data: log
                });
            
            if (error) console.error("Erro addHistoryLog Cloud:", error);
        } catch (err) {
             console.error("Erro addHistoryLog Cloud:", err);
        }
    }
}

export const deleteHistoryLog = async (logId: string, rowId?: string): Promise<boolean> => {
    console.log(`[Delete] Excluindo ID: ${logId}`);

    // 1. DELETE LOCAL (Instant UI feedback)
    const saved = safeStorage.getItem('metro_history');
    if (saved) {
        let history = JSON.parse(saved) as HistoryLog[];
        history = history.filter(log => log.id !== logId);
        safeStorage.setItem('metro_history', JSON.stringify(history));
    }

    // 2. DELETE CLOUD (Direct ID Match - Infallible)
    if (currentMode === 'CLOUD' && supabaseClient) {
        try {
            // Delete directly by Primary Key 'id'
            // No JSON filtering needed anymore.
            const { error } = await supabaseClient
                .from('history_logs')
                .delete()
                .eq('id', logId);

            if (error) {
                console.error("Erro delete Cloud:", error);
                return false;
            }
            console.log("[Delete] Sucesso na Nuvem.");
        } catch (err) {
            console.error("Erro delete Cloud:", err);
            return false;
        }
    }
    
    return true;
}