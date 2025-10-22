-- =====================================================
-- SCRIPT PARA CORREGIR LA ESTRUCTURA DE LA BASE DE DATOS
-- Soluciona los errores de eliminación de candidatos
-- =====================================================

-- 1. Modificar la tabla candidatos_historial para permitir NULL en nota_nueva
-- Esto es necesario para las acciones DELETE donde no hay nota nueva
ALTER TABLE candidatos_historial 
MODIFY COLUMN nota_nueva DECIMAL(5,2) NULL;

-- 2. Eliminar el trigger problemático AFTER DELETE
DROP TRIGGER IF EXISTS tr_candidatos_delete_audit;

-- 3. Crear el nuevo trigger BEFORE DELETE
-- Esto captura la información ANTES de que se elimine el registro
-- evitando el problema de clave foránea
DELIMITER //

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
-- VERIFICACIÓN
-- =====================================================

-- Verificar que el cambio se aplicó correctamente
DESCRIBE candidatos_historial;

-- Mostrar los triggers actuales
SHOW TRIGGERS LIKE 'candidatos';

-- =====================================================
-- INFORMACIÓN ADICIONAL
-- =====================================================

-- Los problemas que se solucionan:
-- 1. Error #1048: La columna 'nota_nueva' no puede ser nula
--    - Solucionado permitiendo NULL en nota_nueva
--
-- 2. Error #1452: Falla restricción de clave foránea
--    - Solucionado cambiando AFTER DELETE a BEFORE DELETE
--    - Ahora se captura la información antes de eliminar el registro
--
-- El trigger BEFORE DELETE:
-- - Se ejecuta antes de eliminar el registro
-- - Puede acceder a OLD.id que aún existe en candidatos
-- - No viola la restricción de clave foránea
-- - Registra correctamente la acción de eliminación

-- Después de ejecutar este script, podrás eliminar candidatos sin problemas.