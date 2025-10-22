import React, { useEffect, useRef } from 'react';
import type { CandidateWithPosition } from '../services/api';

interface ResultsTableProps {
  candidates: CandidateWithPosition[];
  currentUserCandidateId: string | null;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ candidates, currentUserCandidateId }) => {
  const rowRefs = useRef<Map<string, HTMLTableRowElement | null>>(new Map());

  useEffect(() => {
    if (currentUserCandidateId) {
      const rowEl = rowRefs.current.get(currentUserCandidateId);
      // Timeout ensures the element is in the DOM and painted before we try to scroll
      const timer = setTimeout(() => {
        rowEl?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentUserCandidateId, candidates]);


  if (candidates.length === 0) {
    return (
      <div className="mt-8 text-center text-gray-400">
        <p>Aún no hay datos. ¡Sé el primero en publicar tu nota!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
        <h2 className="text-xl font-bold text-center text-green-400 uppercase tracking-wider p-4 bg-gray-900/50">Clasificación Provisional</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-gray-700 responsive-table">
          <thead className="bg-gray-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Posición
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Nº Opositor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Nota
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700 md:divide-y-0">
            {candidates.map((candidate) => {
              const isCurrentUser = candidate.id === currentUserCandidateId;
              return (
                <tr
                  key={candidate.id}
                  // FIX: The ref callback should not return a value. `Map.set` returns the map,
                  // so we wrap it in a block to ensure an implicit `undefined` return.
                  ref={el => { rowRefs.current.set(candidate.id, el); }}
                  className={`${isCurrentUser ? 'bg-green-900/50' : ''} md:hover:bg-gray-700/50 transition-colors duration-300`}
                >
                  <td data-label="Posición" className={`px-6 py-2 md:py-4 whitespace-nowrap font-bold ${isCurrentUser ? 'text-green-300' : 'text-white'}`}>
                    {candidate.posicion}
                  </td>
                  <td data-label="Nº Opositor" className="px-6 py-2 md:py-4 whitespace-nowrap text-gray-300">{candidate.id}</td>
                  <td data-label="Nota" className="px-6 py-2 md:py-4 whitespace-nowrap text-gray-300 font-semibold">
                    {candidate.score ? Number(candidate.score).toFixed(2) : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;