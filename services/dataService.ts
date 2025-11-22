import { INITIAL_VEHICLES, SUPABASE_KEY, SUPABASE_URL } from "../constants";
import { DataMode, HistoryLog, Vehicle } from "../types";

let supabaseClient: any = null;
let currentMode: DataMode = 'LOCAL';

export const initDataService = (): DataMode => {
  if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      currentMode = 'CLOUD';
      console.log("Conectado ao Supabase (Modo Nuvem)");
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

export const getVehicles = async (): Promise<Vehicle[]> => {
  if (currentMode === 'CLOUD' && supabaseClient) {
    try {
      // Fetch all vehicles from 'vehicles' table
      // Assumes table schema: id (text), data (jsonb)
      const { data, error } = await supabaseClient
        .from('vehicles')
        .select('*');
      
      if (error) throw error;

      if (data && data.length > 0) {
        // Map DB rows back to Vehicle objects
        const cloudVehicles = data.map((row: any) => row.data);
        
        // Merge logic: Ensure new vehicles in code (INITIAL_VEHICLES) are added to DB if missing
        const merged = [...cloudVehicles];
        let hasNew = false;
        
        for (const initial of INITIAL_VEHICLES) {
          if (!cloudVehicles.find((v: Vehicle) => v.id === initial.id)) {
            merged.push(initial);
            // Add to DB asynchronously
            await saveVehicle(initial); 
            hasNew = true;
          }
        }
        return merged;
      } else {
        // First run in cloud: Seed with initial data
        for (const v of INITIAL_VEHICLES) {
            await saveVehicle(v);
        }
        return INITIAL_VEHICLES;
      }
    } catch (err) {
      console.error("Erro ao buscar veículos da nuvem:", err);
      // Fallback to local if cloud fails temporarily
    }
  }

  // Local Storage Fallback
  const saved = localStorage.getItem('metro_vehicles');
  const localVehicles = saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  
  // Merge local logic
  const merged = [...localVehicles];
  for (const initial of INITIAL_VEHICLES) {
    if (!localVehicles.find((v: Vehicle) => v.id === initial.id)) {
      merged.push(initial);
    }
  }
  return merged;
};

export const saveVehicle = async (vehicle: Vehicle) => {
  if (currentMode === 'CLOUD' && supabaseClient) {
    try {
      // Upsert into vehicles table
      const { error } = await supabaseClient
        .from('vehicles')
        .upsert({ id: vehicle.id, data: vehicle });
        
      if (error) console.error("Erro ao salvar veículo na nuvem:", error);
    } catch (err) {
      console.error("Erro de conexão ao salvar:", err);
    }
  }
  
  // Always save to local storage as backup/cache
  const saved = localStorage.getItem('metro_vehicles');
  let vehicles = saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  const index = vehicles.findIndex((v: Vehicle) => v.id === vehicle.id);
  if (index >= 0) {
    vehicles[index] = vehicle;
  } else {
    vehicles.push(vehicle);
  }
  localStorage.setItem('metro_vehicles', JSON.stringify(vehicles));
};

export const getHistory = async (): Promise<HistoryLog[]> => {
    if (currentMode === 'CLOUD' && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('history_logs')
                .select('*');
            if (error) throw error;
            if (data) return data.map((row: any) => row.data);
        } catch (err) {
            console.error("Erro ao buscar histórico nuvem:", err);
        }
    }
    const saved = localStorage.getItem('metro_history');
    return saved ? JSON.parse(saved) : [];
}

export const addHistoryLog = async (log: HistoryLog) => {
    if (currentMode === 'CLOUD' && supabaseClient) {
        try {
            await supabaseClient.from('history_logs').insert({ data: log });
        } catch (err) {
             console.error("Erro ao salvar histórico nuvem:", err);
        }
    }

    const saved = localStorage.getItem('metro_history');
    const history = saved ? JSON.parse(saved) : [];
    history.push(log);
    localStorage.setItem('metro_history', JSON.stringify(history));
}