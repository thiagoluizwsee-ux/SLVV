
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
      const { data, error } = await supabaseClient
        .from('vehicles')
        .select('*');
      
      if (error) {
        console.error("Erro detalhado do Supabase (getVehicles):", JSON.stringify(error, null, 2));
        if (error.code === '42P01') { // Relation does not exist
             console.log("%c ATENÇÃO: Tabelas não encontradas! Rode o SQL abaixo no Supabase:", "color: orange; font-weight: bold;");
             console.log(`
                create table vehicles (
                  id text primary key,
                  data jsonb
                );
                create table history_logs (
                  id uuid primary key default gen_random_uuid(),
                  data jsonb
                );
                ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
                ALTER TABLE history_logs DISABLE ROW LEVEL SECURITY;
             `);
        }
        throw error;
      }

      if (data && data.length > 0) {
        // Map DB rows back to Vehicle objects
        const cloudVehicles = data.map((row: any) => row.data);
        
        // Merge logic: Ensure new vehicles in code (INITIAL_VEHICLES) are added to DB if missing
        const merged = [...cloudVehicles];
        
        for (const initial of INITIAL_VEHICLES) {
          if (!cloudVehicles.find((v: Vehicle) => v.id === initial.id)) {
            merged.push(initial);
            // Add to DB asynchronously
            await saveVehicle(initial); 
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
        
      if (error) {
          console.error("Erro detalhado ao salvar veículo na nuvem:", JSON.stringify(error, null, 2));
          if (error.code === '42501') {
              console.warn("%c PERMISSÃO NEGADA (RLS).", "color: red; font-weight: bold;");
              console.warn("Execute no Supabase: ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;");
          }
      }
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
            // Select both the ID (primary key) and the JSON data
            const { data, error } = await supabaseClient
                .from('history_logs')
                .select('id, data');
                
            if (error) throw error;
            
            if (data) {
                // Merge the Row ID into the object so we can delete by it later
                return data.map((row: any) => ({
                    ...row.data,
                    _rowId: row.id 
                }));
            }
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
            // We don't save _rowId into the json, it's a transient field
            const { _rowId, ...cleanLog } = log;
            const { error } = await supabaseClient.from('history_logs').insert({ data: cleanLog });
            
            if (error) {
                console.error("Erro detalhado ao salvar histórico (Supabase):", JSON.stringify(error, null, 2));
                if (error.code === '42501') {
                     console.warn("PERMISSÃO NEGADA (RLS) no Histórico. Execute: ALTER TABLE history_logs DISABLE ROW LEVEL SECURITY;");
                }
            }
        } catch (err) {
             console.error("Erro ao salvar histórico nuvem:", err);
        }
    }

    const saved = localStorage.getItem('metro_history');
    const history = saved ? JSON.parse(saved) : [];
    history.push(log);
    localStorage.setItem('metro_history', JSON.stringify(history));
}

export const deleteHistoryLog = async (logId: string, rowId?: string): Promise<boolean> => {
    let success = true;

    if (currentMode === 'CLOUD' && supabaseClient) {
        try {
            let res;
            
            // Strategy 1: Search and Destroy (If rowId is missing)
            let targetRowId = rowId;

            if (!targetRowId) {
                 console.log(`[Delete] ID de linha não fornecido. Buscando ID da linha para o Log JSON ID: ${logId}`);
                 const { data: searchData, error: searchError } = await supabaseClient
                    .from('history_logs')
                    .select('id')
                    .eq('data->>id', logId)
                    .maybeSingle();
                
                 if (searchData && searchData.id) {
                     targetRowId = searchData.id;
                     console.log(`[Delete] ID da linha encontrado: ${targetRowId}`);
                 } else if (searchError) {
                     console.error("[Delete] Erro ao buscar ID:", searchError);
                 }
            }

            if (targetRowId) {
                // Best method: Delete by Supabase Primary Key
                res = await supabaseClient
                    .from('history_logs')
                    .delete({ count: 'exact' })
                    .eq('id', targetRowId);
            } else {
                // Fallback: Delete based on the ID inside the JSONB data column
                // Note: This often fails if RLS or Types aren't perfect, hence the search above
                console.log("[Delete] Tentando exclusão fallback via JSON ID...");
                res = await supabaseClient
                    .from('history_logs')
                    .delete({ count: 'exact' })
                    .eq('data->>id', logId);
            }
            
            if (res.error) {
                console.error("Erro detalhado ao excluir:", JSON.stringify(res.error, null, 2));
                throw res.error;
            }

            // If count is 0, it means the command ran but nothing was deleted 
            // (Likely RLS blocking it or ID mismatch)
            if (res.count === 0 || res.count === null) {
                console.warn("Atenção: Comando de exclusão rodou, mas nenhum registro foi afetado. Verifique RLS.");
                throw new Error("RLS_BLOCK");
            } else {
                console.log(`[Delete] Sucesso! Registros apagados: ${res.count}`);
            }

        } catch (err: any) {
            console.error("Erro ao excluir histórico nuvem:", err);
            success = false;

            if (err.message === "RLS_BLOCK" || err.code === '42501') {
                alert("O Banco de Dados impediu a exclusão (RLS Ativado).\n\nAcesse o Supabase > SQL Editor e rode:\nALTER TABLE history_logs DISABLE ROW LEVEL SECURITY;");
            } else {
                alert(`Erro ao excluir: ${err.message || 'Erro desconhecido'}`);
            }
        }
    }

    // Always delete from local storage to keep UI consistent if in local mode
    if (success || currentMode === 'LOCAL') {
        const saved = localStorage.getItem('metro_history');
        if (saved) {
            let history = JSON.parse(saved) as HistoryLog[];
            history = history.filter(log => log.id !== logId);
            localStorage.setItem('metro_history', JSON.stringify(history));
        }
    }
    
    return success;
}
