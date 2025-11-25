
import React, { useState, useEffect } from 'react';
import { LocationEnum, Vehicle } from '../types';
import { AVAILABLE_LOCATIONS } from '../constants';

// Registry of Operators and their Registration IDs
const OPERATOR_REGISTRY: { [key: string]: string } = {
    'Waldemir Angelo Martins': '9101-8',
    'Neimar Mufalo': '14477-4',
    'Antonio Carlos Ribeiro': '18164-5',
    'Luiz Fernando de Souza Arruda': '18484-9',
    'Edivaldo Cordeiro Silva': '19178-1',
    'Osorio Sant Anna Neto': '19182-9',
    'Luiz Claudio dos Santos': '19323-6',
    'William Aldo Teodoro': '19745-2',
    'Luciano Cremonese': '19885-8',
    'Julio Cesar Martins': '20513-7',
    'Fabiano Jose dos Santos': '20766-1',
    'Alencar Marcos de Negri': '20828-4',
    'Josemir Ananias da Silva': '20831-4',
    'Adilson Mendes Damascena': '20910-8',
    'Paulo Jose Furtado': '20957-4',
    'Joao Batista de Araujo': '20961-2',
    'Ivair Ribeiro': '21039-4',
    'Marcio de Jesus Dias': '21040-8',
    'Uilton Antonio de Souza': '21365-2',
    'Carlos Alberto Pereira de Vasconcelos Junior': '21649-0',
    'Sergio Goncalves dos Reis': '21670-8',
    'Fabio Danilo Tolentino': '21786-1',
    'Claudney de Almeida Franco': '21822-1',
    'Luiz Fernando da Silva Domingos': '21825-5',
    'Ricardo Gomes': '22019-5',
    'David Pinto de Oliveira': '22021-7',
    'Jean Carlos Martins dos Santos': '22026-8',
    'Elias Marcos Machado Nemet': '22075-6',
    'Jose Carlos Rios': '22078-1',
    'Luciano Severino da Silva': '22104-3',
    'Osley de Souza Silva': '22117-5',
    'Luiz Antonio Vergilio': '22121-3',
    'Ricardo dos Reis': '22122-1',
    'Alberto Zuchiwschi': '22123-0',
    'Jackson Lima de Mendonca': '22126-4',
    'Helio Ribeiro Avelino de Oliveira': '22161-2',
    'Andre Nunes Lima': '22171-0',
    'Glaucio Ferreira': '22194-9',
    'Carlos Henrique Heilig Sao Severino': '22195-7',
    'Abilio Cardoso dos Santos': '22201-5',
    'Cassiano Ricardo Ferreira de Souza': '22203-1',
    'Carlos Teijido Veira': '22222-8',
    'Leandro Lopes Gomes': '22258-9',
    'Roberto Claudio Luciano': '22259-7',
    'Valdir Felipe dos Santos': '22265-1',
    'Vanilton Pires Viana': '22271-6',
    'Luciano Vieira de Oliveira': '22327-5',
    'Luiz Ferreira': '22357-7',
    'Silvio Villarrazo Junior': '22799-8',
    'Edis Alves de Brito': '22845-5',
    'Ricardo Jose de Oliveira': '22894-3',
    'Cristiano Pereira dos Santos': '22912-5',
    'Wellington de Menezes Santos': '22942-7',
    'Luiz Carlos Moraes Marques': '22951-6',
    'Valdomiro Aparecido Antonio Caetano': '23063-8',
    'Geanderson Nascimento dos Santos': '23167-7',
    'Hernandes da Fonseca Cavalcante': '23200-2',
    'Eduardo Siqueira Junior': '23245-2',
    'Leonardo Ribeiro': '23247-9',
    'Allan Nascimento Romualdo Paixao': '23255-0',
    'Fabio de Vechi': '23858-2',
    'Tiago Vico da Silva': '23876-1',
    'Otniel Moraes de Oliveira': '23902-3',
    'Eduardo Estevao da Silva': '23920-1',
    'Erick Emanoel Sampaio': '23976-7',
    'Cicero Ribeiro Lustoza': '24008-1',
    'Thiago Luiz das Neves': '24026-9',
    'Antonio Pereira da Silva': '24036-6',
    'Jorge Augusto Santos Ribeiro': '24077-3',
    'José Edson de Souza': '24081-1',
    'Rogerio de Sousa Henriques': '24417-5',
    'Antonio Mourao Junior': '24486-8',
    'Luiz Ricardo Mendes': '24588-1',
    'Joselito Santiago Borges': '24590-2',
    'Samuel Miguel de Oliveira': '24998-3',
    'Neomar Santana Garcia': '25002-7',
    'Daniel Augusto Cabral': '25003-5',
    'Fabricio Vicente da Silva': '25260-7',
    'Douglas Viesel': '25265-8',
    'Caio Vinicius Graça dos Santos': '25276-3',
    'Fabio Oliveira de Lima': '26993-3',
    'Danilo Dias de Mello': '27024-9',
    'Ramon Quintino Bastos': '28893-8',
    'Douglas Azevedo de Oliveira': '29048-7',
    'Paulo Martins da Silva Junior': '29521-7',
    'Willian Nunes Rocha Fonseca': '29728-7',
    'Caique Augusto Dos Santos': '31424-6',
    'Adriano Ferreira Nunes Santos': '32522-1',
    'Wanderley Neri Cedraz': '32918-9',
    'Almir Rogério Cyrino': '32919-7',
    'Valdir Tadeu Candido': '16075-3',
    'Ricardo Inicencio da Silva Muta': '33851-0',
    'Manoel Antonio Roque': '13891-0',
    'David Xavier de Brito Costa': '24601-1'
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

  // Get lists for autocomplete/search
  const knownOperators = Object.keys(OPERATOR_REGISTRY);
  const knownRegistrations = Object.values(OPERATOR_REGISTRY);

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
    onUpdate(vehicle.id, selectedLocation, operatorName, registration);
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
