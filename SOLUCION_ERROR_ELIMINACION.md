# Solución a los Errores de Eliminación de Candidatos

## Problemas
Al intentar eliminar un candidato de la tabla `candidatos` pueden aparecer estos errores:

### Error 1:
```
#1048 - La columna 'nota_nueva' no puede ser nula
```

### Error 2:
```
#1452 - No puedo añadir o actualizar una fila hija: falla una restricción de clave foránea
```

## Causa de los Problemas
Los errores se producen porque:

1. **Trigger de Auditoría**: Existe un trigger `tr_candidatos_delete_audit` que se ejecuta automáticamente cuando se elimina un registro de la tabla `candidatos`.

2. **Estructura de Tabla Incorrecta**: La tabla `candidatos_historial` tenía la columna `nota_nueva` definida como `NOT NULL`, pero el trigger intenta insertar `NULL` cuando se elimina un candidato.

3. **Timing del Trigger**: El trigger original era `AFTER DELETE`, lo que significa que se ejecutaba después de eliminar el registro, causando problemas con la clave foránea.

## Solución

### Opción 1: Ejecutar el Script de Corrección Completo (RECOMENDADO)
1. Abre tu gestor de base de datos (phpMyAdmin, MySQL Workbench, etc.)
2. Selecciona tu base de datos
3. Ejecuta el contenido completo del archivo `fix_database_structure.sql`:

```sql
-- 1. Permitir NULL en nota_nueva
ALTER TABLE candidatos_historial 
MODIFY COLUMN nota_nueva DECIMAL(5,2) NULL;

-- 2. Eliminar el trigger problemático
DROP TRIGGER IF EXISTS tr_candidatos_delete_audit;

-- 3. Crear el nuevo trigger BEFORE DELETE
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
```

### Opción 2: Usar la Funcionalidad de la Aplicación
En lugar de eliminar directamente desde la base de datos, usa la aplicación web:
- La aplicación hace un "soft delete" (marca como `activo = FALSE`)
- Esto evita el trigger problemático
- Los datos se mantienen para auditoría

## Verificación
Después de aplicar la solución, puedes verificar que funciona:

1. **Verificar estructura**:
```sql
DESCRIBE candidatos_historial;
```
La columna `nota_nueva` debe mostrar `YES` en la columna `Null`.

2. **Probar eliminación**:
```sql
DELETE FROM candidatos WHERE numero_opositor = 'TEST';
```

## Prevención
- **Para nuevas instalaciones**: El archivo `database_setup.sql` ya está corregido
- **Para instalaciones existentes**: Ejecuta el script `fix_database_structure.sql`

## Notas Técnicas
- El trigger `tr_candidatos_delete_audit` registra todas las eliminaciones en `candidatos_historial`
- Para acciones DELETE, `nota_nueva` debe ser NULL (no hay nota nueva)
- Para acciones INSERT, `nota_anterior` debe ser NULL (no hay nota anterior)
- Para acciones UPDATE, ambas columnas tienen valores

## Archivos Relacionados
- `database_setup.sql` - Script principal de creación (ya corregido)
- `fix_database_structure.sql` - Script de corrección para bases existentes
- `backend/models/Candidate.js` - Modelo que implementa soft delete