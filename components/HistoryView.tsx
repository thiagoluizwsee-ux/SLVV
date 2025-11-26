import React, { useState } from 'react';
import { HistoryLog } from '../types';

interface Props {
  logs: HistoryLog[];
  onClose: () => void;
  vehicleFilter?: string | null;
}

export const HistoryView: React.FC<Props> = ({ logs, onClose, vehicleFilter }) => {
  // Filter States
  const [filters, setFilters] = useState({
    date: '',
    vehicle: '',
    action: '',
    details: '',
    registration: '',
    operator: ''
  });

  const filteredLogs = logs.filter(log => {
    // 1. Pre-filter by Vehicle ID if modal is specific
    if (vehicleFilter && log.vehicleId !== vehicleFilter) return false;

    // 2. Column Filters
    const dateStr = new Date(log.timestamp).toLocaleString('pt-BR').toLowerCase();
    
    // Determine action label for filtering
    let actionLabel = '';
    if (log.actionType === 'LOCATION_UPDATE') {
        actionLabel = 'movimentação';
    } else {
        // Check details to distinguish between Retido (Manutenção) and Liberado (Em Operação)
        if (log.details?.includes('Manutenção')) {
            actionLabel = 'retido manutenção';
        } else {
            actionLabel = 'liberado status em operação';
        }
    }
    
    // Normalize helper - Strips accents AND special chars/spaces for fuzzy filtering
    const norm = (str: string) => str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "") : "";
    
    return (
      norm(dateStr).includes(norm(filters.date)) &&
      norm(log.vehicleId).includes(norm(filters.vehicle)) &&
      norm(actionLabel).includes(norm(filters.action)) &&
      norm(log.details || '').includes(norm(filters.details)) &&
      norm(log.registration || '').includes(norm(filters.registration)) &&
      norm(log.operator).includes(norm(filters.operator))
    );
  });

  // Sort by newest first
  const sortedLogs = [...filteredLogs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl p-6 m-4 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-metro-blue">
            {vehicleFilter ? `Histórico - ${vehicleFilter}` : 'Histórico Geral da Frota'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {sortedLogs.length === 0 && logs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum registro encontrado.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[150px]">Data/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[100px]">Veículo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[120px]">Ação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[200px]">Detalhes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[150px]">Alterado por</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[120px]">Registro</th>
                </tr>
                {/* Filter Row */}
                <tr className="bg-gray-50">
                  <th className="px-2 py-1"><input className="w-full text-xs p-1 border rounded" placeholder="Filtrar Data" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} /></th>
                  <th className="px-2 py-1"><input className="w-full text-xs p-1 border rounded" placeholder="Filtrar Veículo" value={filters.vehicle} onChange={e => setFilters({...filters, vehicle: e.target.value})} /></th>
                  <th className="px-2 py-1"><input className="w-full text-xs p-1 border rounded" placeholder="Filtrar Ação" value={filters.action} onChange={e => setFilters({...filters, action: e.target.value})} /></th>
                  <th className="px-2 py-1"><input className="w-full text-xs p-1 border rounded" placeholder="Filtrar Detalhes" value={filters.details} onChange={e => setFilters({...filters, details: e.target.value})} /></th>
                  <th className="px-2 py-1"><input className="w-full text-xs p-1 border rounded" placeholder="Filtrar Alterado por" value={filters.operator} onChange={e => setFilters({...filters, operator: e.target.value})} /></th>
                  <th className="px-2 py-1"><input className="w-full text-xs p-1 border rounded" placeholder="Filtrar Reg." value={filters.registration} onChange={e => setFilters({...filters, registration: e.target.value})} /></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-metro-blue">
                      {log.vehicleId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.actionType === 'LOCATION_UPDATE' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Movimentação
                        </span>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.details?.includes('Manutenção') 
                            ? 'bg-red-100 text-red-800' // Retido
                            : 'bg-green-100 text-green-800' // Liberado
                        }`}>
                          {log.details?.includes('Manutenção') ? 'Retido' : 'Liberado'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                       {log.actionType === 'LOCATION_UPDATE' 
                         ? `${(log.previousLocation || 'N/A').split(' - ')[0]} ➝ ${log.newLocation.split(' - ')[0]}`
                         : log.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.operator}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.registration || (log.details?.startsWith('Registro: ') ? log.details.replace('Registro: ', '') : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};