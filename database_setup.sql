-- =====================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS
-- Aplicación de Clasificación de Oposiciones - Ejército de Tierra
-- Agrupación de Especialidades Operativas (AEO)
-- =====================================================

-- Crear la base de datos (opcional, descomenta si necesitas crearla)
-- CREATE DATABASE IF NOT EXISTS oposiciones_ejercito 
-- CHARACTER SET utf8mb4 
-- COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
-- USE oposiciones_ejercito;

-- =====================================================
-- TABLA PRINCIPAL: candidatos
-- Almacena los datos de los opositores y sus notas
-- =====================================================

CREATE TABLE IF NOT EXISTS candidatos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_opositor VARCHAR(20) NOT NULL UNIQUE,
    nota DECIMAL(5,2) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_registro VARCHAR(45) NULL,
    activo BOOLEAN DEFAULT TRUE,
    
    -- Constraints para validación
    CONSTRAINT chk_nota_rango CHECK (nota >= 0 AND nota <= 200),
    CONSTRAINT chk_numero_opositor_formato CHECK (LENGTH(numero_opositor) > 0)
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci
  COMMENT='Tabla principal para almacenar datos de candidatos de oposiciones';

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice para búsquedas por número de opositor (ya existe por UNIQUE)
-- Índice para ordenación por nota (clasificación)
CREATE INDEX idx_candidatos_nota ON candidatos(nota DESC);

-- Índice para búsquedas por fecha de registro
CREATE INDEX idx_candidatos_fecha_registro ON candidatos(fecha_registro);

-- Índice compuesto para consultas de clasificación activa
CREATE INDEX idx_candidatos_activo_nota ON candidatos(activo, nota DESC);

-- =====================================================
-- TABLA DE AUDITORÍA (OPCIONAL)
-- Para llevar un registro de cambios
-- =====================================================

CREATE TABLE IF NOT EXISTS candidatos_historial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidato_id INT NOT NULL,
    numero_opositor VARCHAR(20) NOT NULL,
    nota_anterior DECIMAL(5,2) NULL,
    nota_nueva DECIMAL(5,2) NULL,
    accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_accion VARCHAR(45) NULL,
    
    FOREIGN KEY (candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci
  COMMENT='Historial de cambios en los datos de candidatos';

-- =====================================================
-- TRIGGER PARA AUDITORÍA AUTOMÁTICA
-- =====================================================

DELIMITER //

CREATE TRIGGER tr_candidatos_insert_audit
    AFTER INSERT ON candidatos
    FOR EACH ROW
BEGIN
    INSERT INTO candidatos_historial (
        candidato_id, numero_opositor, nota_anterior, nota_nueva, accion
    ) VALUES (
        NEW.id, NEW.numero_opositor, NULL, NEW.nota, 'INSERT'
    );
END//

CREATE TRIGGER tr_candidatos_update_audit
    AFTER UPDATE ON candidatos
    FOR EACH ROW
BEGIN
    INSERT INTO candidatos_historial (
        candidato_id, numero_opositor, nota_anterior, nota_nueva, accion
    ) VALUES (
        NEW.id, NEW.numero_opositor, OLD.nota, NEW.nota, 'UPDATE'
    );
END//

CREATE TRIGGER tr_candidatos_delete_audit
    BEFORE DELETE ON candidatos
    FOR EACH ROW
BEGIN
    INSERT INTO candidatos_historial (
        candidato_id, numero_opositor, nota_anterior, nota_nueva, accion
    ) VALUES (
        OLD.id, OLD.numero_opositor, OLD.nota, NULL, 'DELETE'
    );
END//

DELIMITER ;

-- =====================================================
-- DATOS DE EJEMPLO PARA TESTING (OPCIONAL)
-- Descomenta las siguientes líneas si quieres datos de prueba
-- =====================================================

/*
INSERT INTO candidatos (numero_opositor, nota) VALUES
('OP001', 185.50),
('OP002', 178.25),
('OP003', 192.75),
('OP004', 165.00),
('OP005', 189.80),
('OP006', 172.45),
('OP007', 195.20),
('OP008', 158.90),
('OP009', 183.15),
('OP010', 176.60);
*/

-- =====================================================
-- CONSULTAS ÚTILES PARA LA APLICACIÓN
-- =====================================================

-- Obtener clasificación ordenada por nota (para la tabla de resultados)
-- SELECT numero_opositor, nota, 
--        ROW_NUMBER() OVER (ORDER BY nota DESC) as posicion
-- FROM candidatos 
-- WHERE activo = TRUE
-- ORDER BY nota DESC;

-- Buscar un candidato específico
-- SELECT numero_opositor, nota,
--        ROW_NUMBER() OVER (ORDER BY nota DESC) as posicion
-- FROM candidatos 
-- WHERE numero_opositor = 'OP001' AND activo = TRUE;

-- Obtener estadísticas generales
-- SELECT 
--     COUNT(*) as total_candidatos,
--     AVG(nota) as nota_media,
--     MAX(nota) as nota_maxima,
--     MIN(nota) as nota_minima
-- FROM candidatos 
-- WHERE activo = TRUE;

-- =====================================================
-- USUARIO Y PERMISOS (OPCIONAL)
-- Crear usuario específico para la aplicación
-- =====================================================

/*
-- Crear usuario para la aplicación (cambiar contraseña)
CREATE USER 'oposiciones_app'@'%' IDENTIFIED BY 'tu_contraseña_segura_aqui';

-- Otorgar permisos necesarios
GRANT SELECT, INSERT, UPDATE ON oposiciones_ejercito.candidatos TO 'oposiciones_app'@'%';
GRANT SELECT ON oposiciones_ejercito.candidatos_historial TO 'oposiciones_app'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Verificar que las tablas se crearon correctamente
SHOW TABLES;
DESCRIBE candidatos;
DESCRIBE candidatos_historial;