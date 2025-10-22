import { executeQuery, getConnection, testConnection } from '../config/database.js';

// Almacenamiento en memoria como fallback
let memoryStorage = new Map();
let memoryHistory = [];

export class Candidate {
  constructor(numeroOpositor, nota, ipRegistro = null) {
    this.numeroOpositor = numeroOpositor;
    this.nota = nota;
    this.ipRegistro = ipRegistro;
  }

  // Crear o actualizar candidato
  static async createOrUpdate(numeroOpositor, nota, ipRegistro = null) {
    try {
      // Verificar si hay conexión a base de datos
      const dbConnected = await testConnection();
      
      if (dbConnected) {
        // Usar base de datos MySQL
        const query = `
          INSERT INTO candidatos (numero_opositor, nota, ip_registro)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            nota = VALUES(nota),
            fecha_actualizacion = CURRENT_TIMESTAMP,
            ip_registro = VALUES(ip_registro)
        `;
        
        const result = await executeQuery(query, [numeroOpositor, nota, ipRegistro]);
        
        return {
          success: true,
          id: result.insertId || await this.findByNumber(numeroOpositor).then(c => c?.id),
          numeroOpositor,
          nota,
          message: result.insertId ? 'Candidato creado' : 'Candidato actualizado'
        };
      } else {
        // Usar almacenamiento en memoria
        const existing = memoryStorage.get(numeroOpositor);
        const isUpdate = !!existing;
        
        const candidate = {
          id: existing?.id || Date.now(),
          numero_opositor: numeroOpositor,
          nota: nota,
          fecha_registro: existing?.fecha_registro || new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
          ip_registro: ipRegistro,
          activo: 1
        };
        
        memoryStorage.set(numeroOpositor, candidate);
        
        // Agregar al historial
        memoryHistory.push({
          id: Date.now(),
          candidato_id: candidate.id,
          numero_opositor: numeroOpositor,
          nota_anterior: existing?.nota || null,
          nota_nueva: nota,
          operacion: isUpdate ? 'UPDATE' : 'INSERT',
          fecha: new Date().toISOString(),
          ip: ipRegistro
        });
        
        return {
          success: true,
          id: candidate.id,
          numeroOpositor,
          nota,
          message: isUpdate ? 'Candidato actualizado (memoria)' : 'Candidato creado (memoria)'
        };
      }
    } catch (error) {
      console.error('Error al crear/actualizar candidato:', error);
      throw new Error('Error al procesar candidato');
    }
  }

  // Obtener todos los candidatos ordenados por nota (clasificación)
  static async getAll() {
    try {
      const query = `
        SELECT 
          numero_opositor as id,
          CAST(nota as DECIMAL(10,2)) as score,
          fecha_registro,
          fecha_actualizacion,
          ROW_NUMBER() OVER (ORDER BY nota DESC) as posicion
        FROM candidatos 
        WHERE activo = TRUE
        ORDER BY nota DESC
      `;
      
      const candidates = await executeQuery(query);
      // Asegurar que score sea número
      return candidates.map(candidate => ({
        ...candidate,
        score: Number(candidate.score)
      }));
    } catch (error) {
      throw new Error(`Error al obtener candidatos: ${error.message}`);
    }
  }

  // Buscar un candidato específico
  static async findByNumber(numeroOpositor) {
    try {
      const query = `
        SELECT 
          numero_opositor as id,
          CAST(nota as DECIMAL(10,2)) as score,
          fecha_registro,
          fecha_actualizacion,
          (
            SELECT COUNT(*) + 1 
            FROM candidatos c2 
            WHERE c2.nota > c1.nota AND c2.activo = TRUE
          ) as posicion
        FROM candidatos c1
        WHERE numero_opositor = ? AND activo = TRUE
      `;
      
      const result = await executeQuery(query, [numeroOpositor]);
      if (result.length > 0) {
        const candidate = result[0];
        candidate.score = Number(candidate.score);
        return candidate;
      }
      return null;
    } catch (error) {
      throw new Error(`Error al buscar candidato: ${error.message}`);
    }
  }

  // Obtener estadísticas generales
  static async getStats() {
    try {
      // Verificar si la base de datos está conectada
      const isConnected = await testConnection();
      
      if (isConnected) {
        const query = `
          SELECT 
            COUNT(*) as total_candidatos,
            ROUND(AVG(nota), 2) as nota_media,
            MAX(nota) as nota_maxima,
            MIN(nota) as nota_minima,
            ROUND(STDDEV(nota), 2) as desviacion_estandar
          FROM candidatos 
          WHERE activo = TRUE
        `;
        
        const result = await executeQuery(query);
        return {
          ...result[0],
          storage_mode: 'database'
        };
      } else {
        // Fallback a memoria
        const candidates = Array.from(memoryStorage.values());
        const notas = candidates.map(c => c.nota);
        
        if (notas.length === 0) {
          return {
            total_candidatos: 0,
            nota_media: 0,
            nota_maxima: 0,
            nota_minima: 0,
            desviacion_estandar: 0,
            storage_mode: 'memory'
          };
        }
        
        const suma = notas.reduce((acc, nota) => acc + nota, 0);
        const media = suma / notas.length;
        const varianza = notas.reduce((acc, nota) => acc + Math.pow(nota - media, 2), 0) / notas.length;
        
        return {
          total_candidatos: candidates.length,
          nota_media: Math.round(media * 100) / 100,
          nota_maxima: Math.max(...notas),
          nota_minima: Math.min(...notas),
          desviacion_estandar: Math.round(Math.sqrt(varianza) * 100) / 100,
          storage_mode: 'memory'
        };
      }
    } catch (error) {
      // Si falla la conexión a BD, intentar con memoria
      try {
        const candidates = Array.from(memoryStorage.values());
        const notas = candidates.map(c => c.nota);
        
        if (notas.length === 0) {
          return {
            total_candidatos: 0,
            nota_media: 0,
            nota_maxima: 0,
            nota_minima: 0,
            desviacion_estandar: 0,
            storage_mode: 'memory'
          };
        }
        
        const suma = notas.reduce((acc, nota) => acc + nota, 0);
        const media = suma / notas.length;
        const varianza = notas.reduce((acc, nota) => acc + Math.pow(nota - media, 2), 0) / notas.length;
        
        return {
          total_candidatos: candidates.length,
          nota_media: Math.round(media * 100) / 100,
          nota_maxima: Math.max(...notas),
          nota_minima: Math.min(...notas),
          desviacion_estandar: Math.round(Math.sqrt(varianza) * 100) / 100,
          storage_mode: 'memory'
        };
      } catch (memoryError) {
        throw new Error(`Error al obtener estadísticas: ${error.message}`);
      }
    }
  }

  // Verificar si un candidato existe
  static async exists(numeroOpositor) {
    const isConnected = await testConnection();
    
    if (isConnected) {
      try {
        const query = `
          SELECT COUNT(*) as count 
          FROM candidatos 
          WHERE numero_opositor = ? AND activo = TRUE
        `;
        
        const result = await executeQuery(query, [numeroOpositor]);
        return result[0].count > 0;
      } catch (error) {
        console.log('❌ Error en consulta SQL:', error.message);
        // Fallback a memoria
        return memoryStorage.has(numeroOpositor);
      }
    } else {
      // Usar almacenamiento en memoria
      return memoryStorage.has(numeroOpositor);
    }
  }

  // Eliminar un candidato (soft delete)
  static async delete(numeroOpositor) {
    const isConnected = await testConnection();
    
    if (isConnected) {
      try {
        const query = `
          UPDATE candidatos 
          SET activo = FALSE, fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE numero_opositor = ?
        `;
        
        const result = await executeQuery(query, [numeroOpositor]);
        return {
          success: result.affectedRows > 0,
          message: result.affectedRows > 0 ? 'Candidato eliminado' : 'Candidato no encontrado'
        };
      } catch (error) {
        console.log('❌ Error en consulta SQL:', error.message);
        // Fallback a memoria
        const existed = memoryStorage.has(numeroOpositor);
        if (existed) {
          memoryStorage.delete(numeroOpositor);
          return {
            success: true,
            message: 'Candidato eliminado'
          };
        } else {
          return {
            success: false,
            message: 'Candidato no encontrado'
          };
        }
      }
    } else {
      // Usar almacenamiento en memoria
      const existed = memoryStorage.has(numeroOpositor);
      if (existed) {
        memoryStorage.delete(numeroOpositor);
        return {
          success: true,
          message: 'Candidato eliminado'
        };
      } else {
        return {
          success: false,
          message: 'Candidato no encontrado'
        };
      }
    }
  }

  // Obtener historial de un candidato
  static async getHistory(numeroOpositor) {
    const isConnected = await testConnection();
    
    if (isConnected) {
      try {
        const query = `
          SELECT 
            nota_anterior,
            nota_nueva,
            accion,
            fecha_accion,
            ip_accion
          FROM candidatos_historial 
          WHERE numero_opositor = ?
          ORDER BY fecha_accion DESC
        `;
        
        const history = await executeQuery(query, [numeroOpositor]);
        return history;
      } catch (error) {
        console.log('❌ Error en consulta SQL:', error.message);
        // Fallback a memoria
        return memoryHistory.filter(entry => entry.numero_opositor === numeroOpositor);
      }
    } else {
      // Usar almacenamiento en memoria
      return memoryHistory.filter(entry => entry.numero_opositor === numeroOpositor);
    }
  }

  // Verificar si una IP ya registró un candidato activo
  static async hasIpRegistered(ipAddress) {
    try {
      const dbConnected = await testConnection();
      
      if (dbConnected) {
        const query = `
          SELECT COUNT(*) as count 
          FROM candidatos 
          WHERE ip_registro = ? AND activo = TRUE
        `;
        
        const result = await executeQuery(query, [ipAddress]);
        return result[0].count > 0;
      } else {
        // Usar almacenamiento en memoria
        for (let candidate of memoryStorage.values()) {
          if (candidate.ip_registro === ipAddress && candidate.activo === 1) {
            return true;
          }
        }
        return false;
      }
    } catch (error) {
      console.error('Error al verificar IP registrada:', error);
      return false; // En caso de error, permitir el registro
    }
  }

  // Obtener candidato por IP
  static async findByIp(ipAddress) {
    try {
      const dbConnected = await testConnection();
      
      if (dbConnected) {
        const query = `
          SELECT numero_opositor, nota, fecha_registro 
          FROM candidatos 
          WHERE ip_registro = ? AND activo = TRUE
          LIMIT 1
        `;
        
        const result = await executeQuery(query, [ipAddress]);
        return result[0] || null;
      } else {
        // Usar almacenamiento en memoria
        for (let candidate of memoryStorage.values()) {
          if (candidate.ip_registro === ipAddress && candidate.activo === 1) {
            return {
              numero_opositor: candidate.numero_opositor,
              nota: candidate.nota,
              fecha_registro: candidate.fecha_registro
            };
          }
        }
        return null;
      }
    } catch (error) {
      console.error('Error al buscar candidato por IP:', error);
      return null;
    }
  }
}