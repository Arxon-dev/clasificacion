import React, { useState } from 'react';
import type { Candidate } from '../types';

interface SubmissionFormProps {
  onAddCandidate: (candidate: Candidate) => Promise<void>;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ onAddCandidate }) => {
  const [id, setId] = useState('');
  const [score, setScore] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!id.trim()) {
      setError('El número de opositor no puede estar vacío.');
      return;
    }

    const scoreNumber = parseFloat(score);
    if (isNaN(scoreNumber) || scoreNumber < 0 || scoreNumber > 200) {
      setError('La nota debe ser un número entre 0 y 200.');
      return;
    }
    
    if (!consent) {
      setError('Debes aceptar la publicación de tus datos para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddCandidate({ id: id.trim(), score: scoreNumber });
      setId('');
      setScore('');
      setConsent(false);
    } catch (error) {
      // El error ya se maneja en App.tsx, pero podemos mostrar un mensaje genérico aquí
      setError('Error al enviar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold text-center text-green-400 uppercase tracking-wider mb-4">Añadir tu nota</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="candidateId" className="block text-sm font-medium text-gray-300 mb-1">
            Número de Opositor
          </label>
          <input
            id="candidateId"
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Ej: 12345678X"
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label htmlFor="score" className="block text-sm font-medium text-gray-300 mb-1">
            Nota (0-200)
          </label>
          <input
            id="score"
            type="number"
            step="0.01"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="Ej: 155.75"
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div className="flex items-start">
            <div className="flex items-center h-5">
                <input
                    id="consent"
                    name="consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="focus:ring-green-500 h-4 w-4 text-green-600 bg-gray-700 border-gray-600 rounded"
                />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor="consent" className="font-medium text-gray-300">
                    Acepto la publicación de mi Nº de Opositor y nota.
                </label>
                <p className="text-gray-500 text-xs mt-1">
                    Entiendo que esta es una herramienta no oficial y que los datos son visibles para otros usuarios.
                </p>
            </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={!consent || isSubmitting}
          className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Enviando...
            </>
          ) : (
            'Publicar y Ver Posición'
          )}
        </button>
      </form>
    </div>
  );
};

export default SubmissionForm;