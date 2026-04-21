# HU-06: Crear Paquete de Viaje - Implementación Completa

## Estado: ✅ Implementado

### T-30: Pantalla de Creación en React Native

**Archivo:** [apps/native/components/create-package.tsx](../apps/native/components/create-package.tsx)

**Características:**
- ✅ Formulario con todos los campos requeridos:
  - Destino (string, required)
  - Título (string, required)
  - Descripción (string, min 10 chars, required)
  - Fecha de inicio (date, required)
  - Fecha de finalización (date, required)
  - Máximo de participantes (number, 1-1000, required)
  - Precio USD (decimal, required)
  - Alojamiento (string, optional)
  - Tags (comma-separated, optional)

- ✅ Validaciones en tiempo real con Zod:
  - Campos requeridos
  - Longitud mínima/máxima
  - Formato de precio decimal
  - Validación de rango de fechas

- ✅ UX mejorada:
  - Scroll automático (ScrollView)
  - Indicador de carga durante envío
  - Mostrar/ocultar mensaje de error global
  - Botón deshabilitado mientras se procesa
  - Teclados específicos (numérico para precio/participantes)

### T-31: Integración con Endpoint POST /packages

**Archivo:** [apps/native/components/create-package.tsx](../apps/native/components/create-package.tsx)

**Implementación:**
```typescript
// 1. Validación de datos locales (Zod)
// 2. Cálculo de duración automática
// 3. Llamada al endpoint POST /packages
await orpc.package.create.mutate({
  destination,
  title,
  description,
  startDate,     // Date object
  endDate,       // Date object
  maxParticipants,
  price,         // Formatted to decimal string
  accommodation,
  accommodationDetails,
  tags,          // Array of strings
});

// 4. Manejo de respuestas
// Success: onSuccess(packageId)
// Error: onError(errorMessage) + mostrar en UI
```

**Funcionalidades:**
- ✅ Paso de parámetros correctos a oRPC
- ✅ Formateo de datos (precio, fechas, tags)
- ✅ Manejo de errores de validación backend
- ✅ Manejo de errores de red
- ✅ Callbacks onSuccess/onError para navegación

### T-32: Pruebas Unitarias e Integración

**Archivos de Pruebas:**

1. [apps/native/tests/unit/create-package-form.test.tsx](../apps/native/tests/unit/create-package-form.test.tsx)
   - Tests unitarios del componente
   - Validaciones de formulario
   - Renderizado de campos
   - Callbacks de éxito/error

2. [apps/native/tests/integration/create-package.integration.test.ts](../apps/native/tests/integration/create-package.integration.test.ts)
   - Tests de integración backend/frontend
   - Flujo completo de creación
   - Validaciones de base de datos
   - Tests de rendimiento
   - Pruebas de concurrencia

**Test Coverage:**
```
Unit Tests (11 tests):
✅ Renderizado de campos
✅ Validación de campos requeridos
✅ Validación de longitud mínima/máxima
✅ Validación de rango de fechas
✅ Validación de formato de precio
✅ Callback onSuccess
✅ Callback onError
✅ Estado de carga del botón
✅ Manejo de errores en respuesta

Integration Tests (18+ tests):
✅ Crear paquete con datos válidos
✅ Error para fechas inválidas
✅ Error para campos requeridos faltantes
✅ Error para precio inválido
✅ Verificar creator como primer participante
✅ Verificar status inicial = 'published'
✅ Cálculo correcto de durationDays
✅ Envío de formulario con datos válidos
✅ Manejo de errores de red
✅ Parseo de tags desde entrada
✅ Manejo de detalles de alojamiento
✅ Navegación a página de detalles
✅ Aparecer en resultados de búsqueda
✅ Actualización de paquete por creador
✅ Agregar actividades al paquete
✅ Otros usuarios pueden unirse
✅ Prevenir unirse duplicado
✅ Prevenir unirse si está lleno
✅ Tests de base de datos
✅ Tests de rendimiento
```

## Rutas Relacionadas

### Crear Paquete
**Ruta:** `/packages/create`
**Archivo:** [apps/native/app/packages/create.tsx](../apps/native/app/packages/create.tsx)
**Componente:** `CreatePackageForm`
**Acceso:** Solo usuarios autenticados

### Ver Detalles de Paquete
**Ruta:** `/packages/[id]`
**Archivo:** [apps/native/app/packages/[id].tsx](../apps/native/app/packages/[id].tsx)
**Contenido:**
- Información general del paquete
- Lista de actividades
- Lista de participantes
- Información del organizador
- Botones de acción (unirse, abandonar, etc.)

## Cómo Usar

### Para Crear un Paquete:
```bash
# 1. Iniciar la app
bun run dev:native

# 2. Navegar a /packages/create
# 3. Llenar el formulario
# 4. Presionar "Crear Paquete"
# 5. Automáticamente navega a /packages/{id}
```

### Para Ejecutar Tests:
```bash
# Tests unitarios
bun run test:unit -- create-package-form.test.tsx

# Tests de integración
bun run test:integration -- create-package.integration.test.ts

# Todos los tests
bun run test
```

### Formato de Entrada Esperada:

**Ejemplo válido:**
```json
{
  "destination": "Cartagena, Colombia",
  "title": "Aventura en Cartagena",
  "description": "Un viaje inolvidable por la magia de Cartagena con playas hermosas y cultura rica",
  "startDate": "2026-06-01",
  "endDate": "2026-06-05",
  "maxParticipants": "20",
  "price": "1500.00",
  "accommodation": "Hotel 5 estrellas",
  "tags": "beach, adventure, cultural"
}
```

**Errores de Validación Comunes:**
- "El destino es requerido"
- "El título es requerido"
- "La descripción debe tener al menos 10 caracteres"
- "La fecha de finalización debe ser posterior a la de inicio"
- "Formato de precio inválido (ej: 1500.00)"
- "Máx. Participantes debe ser un número entre 1 y 1000"

## Próximas Historias de Usuario:

- **HU-07** - Buscar paquetes de viaje con filtros
- **HU-21** - Ver detalle de un paquete (ya implementado en [id].tsx)
- **BT-06** - Otras pantallas del frontend

## Notas de Desarrollo

1. **Autenticación:** Solo usuarios logueados pueden crear paquetes
2. **Autorización:** El creator_id se establece automáticamente desde el contexto de sesión
3. **Timestamps:** createdAt y updatedAt se manejan automáticamente en BD
4. **Duración:** Se calcula automáticamente en backend a partir de fechas
5. **Participantes:** El creador se agrega automáticamente como primer participante
6. **Status:** Comienza como 'published' por defecto

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| "No se pudo crear el paquete" | Error de conexión/servidor | Verificar que el servidor esté corriendo en :3000 |
| "Formato de precio inválido" | Precio con formato incorrecto | Usar formato: 1500.00 (máximo 2 decimales) |
| "End date must be after start date" | Fechas invertidas | Verificar que endDate > startDate |
| "Package is full" | Al unirse | El paquete ya alcanzó maxParticipants |
| "User is already a participant" | Al unirse | El usuario ya está en el paquete |
