import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Configuración de CORS
export const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (aplicaciones móviles, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const allowedOrigins = [
      frontendUrl,
      frontendUrl.replace(/\/$/, ''), // Sin barra final
      frontendUrl + (frontendUrl.endsWith('/') ? '' : '/'), // Con barra final
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'https://clasificacion-three.vercel.app',
      'https://clasificacion-9larq88ay-opomelillas-projects.vercel.app'
    ];
    
    console.log(`🔍 CORS: Verificando origen: ${origin}`);
    console.log(`🔍 CORS: Orígenes permitidos:`, allowedOrigins);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS: Origen permitido: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`🚫 CORS: Origen no permitido: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Rate limiting para prevenir abuso
export const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs: windowMs, // 15 minutos por defecto
    max: max, // límite de requests por ventana de tiempo
    message: {
      success: false,
      message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`🚫 Rate limit excedido para IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Rate limiting específico para endpoints sensibles
export const strictRateLimit = createRateLimit(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50 // 50 requests
);

// Rate limiting para creación/actualización de candidatos
export const candidateRateLimit = createRateLimit(
  5 * 60 * 1000, // 5 minutos
  process.env.NODE_ENV === 'development' ? 100 : 10 // 100 en desarrollo, 10 en producción
);

// Configuración de Helmet para seguridad
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Middleware para logging de requests
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    console.log(`${method} ${url} - ${statusCode} - ${duration}ms - ${ip}`);
  });
  
  next();
};

// Middleware para manejo de errores
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  
  // Error de CORS
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado por política CORS'
    });
  }
  
  // Error de validación de JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido en el cuerpo de la petición'
    });
  }
  
  // Error genérico
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Middleware para rutas no encontradas
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.url}`,
    availableEndpoints: {
      candidates: {
        'GET /api/candidates': 'Obtener todos los candidatos',
        'POST /api/candidates': 'Crear/actualizar candidato',
        'GET /api/candidates/:numeroOpositor': 'Buscar candidato',
        'GET /api/candidates/stats': 'Obtener estadísticas',
        'GET /api/health': 'Health check'
      }
    }
  });
};