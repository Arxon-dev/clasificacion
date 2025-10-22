import { Candidate } from '../types';

const API_BASE_URL = 'http://localhost:3005/api';

// Configuración de fetch con headers por defecto
const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Interfaz para respuestas de la API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Interfaz para estadísticas
interface CandidateStats {
  total_candidatos: number;
  nota_media: number;
  nota_maxima: number;
  nota_minima: number;
}

// Interfaz para candidato con posición
interface CandidateWithPosition extends Candidate {
  posicion: number;
}

class ApiService {
  // Obtener todos los candidatos
  async getAllCandidates(): Promise<CandidateWithPosition[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/candidates`, fetchConfig);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result: ApiResponse<CandidateWithPosition[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Error al obtener candidatos');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error al obtener candidatos:', error);
      throw new Error('No se pudieron cargar los candidatos. Verifica tu conexión.');
    }
  }

  // Crear o actualizar candidato
  async createOrUpdateCandidate(numeroOpositor: string, nota: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/candidates`, {
        method: 'POST',
        ...fetchConfig,
        body: JSON.stringify({
          numeroOpositor: numeroOpositor.trim(),
          nota: parseFloat(nota.toString())
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      const result: ApiResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Error al procesar candidato');
      }
      
      return result;
    } catch (error) {
      console.error('Error al crear/actualizar candidato:', error);
      throw error;
    }
  }

  // Buscar candidato por número
  async searchCandidate(numeroOpositor: string): Promise<CandidateWithPosition | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/${encodeURIComponent(numeroOpositor.trim())}`, fetchConfig);
      
      if (response.status === 404) {
        return null; // Candidato no encontrado
      }
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result: ApiResponse<CandidateWithPosition> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Error al buscar candidato');
      }
      
      return result.data || null;
    } catch (error) {
      console.error('Error al buscar candidato:', error);
      throw new Error('No se pudo buscar el candidato. Verifica tu conexión.');
    }
  }

  // Obtener estadísticas
  async getStats(): Promise<CandidateStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/stats`, fetchConfig);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result: ApiResponse<CandidateStats> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Error al obtener estadísticas');
      }
      
      return result.data || {
        total_candidatos: 0,
        nota_media: 0,
        nota_maxima: 0,
        nota_minima: 0
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error('No se pudieron cargar las estadísticas.');
    }
  }

  // Health check del servidor
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, fetchConfig);
      const result = await response.json();
      return result.success || false;
    } catch (error) {
      console.error('Error en health check:', error);
      return false;
    }
  }

  // Eliminar candidato (soft delete)
  async deleteCandidate(numeroOpositor: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/${encodeURIComponent(numeroOpositor.trim())}`, {
        method: 'DELETE',
        ...fetchConfig,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      const result: ApiResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Error al eliminar candidato');
      }
      
      return result;
    } catch (error) {
      console.error('Error al eliminar candidato:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const apiService = new ApiService();

// Exportar tipos para uso en componentes
export type { CandidateStats, CandidateWithPosition, ApiResponse };