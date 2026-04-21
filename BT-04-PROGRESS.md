# BT-04: Setup de API REST para Paquetes de Viaje

## Estado: Implementado ✅

### T-25: Esquema de Base de Datos ✅

**Archivos creados:**
- `packages/db/src/schema/package.ts` - Schema con 3 tablas:
  - `package` - Información principal del paquete
  - `package_participant` - Relación usuario-paquete
  - `package_activity` - Actividades dentro del paquete

**Características del schema:**
- ✅ Campos completos: destino, título, descripción, fechas, duración, precio, capacidad
- ✅ Alojamiento opcional con detalles (nombre, rating, amenities)
- ✅ Estado: draft, published, cancelled
- ✅ Sistema de participantes con conteo automático
- ✅ Actividades incluidas y opcionales
- ✅ Índices optimizados para búsqueda (destino, fecha de inicio)
- ✅ Timestamps de creación y actualización
- ✅ Relaciones Drizzle configuradas

### T-26 & T-27: Endpoints CRUD ✅

**Archivos creados:**
- `apps/server/src/routers/package.ts` - Router con 9 endpoints

#### Endpoints Públicos:
1. **`search`** - Buscar paquetes con filtros en tiempo real
   - Filtros: destino, fechas, duración, rangos de precio
   - Paginación: limit, offset
   - Retorna: lista con info del creador

2. **`getById`** - Obtener detalles completos de un paquete
   - Retorna: paquete completo + participantes + actividades

#### Endpoints Protegidos (Autenticación requerida):
3. **`create`** - Crear nuevo paquete (POST)
   - Solo usuarios autenticados
   - Creator agregado automáticamente como primer participante
   - Validaciones: fechas válidas, campos requeridos

4. **`update`** - Actualizar paquete (PUT)
   - Solo el creador puede actualizar
   - Recalcula duración si cambian fechas
   - Validaciones de negocio

5. **`delete`** - Eliminar paquete (DELETE)
   - Solo el creador puede eliminar
   - Validación de propiedad

6. **`addActivity`** - Agregar actividad a paquete
   - Solo el creador
   - Actividades incluidas u opcionales

7. **`joinPackage`** - Unirse como participante
   - Validación de capacidad
   - Prevent duplicados

8. **`leavePackage`** - Abandonar paquete
   - Decrementa contador de participantes

### Próximos pasos:

#### Para ejecutar la migración:
```bash
# Con bun (recomendado)
bun install
bun run db:push

# O con npm
npm install
npm run db:push
```

#### Para probar los endpoints (una vez corriendo el servidor):
```bash
bun run dev

# Luego puedes probar con curl o insomnia:
# Crear paquete
curl -X POST http://localhost:3000/api/package/create \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Cartagena",
    "title": "Aventura en Cartagena",
    "description": "Un viaje inolvidable por la magia de Cartagena",
    "startDate": "2026-06-01T00:00:00Z",
    "endDate": "2026-06-05T00:00:00Z",
    "maxParticipants": 20,
    "price": "1500.00",
    "tags": ["beach", "adventure"]
  }'

# Buscar paquetes
curl "http://localhost:3000/api/package/search?destination=Cartagena&limit=10"

# Obtener detalle
curl "http://localhost:3000/api/package/getById?id=<package-id>"
```

### Validaciones implementadas:
- ✅ Dates: endDate > startDate
- ✅ Strings: min/max length según tipo
- ✅ Números: positivos, dentro de rangos válidos
- ✅ Precios: formato decimal con 2 decimales
- ✅ Autorización: solo creador puede modificar/eliminar
- ✅ Capacidad: no permite unirse si está lleno
- ✅ Duplicados: no permite unirse 2 veces

### Próximas tareas:
- [ ] BT-05: Implementar filtros avanzados en tiempo real (TODO: en otra rama)
- [ ] BT-06: Desarrollo de pantallas en React Native
- [ ] HU-06, HU-07, HU-21: Historias de usuario completas
