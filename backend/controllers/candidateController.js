import { Candidate } from '../models/Candidate.js';
import { validateCandidate } from '../middleware/validation.js';

// Obtener todos los candidatos (clasificación)
export const getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.getAll();
    
    res.status(200).json({
      success: true,
      data: candidates,
      count: candidates.length,
      message: 'Candidatos obtenidos correctamente'
    });
  } catch (error) {
    console.error('Error en getAllCandidates:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear o actualizar un candidato
export const createOrUpdateCandidate = async (req, res) => {
  try {
    const { error } = validateCandidate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { numeroOpositor, nota } = req.body;
    const ipRegistro = req.ip || req.connection.remoteAddress;

    // Verificar si el candidato ya existe
    const exists = await Candidate.exists(numeroOpositor);
    
    // Verificar si esta IP ya registró un candidato (solo para nuevos registros)
    if (!exists) {
      const ipAlreadyRegistered = await Candidate.hasIpRegistered(ipRegistro);
      if (ipAlreadyRegistered) {
        const existingCandidate = await Candidate.findByIp(ipRegistro);
        return res.status(409).json({
          success: false,
          message: 'Ya has registrado un candidato desde esta ubicación',
          data: {
            numeroOpositor: existingCandidate?.numero_opositor,
            nota: existingCandidate?.nota,
            fechaRegistro: existingCandidate?.fecha_registro
          }
        });
      }
    }
    
    const result = await Candidate.createOrUpdate(numeroOpositor, nota, ipRegistro);
    
    res.status(exists ? 200 : 201).json({
      success: true,
      data: {
        numeroOpositor,
        nota,
        isUpdate: result.isUpdate
      },
      message: result.message
    });
  } catch (error) {
    console.error('Error en createOrUpdateCandidate:', error);
    
    // Manejar errores específicos de MySQL
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'El número de opositor ya existe'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Buscar un candidato específico
export const getCandidateByNumber = async (req, res) => {
  try {
    const { numeroOpositor } = req.params;
    
    if (!numeroOpositor || numeroOpositor.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Número de opositor requerido'
      });
    }

    const candidate = await Candidate.findByNumber(numeroOpositor.trim());
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidato no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: candidate,
      message: 'Candidato encontrado'
    });
  } catch (error) {
    console.error('Error en getCandidateByNumber:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener estadísticas generales
export const getStats = async (req, res) => {
  try {
    const stats = await Candidate.getStats();
    
    res.status(200).json({
      success: true,
      data: stats,
      message: 'Estadísticas obtenidas correctamente'
    });
  } catch (error) {
    console.error('Error en getStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar un candidato
export const deleteCandidate = async (req, res) => {
  try {
    const { numeroOpositor } = req.params;
    
    if (!numeroOpositor || numeroOpositor.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Número de opositor requerido'
      });
    }

    const result = await Candidate.delete(numeroOpositor.trim());
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error en deleteCandidate:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener historial de un candidato
export const getCandidateHistory = async (req, res) => {
  try {
    const { numeroOpositor } = req.params;
    
    if (!numeroOpositor || numeroOpositor.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Número de opositor requerido'
      });
    }

    const history = await Candidate.getHistory(numeroOpositor.trim());
    
    res.status(200).json({
      success: true,
      data: history,
      count: history.length,
      message: 'Historial obtenido correctamente'
    });
  } catch (error) {
    console.error('Error en getCandidateHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Health check endpoint
export const healthCheck = async (req, res) => {
  try {
    // Intentar obtener estadísticas (funciona tanto con BD como con memoria)
    const stats = await Candidate.getStats();
    
    res.status(200).json({
      success: true,
      message: 'API funcionando correctamente',
      timestamp: new Date().toISOString(),
      database: stats.storage_mode || 'Conectado',
      totalCandidates: stats.total_candidatos,
      mode: stats.storage_mode === 'memory' ? 'Modo memoria (temporal)' : 'Modo base de datos'
    });
  } catch (error) {
    // Si incluso el fallback a memoria falla, entonces hay un problema serio
    console.error('Error en healthCheck:', error);
    res.status(503).json({
      success: false,
      message: 'Servicio no disponible',
      timestamp: new Date().toISOString(),
      database: 'Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};