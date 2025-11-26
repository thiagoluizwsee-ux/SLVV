

import React, { useState, useEffect } from 'react';
import { LocationEnum, Vehicle } from '../types';
import { AVAILABLE_LOCATIONS, OPERATOR_REGISTRY } from '../constants';

interface Props {
  vehicle: Vehicle;
  onClose: () => void;
  onUpdate: (vehicleId: string, newLocation: LocationEnum, operator: string, registration: string) => void;
  currentUser: string;
}

export const UpdateModal: React.FC<Props> = ({ vehicle, onClose, onUpdate, currentUser }) => {
  // Logic to parse existing location (e.g., "Ramal 5 - 1°")
  const parseLocation = (loc: string) => {
    const parts = loc.split(' - ');
    const base = parts[0];
    const pos = parts[1] || '';
    
    // If the base matches a known entry location, return split values
    if (base === LocationEnum.RAMAL_5 || base === LocationEnum.RAMAL_6) {
        return { base: base as LocationEnum, pos };
    }
    // Otherwise return original as base
    return { base: loc as LocationEnum, pos: '' };
  };

  const { base: initialBase, pos: initialPos } = parseLocation(vehicle.currentLocation);

  const [selectedLocation, setSelectedLocation] = useState<LocationEnum>(initialBase);
  const [entryPosition, setEntryPosition] = useState(initialPos);
  
  const [operatorName, setOperatorName] = useState('');
  const [registration, setRegistration] = useState('');

  // Get lists for autocomplete/search
  const knownOperators = Object.keys(OPERATOR_REGISTRY);
  const knownRegistrations = Object.values(OPERATOR_REGISTRY);

  const showEntryPosition = selectedLocation === LocationEnum.RAMAL_5 || selectedLocation === LocationEnum.RAMAL_6;
  const entryPositions = ['1°', '2°', '3°', '4°', '5°'];

  // Clear entry position if switching to a location that doesn't support it
  useEffect(() => {
    if (!showEntryPosition) {
        setEntryPosition('');
    }
  }, [selectedLocation, showEntryPosition]);

  // Helper to remove accents, special chars and lowercase for Names
  // Strips dashes, spaces, dots, etc. for fuzzy matching
  const normalizeString = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "") 
      .toLowerCase();
  };

  // Helper to remove EVERYTHING except letters and numbers for Registration
  // Removes dots, dashes, slashes, spaces, etc.
  const normalizeRegistration = (str: string) => {
    return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  };

  const handleOperatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const isAdding = newValue.length > operatorName.length;
    
    setOperatorName(newValue);

    // Auto-complete logic: 
    // If the user is typing (adding characters) and we have a sufficient length (>=3)
    // and there is EXACTLY one match in the registry starting with the input, auto-fill it.
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
    }
  }, [registration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (operatorName.trim() === '' || registration.trim() === '') return;

    let finalLocation: any = selectedLocation;
    if (showEntryPosition && entryPosition) {
        finalLocation = `${selectedLocation} - ${entryPosition}`;
    }

    onUpdate(vehicle.id, finalLocation, operatorName, registration);
  };

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

          <div className="grid grid-cols-12 gap-4">
            <div className={showEntryPosition ? "col-span-8" : "col-span-12"}>
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
            
            {showEntryPosition && (
                <div className="col-span-4">
                    <label htmlFor="entryPosition" className="block text-sm font-medium text-gray-700 mb-1">
                    Posição de Entrada
                    </label>
                    <select
                        id="entryPosition"
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-metro-blue focus:border-metro-blue bg-white"
                        value={entryPosition}
                        onChange={(e) => setEntryPosition(e.target.value)}
                        required
                    >
                        <option value="">Selecione...</option>
                        {entryPositions.map((pos) => (
                            <option key={pos} value={pos}>{pos}</option>
                        ))}
                    </select>
                </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Operator Field (Left - 3 cols) */}
            <div className="col-span-3">
              <label htmlFor="operator" className="block text-sm font-medium text-gray-700 mb-1">
                Alterado por
              </label>
              <input
                type="text"
                id="operator"
                list="operator-suggestions"
                required
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-metro-blue focus:border-metro-blue bg-white"
                value={operatorName}
                onChange={handleOperatorChange}
                placeholder="Nome"
                autoComplete="off"
              />
              <datalist id="operator-suggestions">
                {knownOperators.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Registration Field (Right - 1 col) */}
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