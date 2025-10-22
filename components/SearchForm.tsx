import React, { useState } from 'react';

interface SearchFormProps {
  onSearch: (id: string) => Promise<void>;
  onClear: () => void;
  disabled: boolean;
  searchError: string | null;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, onClear, disabled, searchError }) => {
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchId.trim() || isSearching) return;
    
    setIsSearching(true);
    try {
      await onSearch(searchId.trim());
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearClick = () => {
    setSearchId('');
    onClear();
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg w-full max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold text-center text-green-400 uppercase tracking-wider mb-4">Buscar Opositor</h2>
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        <div>
          <label htmlFor="searchId" className="block text-sm font-medium text-gray-300 mb-1">
            Número de Opositor
          </label>
          <input
            id="searchId"
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Introduce el número a buscar"
            disabled={disabled}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
          />
        </div>
        {searchError && <p className="text-red-400 text-sm">{searchError}</p>}
        <div className="flex space-x-4">
           <button
             type="submit"
             disabled={disabled || !searchId.trim() || isSearching}
             className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
           >
             {isSearching ? (
               <>
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                 Buscando...
               </>
             ) : (
               'Buscar'
             )}
           </button>
           <button
             type="button"
             onClick={handleClearClick}
             disabled={disabled}
             className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out uppercase tracking-wider disabled:opacity-50"
           >
             Limpiar
           </button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;