import React, { useState, useCallback, useEffect } from 'react';
import SubmissionForm from './components/SubmissionForm';
import ResultsTable from './components/ResultsTable';
import SearchForm from './components/SearchForm';
import type { Candidate } from './types';
import { apiService, type CandidateWithPosition } from './services/api';

const SpanishArmyShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-green-500">
        <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.927 0l-8.25 4.5a.75.75 0 000 1.322l8.25 4.5a.75.75 0 001.927 0l8.25-4.5a.75.75 0 000-1.322l-8.25-4.5z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M21.75 12.75a.75.75 0 01-.75.75h-9a.75.75 0 010-1.5h9a.75.75 0 01.75.75zM2.25 12.75a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zM12 15a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V15.75a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);


function App() {
  const [candidates, setCandidates] = useState<CandidateWithPosition[]>([]);
  const [currentUserCandidateId, setCurrentUserCandidateId] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [serverStatus, setServerStatus] = useState<boolean>(false);

  // Cargar datos iniciales y verificar estado del servidor
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Verificar estado del servidor
        const isServerHealthy = await apiService.healthCheck();
        setServerStatus(isServerHealthy);

        if (isServerHealthy) {
          // Cargar candidatos existentes
          const candidatesData = await apiService.getAllCandidates();
          setCandidates(candidatesData);
        }
      } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        setServerStatus(false);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleAddCandidate = useCallback(async (newCandidate: Candidate) => {
    setSearchError(null);
    
    try {
      // Enviar candidato al backend
      await apiService.createOrUpdateCandidate(newCandidate.id, newCandidate.score);
      
      // Recargar la lista de candidatos para obtener las posiciones actualizadas
      const updatedCandidates = await apiService.getAllCandidates();
      setCandidates(updatedCandidates);
      setCurrentUserCandidateId(newCandidate.id);
    } catch (error) {
      console.error('Error al agregar candidato:', error);
      setSearchError(error instanceof Error ? error.message : 'Error al procesar el candidato');
    }
  }, []);

  const handleSearch = useCallback(async (id: string) => {
    setSearchError(null);
    
    try {
      const foundCandidate = await apiService.searchCandidate(id);
      if (foundCandidate) {
        setCurrentUserCandidateId(foundCandidate.id);
      } else {
        setSearchError('El número de opositor no se ha encontrado en la lista.');
        setCurrentUserCandidateId(null);
      }
    } catch (error) {
      console.error('Error al buscar candidato:', error);
      setSearchError(error instanceof Error ? error.message : 'Error al buscar el candidato');
      setCurrentUserCandidateId(null);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setCurrentUserCandidateId(null);
    setSearchError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8 flex flex-col items-center">
            <SpanishArmyShieldIcon />
            <h1 className="text-3xl md:text-4xl font-extrabold text-green-400 uppercase tracking-widest mt-2">
                Clasificación Oposición
            </h1>
            <p className="text-lg text-gray-400">Ejército de Tierra</p>
            <p className="text-md text-green-300 font-semibold mt-1">Agrupación de Especialidades Operativas (AEO)</p>
        </header>
        
        <main>
          {/* Indicador de estado del servidor */}
          {!serverStatus && !loading && (
            <div className="bg-red-900/50 border-l-4 border-red-400 text-red-200 p-4 rounded-md mb-4 shadow-lg" role="alert">
              <div className="flex">
                <div className="py-1">
                  <svg className="fill-current h-6 w-6 text-red-400 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Servidor No Disponible</p>
                  <p className="text-sm">No se puede conectar con el servidor. Los datos no se guardarán permanentemente.</p>
                </div>
              </div>
            </div>
          )}

          {/* Indicador de carga */}
          {loading && (
            <div className="bg-blue-900/50 border-l-4 border-blue-400 text-blue-200 p-4 rounded-md mb-4 shadow-lg" role="alert">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mr-4"></div>
                <div>
                  <p className="font-bold">Cargando...</p>
                  <p className="text-sm">Conectando con el servidor y cargando datos.</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-900/50 border-l-4 border-yellow-400 text-yellow-200 p-4 rounded-md mb-8 shadow-lg" role="alert">
            <div className="flex">
              <div className="py-1">
                <svg className="fill-current h-6 w-6 text-yellow-400 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8h2v-2H9v2z"/></svg>
              </div>
              <div>
                <p className="font-bold">Aviso Importante</p>
                <p className="text-sm">Esta es una herramienta NO OFICIAL creada por OpoMelilla.com para la AEO. Los datos son introducidos por los usuarios y pueden no ser 100% ciertos o completos. <span className="font-semibold block mt-1">La clasificación es solo estimativa y referencial, y NO sustituye la publicación oficial de resultados.</span></p>
              </div>
            </div>
          </div>

          <SubmissionForm onAddCandidate={handleAddCandidate} />
          
          <SearchForm 
            onSearch={handleSearch} 
            onClear={handleClearSearch} 
            disabled={candidates.length === 0} 
            searchError={searchError} 
          />
          
          <ResultsTable candidates={candidates} currentUserCandidateId={currentUserCandidateId} />

        </main>

        <footer className="text-center mt-12 text-xs text-gray-500">
            <p>
              {serverStatus 
                ? "Los datos se guardan en el servidor y persisten entre sesiones." 
                : "Los datos introducidos se almacenan temporalmente y se perderán al recargar la página."
              }
            </p>
            <p>&copy; {new Date().getFullYear()} - Herramienta para la comunidad de opositores.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;