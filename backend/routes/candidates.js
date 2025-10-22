import express from 'express';
import {
  getAllCandidates,
  createOrUpdateCandidate,
  getCandidateByNumber,
  getStats,
  deleteCandidate,
  getCandidateHistory,
  healthCheck
} from '../controllers/candidateController.js';
import { 
  validate, 
  validateParams, 
  candidateSchema, 
  numeroOpositorParamSchema 
} from '../middleware/validation.js';
import { candidateRateLimit } from '../middleware/security.js';

const router = express.Router();

// Health check
router.get('/health', healthCheck);

// Obtener todos los candidatos (clasificación)
router.get('/', getAllCandidates);

// Obtener estadísticas generales
router.get('/stats', getStats);

// Buscar candidato por número
router.get('/:numeroOpositor', 
  validateParams(numeroOpositorParamSchema),
  getCandidateByNumber
);

// Obtener historial de un candidato
router.get('/:numeroOpositor/history', 
  validateParams(numeroOpositorParamSchema),
  getCandidateHistory
);

// Crear o actualizar candidato
router.post('/', 
  candidateRateLimit,
  validate(candidateSchema),
  createOrUpdateCandidate
);

// Actualizar candidato (PUT)
router.put('/:numeroOpositor', 
  candidateRateLimit,
  validateParams(numeroOpositorParamSchema),
  validate(candidateSchema),
  createOrUpdateCandidate
);

// Eliminar candidato (soft delete)
router.delete('/:numeroOpositor', 
  validateParams(numeroOpositorParamSchema),
  deleteCandidate
);

export default router;