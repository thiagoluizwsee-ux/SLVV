import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleStatus } from '../types';
import { OPERATOR_REGISTRY } from '../constants';

interface Props {
  vehicle: Vehicle;
  onClose: () => void;
  onConfirm: (vehicleId: string, operator: string, registration: string) => void;
}

export const StatusModal: React.FC<Props> = ({ vehicle, onClose, onConfirm }) => {
  const [operatorName, setOperatorName] = useState('');
  const [registration, setRegistration] = useState('');

  const isEnteringMaintenance = vehicle.status === VehicleStatus.OPERATION;
  const targetStatus = isEnteringMaintenance ? VehicleStatus.MAINTENANCE : VehicleStatus.OPERATION;

  // Get lists for autocomplete/search
  const knownOperators = Object.keys(OPERATOR_REGISTRY);
  const knownRegistrations = Object.values(OPERATOR_REGISTRY);

  // Helper to remove accents, special chars and lowercase for Names
  const normalizeString = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "") 
      .toLowerCase();
  };

  // Helper to remove EVERYTHING except letters and numbers for Registration
  const normalizeRegistration = (str: string) => {
    return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  };

  const handleOperatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const isAdding = newValue.length > operatorName.length;
    
    setOperatorName(newValue);

    if (isAdding && newValue.length >= 3) {
        const normalizedInput = normalizeString(newValue);
        const matches = knownOperators.filter(op => 
            normalizeString(op).startsWith(normalizedInput)
        );
        
        if (matches.length === 1) {
            setOperatorName(matches[0]);
        }
    }
  };

  // Effect 1: Auto-fill registration when Operator Name changes
  useEffect(() => {
    const normalizedInput = normalizeString(operatorName);
    if (!normalizedInput) return;
    
    const matchedKey = Object.keys(OPERATOR_REGISTRY).find(
      key => normalizeString(key) === normalizedInput
    );

    if (matchedKey && OPERATOR_REGISTRY[matchedKey] !== registration) {
      setRegistration(OPERATOR_REGISTRY[matchedKey]);
    }
  }, [operatorName]);

  // Effect 2: Auto-fill Operator Name when Registration changes
  useEffect(() => {
    const cleanInput = normalizeRegistration(registration);
    if (!cleanInput) return;

    const matchedName = Object.keys(OPERATOR_REGISTRY).find(key => {
        const cleanRegistry = normalizeRegistration(OPERATOR_REGISTRY[key]);
        return cleanRegistry === cleanInput || 
               (cleanInput.length === 5 && cleanRegistry.startsWith(cleanInput));
    });

    if (matchedName && matchedName !== operatorName) {
        setOperatorName(matchedName);
    }
  }, [registration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (operatorName.trim() === '' || registration.trim() === '') return;
    onConfirm(vehicle.id, operatorName, registration);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4">
        <h2 className="text-xl font-bold text-metro-blue mb-4">
          Alterar Status - {vehicle.id}
        </h2>
        
        <p className="text-gray-600 mb-6">
            Você está alterando o status de <strong className={isEnteringMaintenance ? "text-green-600" : "text-red-600"}>{vehicle.status}</strong> para <strong className={isEnteringMaintenance ? "text-red-600" : "text-green-600"}>{targetStatus}</strong>.
            {isEnteringMaintenance && (
                <span className="block mt-2 text-sm text-red-500 font-semibold">
                    * O veículo será movido automaticamente para a Oficina.
                </span>
            )}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {/* Operator Field (Left - 3 cols) */}
            <div className="col-span-3">
              <label htmlFor="status-operator" className="block text-sm font-medium text-gray-700 mb-1">
                Alterado por
              </label>
              <input
                type="text"
                id="status-operator"
                list="status-operator-suggestions"
                required
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-metro-blue focus:border-metro-blue bg-white"
                value={operatorName}
                onChange={handleOperatorChange}
                placeholder="Nome"
                autoComplete="off"
              />
              <datalist id="status-operator-suggestions">
                {knownOperators.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Registration Field (Right - 1 col) */}
            <div className="col-span-1">
              <label htmlFor="status-registration" className="block text-sm font-medium text-gray-700 mb-1">
                Registro
              </label>
              <input
                type="text"
                id="status-registration"
                list="status-registration-suggestions"
                required
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-metro-blue focus:border-metro-blue bg-white"
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                placeholder="Registro"
                autoComplete="off"
              />
              <datalist id="status-registration-suggestions">
                {knownRegistrations.map((reg) => (
                  <option key={reg} value={reg} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm ${
                isEnteringMaintenance ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Confirmar {isEnteringMaintenance ? 'Manutenção' : 'Operação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};