
import React, { useState, useEffect } from 'react';
import { LocationEnum, Vehicle } from '../types';
import { AVAILABLE_LOCATIONS } from '../constants';

// Registry of Operators and their Registration IDs
const OPERATOR_REGISTRY: { [key: string]: string } = {
  'Thiago Luiz das Neves': '24026-9',
  'Edivaldo': '19178-1',
  'Tiago Vico': '9999',
  'Adilson Mendes Damascena': '20910-8',
  'Abílio': '22201-5',
  'Fabio Vech': '7777',
  'Eduardo': '23920-1',
  'Márcio': '21040-8',
  'José Edson': '24081-1',
  'Danilo Dias de Mello': '33334-4'
};

interface Props {
  vehicle: Vehicle;
  onClose: () => void;
  onUpdate: (vehicleId: string, newLocation: LocationEnum, operator: string, registration: string) => void;
  currentUser: string;
}

export const UpdateModal: React.FC<Props> = ({ vehicle, onClose, onUpdate, currentUser }) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationEnum>(vehicle.currentLocation);
  const [operatorName, setOperatorName] = useState('');
  const [registration, setRegistration] = useState('');

  // Helper to remove accents and lowercase for Names
  const normalizeString = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  // Helper to remove EVERYTHING except letters and numbers for Registration
  // Removes dots, dashes, slashes, spaces, etc.
  const normalizeRegistration = (str: string) => {
    return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  };

  // Effect 1: Auto-fill registration when Operator Name changes
  useEffect(() => {
    const normalizedInput = normalizeString(operatorName);
    if (!normalizedInput) return;
    
    // Find key where normalized key matches normalized input
    const matchedKey = Object.keys(OPERATOR_REGISTRY).find(
      key => normalizeString(key) === normalizedInput
    );

    // Only update if we found a match and the registration field is different
    if (matchedKey && OPERATOR_REGISTRY[matchedKey] !== registration) {
      setRegistration(OPERATOR_REGISTRY[matchedKey]);
    }
  }, [operatorName]);

  // Effect 2: Auto-fill Operator Name when Registration changes (Reverse Lookup)
  useEffect(() => {
    const cleanInput = normalizeRegistration(registration);
    if (!cleanInput) return;

    // Find key (Name) by value (Registration)
    const matchedName = Object.keys(OPERATOR_REGISTRY).find(key => {
        const cleanRegistry = normalizeRegistration(OPERATOR_REGISTRY[key]);
        
        // Match conditions:
        // 1. Exact match
        // 2. "5 Digit Rule": If input is exactly 5 chars, checks if registry STARTS with it (e.g. "24026" matches "240269")
        return cleanRegistry === cleanInput || 
               (cleanInput.length === 5 && cleanRegistry.startsWith(cleanInput));
    });

    // If match found
    if (matchedName) {
        // Update Name
        if (matchedName !== operatorName) {
            setOperatorName(matchedName);
        }
        
        // REMOVED: Forced registration update.
        // Previously, this would force the full formatted registration back into the field
        // preventing the user from backspacing/editing if they matched the 5-digit rule.
    }
  }, [registration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (operatorName.trim() === '' || registration.trim() === '') return;
    onUpdate(vehicle.id, selectedLocation, operatorName, registration);
  };

  // Get list of known registrations for autocomplete
  const knownRegistrations = Object.values(OPERATOR_REGISTRY);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 m-4">
        <h2 className="text-xl font-bold text-metro-blue mb-4">
          Atualizar Localização - {vehicle.id}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localização Atual</label>
            <div className="p-2 bg-gray-100 rounded text-gray-600">{vehicle.currentLocation}</div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Nova Localização
            </label>
            <select
              id="location"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-metro-blue focus:border-metro-blue bg-white"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value as LocationEnum)}
            >
              {AVAILABLE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} disabled={loc === vehicle.currentLocation}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Registration Field (Left - 1 col) */}
            <div className="col-span-1">
              <label htmlFor="registration" className="block text-sm font-medium text-gray-700 mb-1">
                Registro
              </label>
              <input
                type="text"
                id="registration"
                list="registration-suggestions" // Link to datalist
                required
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-metro-blue focus:border-metro-blue bg-white"
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                placeholder="Registro"
                autoComplete="off"
              />
              {/* Datalist for Autocomplete */}
              <datalist id="registration-suggestions">
                {knownRegistrations.map((reg) => (
                  <option key={reg} value={reg} />
                ))}
              </datalist>
            </div>

            {/* Operator Field (Right - 2 cols) */}
            <div className="col-span-2">
              <label htmlFor="operator" className="block text-sm font-medium text-gray-700 mb-1">
                Operador
              </label>
              <input
                type="text"
                id="operator"
                required
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-metro-blue focus:border-metro-blue bg-white"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Nome"
              />
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
              className="px-4 py-2 text-sm font-medium text-white bg-metro-blue hover:bg-metro-dark rounded-md shadow-sm"
            >
              Confirmar Atualização
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
