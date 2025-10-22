import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del pool de conexiones
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'oposicion_ejercito',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  charset: 'utf8mb4',
  timezone: '+00:00',
  waitForConnections: true,
  queueLimit: 0
};

// Crear pool de conexiones para mejor rendimiento
const pool = mysql.createPool(poolConfig);

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log(`📊 Base de datos: ${poolConfig.database}`);
    console.log(`🌐 Host: ${poolConfig.host}:${poolConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    return false;
  }
};

// Función para ejecutar consultas
export const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ Error en consulta SQL:', error.message);
    throw error;
  }
};

// Función para obtener una conexión del pool
export const getConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('❌ Error al obtener conexión:', error.message);
    throw error;
  }
};

// Cerrar el pool de conexiones
export const closePool = async () => {
  try {
    await pool.end();
    console.log('🔒 Pool de conexiones cerrado');
  } catch (error) {
    console.error('❌ Error al cerrar pool:', error.message);
  }
};

export default pool;