# Backend - API de Clasificación de Oposiciones

Backend REST API para la aplicación de clasificación de oposiciones del Ejército de Tierra.

## 🚀 Instalación y Configuración

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Configurar base de datos
1. Crear base de datos MySQL usando el script `../database_setup.sql`
2. Configurar las credenciales en el archivo `.env`

### 3. Configurar variables de entorno
Copia `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Variables importantes:
- `DB_HOST`: Host de MySQL (localhost por defecto)
- `DB_USER`: Usuario de MySQL
- `DB_PASSWORD`: Contraseña de MySQL
- `DB_NAME`: Nombre de la base de datos
- `PORT`: Puerto del servidor (3001 por defecto)
- `FRONTEND_URL`: URL del frontend para CORS

### 4. Iniciar el servidor

#### Desarrollo
```bash
npm run dev
```

#### Producción
```bash
npm start
```

## 📡 Endpoints de la API

### Health Check
- `GET /` - Información básica de la API
- `GET /api/health` - Estado detallado del servicio

### Candidatos
- `GET /api/candidates` - Obtener todos los candidatos
- `POST /api/candidates` - Crear/actualizar candidato
- `GET /api/candidates/stats` - Obtener estadísticas
- `GET /api/candidates/:numeroOpositor` - Buscar candidato específico
- `GET /api/candidates/:numeroOpositor/history` - Historial de candidato
- `DELETE /api/candidates/:numeroOpositor` - Eliminar candidato (soft delete)

## 📝 Ejemplos de Uso

### Crear/Actualizar Candidato
```bash
curl -X POST http://localhost:3001/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "numeroOpositor": "12345",
    "nota": 150.5
  }'
```

### Obtener Todos los Candidatos
```bash
curl http://localhost:3001/api/candidates
```

### Buscar Candidato
```bash
curl http://localhost:3001/api/candidates/12345
```

### Obtener Estadísticas
```bash
curl http://localhost:3001/api/candidates/stats
```

## 🔒 Seguridad

- **CORS**: Configurado para permitir solo orígenes autorizados
- **Rate Limiting**: Límites de peticiones por IP
- **Helmet**: Headers de seguridad HTTP
- **Validación**: Validación de datos con Joi
- **SQL Injection**: Protección con prepared statements

## 🗄️ Base de Datos

### Estructura de la tabla `candidatos`
- `id`: ID único autoincremental
- `numero_opositor`: Número del opositor (único)
- `nota`: Puntuación (0-200)
- `fecha_registro`: Fecha de creación
- `fecha_actualizacion`: Fecha de última actualización
- `ip_registro`: IP de registro
- `activo`: Estado del registro (soft delete)

### Auditoría
- Tabla `candidatos_historial` para tracking de cambios
- Triggers automáticos para INSERT, UPDATE, DELETE

## 🚨 Troubleshooting

### Error de conexión a MySQL
1. Verificar que MySQL esté ejecutándose
2. Comprobar credenciales en `.env`
3. Verificar que la base de datos existe
4. Comprobar permisos del usuario

### Error de CORS
1. Verificar `FRONTEND_URL` en `.env`
2. Comprobar que el frontend esté en el puerto correcto

### Rate Limiting
- Si recibes error 429, espera unos minutos
- Ajustar límites en `RATE_LIMIT_*` variables

## 📊 Logs

El servidor registra:
- Todas las peticiones HTTP
- Errores de base de datos
- Intentos de acceso bloqueados por CORS
- Rate limiting excedido

## 🔧 Scripts Disponibles

- `npm start` - Iniciar en producción
- `npm run dev` - Iniciar en desarrollo con nodemon
- `npm test` - Ejecutar tests (cuando estén implementados)

## 🌐 Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `3001` |
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | `` |
| `DB_NAME` | Nombre de la base de datos | `oposicion_ejercito` |
| `FRONTEND_URL` | URL del frontend | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Ventana de rate limiting | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Máximo de requests | `100` |