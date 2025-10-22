import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { testConnection, closePool } from './config/database.js';
import candidatesRoutes from './routes/candidates.js';
import {
  corsOptions,
  helmetConfig,
  strictRateLimit,
  candidateRateLimit,
  requestLogger,
  errorHandler,
  notFoundHandler
} from './middleware/security.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// =====================================================
// MIDDLEWARE GLOBAL
// =====================================================

// Seguridad
app.use(helmetConfig);

// CORS
app.use(cors(corsOptions));

// Rate limiting global
app.use(strictRateLimit);

// Parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Trust proxy para obtener IP real (si usas proxy/load balancer)
app.set('trust proxy', 1);

// =====================================================
// RUTAS
// =====================================================

// Health check básico
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Clasificación de Oposiciones - Ejército de Tierra',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      candidates: '/api/candidates',
      stats: '/api/candidates/stats'
    }
  });
});

// Rutas de candidatos
app.use('/api/candidates', candidatesRoutes);

// Health check detallado
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    
    res.status(dbConnected ? 200 : 503).json({
      success: dbConnected,
      message: dbConnected ? 'Servicio funcionando correctamente' : 'Problemas de conectividad',
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnected ? 'Conectado' : 'Desconectado',
        api: 'Funcionando'
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Error en health check',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Ruta no encontrada
app.use('*', notFoundHandler);

// Manejo global de errores
app.use(errorHandler);

// =====================================================
// INICIO DEL SERVIDOR
// =====================================================

const startServer = async () => {
  try {
    // Probar conexión a la base de datos (opcional por ahora)
    console.log('🔄 Probando conexión a la base de datos...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.warn('⚠️  No se pudo conectar a la base de datos MySQL');
      console.warn('💡 El servidor funcionará en modo memoria temporal');
      console.warn('💡 Para persistencia, configura MySQL en el archivo .env');
    }

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log('🚀 ================================');
      console.log(`🚀 Servidor iniciado correctamente`);
      console.log(`🚀 Puerto: ${PORT}`);
      console.log(`🚀 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀 URL: http://localhost:${PORT}`);
      console.log(`🚀 API: http://localhost:${PORT}/api`);
      console.log(`🚀 Health: http://localhost:${PORT}/api/health`);
      console.log('🚀 ================================');
    });

    // Manejo de cierre graceful
    const gracefulShutdown = async (signal) => {
      console.log(`\n🔄 Recibida señal ${signal}, cerrando servidor...`);
      
      server.close(async () => {
        console.log('🔒 Servidor HTTP cerrado');
        
        try {
          await closePool();
          console.log('✅ Cierre graceful completado');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error durante el cierre:', error);
          process.exit(1);
        }
      });
    };

    // Escuchar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Excepción no capturada:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      console.error('En:', promise);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor solo si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;