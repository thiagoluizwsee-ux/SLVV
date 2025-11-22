import React, { useState, useEffect } from 'react';
import { MetroLogo } from './components/MetroLogo';
import { INITIAL_VEHICLES, AVAILABLE_LOCATIONS } from './constants';
import { Vehicle, LocationEnum, VehicleStatus, HistoryLog } from './types';
import { UpdateModal } from './components/UpdateModal';
import { HistoryView } from './components/HistoryView';

function App() {
  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('metro_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });
  
  const [history, setHistory] = useState<HistoryLog[]>(() => {
    const saved = localStorage.getItem('metro_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<string>('Sistema');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState<string>('ALL');

  // Persistence
  useEffect(() => {
    localStorage.setItem('metro_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('metro_history', JSON.stringify(history));
  }, [history]);

  // Actions
  const handleUpdateLocation = (vehicleId: string, newLocation: LocationEnum, operator: string, registration: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const log: HistoryLog = {
          id: crypto.randomUUID(),
          vehicleId: v.id,
          previousLocation: v.currentLocation,
          newLocation: newLocation,
          operator,
          timestamp: new Date().toISOString(),
          actionType: 'LOCATION_UPDATE',
          details: `Registro: ${registration}`,
          registration: registration
        };
        setHistory(h => [...h, log]);
        
        return {
          ...v,
          lastLocation: v.currentLocation,
          currentLocation: newLocation,
          operator,
          registration,
          lastUpdate: new Date().toISOString(),
        };
      }
      return v;
    }));
    setSelectedVehicle(null);
  };

  const toggleStatus = (vehicleId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const isEnteringMaintenance = v.status === VehicleStatus.OPERATION;
        const newStatus = isEnteringMaintenance 
          ? VehicleStatus.MAINTENANCE 
          : VehicleStatus.OPERATION;

        let newLocation = v.currentLocation;
        let lastLocation = v.lastLocation;
        let details = `Alterado para ${newStatus}`;

        if (isEnteringMaintenance) {
          lastLocation = v.currentLocation;
          newLocation = LocationEnum.OFICINA;
          details += ` (Movido para ${LocationEnum.OFICINA})`;
        }

        const log: HistoryLog = {
          id: crypto.randomUUID(),
          vehicleId: v.id,
          previousLocation: v.currentLocation,
          newLocation: newLocation,
          operator: currentUser, 
          timestamp: new Date().toISOString(),
          actionType: 'STATUS_CHANGE',
          details: details
        };
        setHistory(h => [...h, log]);

        return {
          ...v,
          status: newStatus,
          currentLocation: newLocation,
          lastLocation: lastLocation,
          lastUpdate: new Date().toISOString()
        };
      }
      return v;
    }));
  };

  // Helper to normalize text for fuzzy search
  // Removes accents, special characters, spaces, and hyphens, and converts to lowercase
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  };

  // Filter Logic
  const filteredVehicles = vehicles.filter(vehicle => {
    const normalizedSearch = normalizeText(searchTerm);
    const normalizedId = normalizeText(vehicle.id);
    const normalizedLocation = normalizeText(vehicle.currentLocation);
    
    const matchesSearch = 
      normalizedId.includes(normalizedSearch) || 
      normalizedLocation.includes(normalizedSearch);
    
    const matchesFilter = filterLocation === 'ALL' || vehicle.currentLocation === filterLocation;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-metro-blue shadow-lg sticky top-0 z-30 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
            <MetroLogo className="shrink-0" />
            <h1 className="text-white text-sm sm:text-base md:text-lg font-medium tracking-wide leading-tight opacity-90 hidden sm:block border-l border-white/30 pl-6 h-10 flex items-center">
              Sistema de Localização de Veículos de Via - SLVV
            </h1>
            {/* Mobile-only title (simplified) if needed, or just show the logo */}
          </div>
          <div className="flex items-center space-x-4 text-white w-full md:w-auto justify-end">
            <button 
              onClick={() => { setHistoryFilter(null); setShowHistory(true); }}
              className="bg-white text-metro-blue px-4 py-2 rounded font-bold text-sm hover:bg-gray-100 transition shadow-sm w-full md:w-auto"
            >
              Histórico Geral
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search and Filter Bar */}
        <div className="mb-8 bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-grow w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-0 text-gray-900 sm:text-sm"
              placeholder="Buscar veículo ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

          <div className="relative w-full sm:w-auto min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <select
              className="block w-full pl-10 pr-8 py-2 text-base border border-transparent focus:outline-none focus:ring-0 sm:text-sm rounded-md text-gray-700 bg-white cursor-pointer"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="ALL">Todos os Locais</option>
              {AVAILABLE_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const isMaintenance = vehicle.status === VehicleStatus.MAINTENANCE;
            return (
            <div key={vehicle.id} className={`rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border ${
              isMaintenance ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'
            }`}>
              {/* Card Header */}
              <div className={`px-4 py-3 border-b flex justify-between items-center ${
                isMaintenance ? 'bg-red-100 border-red-200' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${isMaintenance ? 'bg-red-600 animate-pulse' : 'bg-green-500'}`}></div>
                  <h3 className={`text-xl font-bold ${isMaintenance ? 'text-red-700' : 'text-metro-blue'}`}>{vehicle.id}</h3>
                  
                  {isMaintenance && (
                    <svg 
                      className="w-5 h-5 ml-2 text-red-700" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${isMaintenance ? 'text-red-500' : 'text-gray-500'}`}>Local Atual</p>
                    <p className={`text-lg font-bold ${isMaintenance ? 'text-red-700' : 'text-gray-900'}`}>{vehicle.currentLocation}</p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${isMaintenance ? 'text-red-500' : 'text-gray-500'}`}>Último Local</p>
                    <p className={`text-sm font-medium ${isMaintenance ? 'text-red-600' : 'text-gray-600'}`}>{vehicle.lastLocation || '-'}</p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${isMaintenance ? 'text-red-500' : 'text-gray-500'}`}>Operador</p>
                    <p className={`text-sm font-medium truncate ${isMaintenance ? 'text-red-800' : 'text-gray-800'}`} title={vehicle.operator}>{vehicle.operator}</p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${isMaintenance ? 'text-red-500' : 'text-gray-500'}`}>Registro</p>
                    <p className={`text-sm font-medium truncate ${isMaintenance ? 'text-red-800' : 'text-gray-800'}`} title={vehicle.registration}>{vehicle.registration}</p>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 pt-4">
                  <button
                    onClick={() => setSelectedVehicle(vehicle)}
                    className="w-full bg-metro-blue text-white py-2 px-4 rounded hover:bg-blue-800 transition font-medium flex justify-center items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Atualizar Localização
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => { setHistoryFilter(vehicle.id); setShowHistory(true); }}
                      className={`flex-1 py-2 px-4 rounded transition text-sm font-medium ${
                        isMaintenance 
                          ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Ver Histórico
                    </button>
                    <button
                      onClick={() => toggleStatus(vehicle.id)}
                      className={`flex-1 py-2 px-4 rounded transition text-sm font-medium border ${
                        isMaintenance 
                        ? 'bg-white text-red-700 border-red-200 hover:bg-red-50' 
                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {isMaintenance ? 'Finalizar Manut.' : 'Manutenção'}
                    </button>
                  </div>
                </div>
              </div>
              <div className={`px-4 py-2 border-t text-xs text-right ${
                isMaintenance ? 'bg-red-100 border-red-200 text-red-500' : 'bg-gray-50 border-gray-100 text-gray-400'
              }`}>
                Atualizado em: {new Date(vehicle.lastUpdate).toLocaleTimeString('pt-BR')}
              </div>
            </div>
          )})}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-gray-500">
                © 2025 Companhia do Metropolitano de São Paulo - Metrô
            </p>
        </div>
      </footer>

      {/* Modals */}
      {selectedVehicle && (
        <UpdateModal
          vehicle={selectedVehicle}
          currentUser={currentUser}
          onClose={() => setSelectedVehicle(null)}
          onUpdate={handleUpdateLocation}
        />
      )}

      {showHistory && (
        <HistoryView 
          logs={history} 
          onClose={() => { setShowHistory(false); setHistoryFilter(null); }} 
          vehicleFilter={historyFilter}
        />
      )}
    </div>
  );
}

export default App;
