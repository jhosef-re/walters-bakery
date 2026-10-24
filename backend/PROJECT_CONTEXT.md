# Walters Bakery — Backend · Context & Status

Documento técnico detallado del backend (NestJS + Prisma). Última actualización: 2026-09-08.

> Documento cross-stack (vista raíz): [`/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md).
>
> Documento funcional maestro: [`/Casos_de_Uso_Sistema_Panaderia.md`](../Casos_de_Uso_Sistema_Panaderia.md).

---

## 1. Contexto del proyecto

Sistema de **inventario, producción, mermas y cierres de venta** para una cadena de panaderías multi-sucursal. El backend es una API REST NestJS que persiste en PostgreSQL vía Prisma, con BullMQ sobre Redis para jobs programados (CU-16).

### Stack detallado

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node | 20+ |
| Framework | NestJS | ^10.3.0 |
| ORM | Prisma + `@prisma/client` | ^5.10.0 |
| DB | PostgreSQL | 16-alpine |
| Colas | BullMQ | ^5.1.0 |
| Cache/Queue broker | Redis | 7-alpine |
| Auth | `@nestjs/passport` + `passport-jwt` + `bcrypt` + `@nestjs/jwt` | passport-jwt ^4.0.1, jwt ^10.2.0 |
| Logger | `nestjs-pino` + `pino-http` + `pino-pretty` | nestjs-pino ^4.6.1 |
| Hardening | `helmet` + `compression` | helmet ^7.2.0, compression ^1.8.1 |
| Docs | `@nestjs/swagger` + `swagger-ui-express` | swagger ^7.4.2 |
| Validación | `class-validator` + `class-transformer` | ^0.14.1 / ^0.5.1 |
| Tests | `vitest` | ^1.2.0 |
| Lint | `eslint` + `@typescript-eslint` + `prettier` | eslint ^8.57.0 |

---

## 2. Estructura actual

```
backend/
├── Dockerfile                       # multi-stage Node 20-alpine
├── .dockerignore
├── .env.example                     # localhost:5433 (host), JWT >=16 chars
├── .env                             # local; no commitear
├── .eslintrc.cjs                    # backend ESLint config
├── .eslintignore
├── .prettierrc / .prettierignore
├── nest-cli.json
├── tsconfig.json
├── vitest.config.ts                 # setup file apunta a vitest.setup.ts
├── vitest.setup.ts                  # import 'reflect-metadata'
├── package.json
├── prisma/
│   ├── schema.prisma                # 21 modelos, 13 enums
│   ├── migrations/                  # generada al primer migrate
│   │   └── <timestamp>_init/migration.sql
│   └── seed.ts                      # 2 sucursales + 6 usuarios demo
└── src/
    ├── main.ts                      # bootstrap (helmet, compression, swagger, pino)
    ├── app.module.ts                # APP_FILTER + APP_GUARDs + LoggerModule + 11 módulos
    ├── health.controller.ts         # @Public() GET /api/health
    ├── config/
    │   ├── env.schema.ts            # EnvSchema + validateEnv
    │   └── env.schema.spec.ts       # 6 tests
    ├── prisma/
    │   ├── prisma.module.ts         # @Global — provee PrismaService
    │   └── prisma.service.ts        # extends PrismaClient + lifecycle
    ├── common/
    │   ├── filters/
    │   │   ├── all-exceptions.filter.ts
    │   │   └── all-exceptions.filter.spec.ts   # 3 tests
    │   ├── decorators/
    │   │   ├── public.decorator.ts              # @Public()
    │   │   ├── roles.decorator.ts               # @Roles(...roles)
    │   │   └── current-user.decorator.ts        # @CurrentUser(key?)
    │   ├── dto/
    │   │   ├── pagination.dto.ts                # + paginated result helper
    │   │   ├── pagination.dto.spec.ts           # 6 tests
    │   │   └── id-param.dto.ts                  # @IsUUID('4')
    │   └── types/
    │       └── rol.enum.ts                      # re-export Rol desde Prisma
    └── modules/
        ├── auth/                                # ✅ F1.1 completo
        │   ├── auth.module.ts
        │   ├── auth.controller.ts               # login/refresh/logout/me
        │   ├── auth.service.ts                  # bcrypt + sign access/refresh + refresh verify
        │   ├── dto/login.dto.ts
        │   ├── types/jwt-payload.ts
        │   ├── strategies/
        │   │   ├── jwt-access.strategy.ts       # bearer token → req.user
        │   │   └── jwt-refresh.strategy.ts      # cookie 'rt' → { id, refreshToken }
        │   └── guards/
        │       ├── jwt-auth.guard.ts            # consulta @Public() como opt-out
        │       ├── jwt-refresh.guard.ts         # extendido de AuthGuard('jwt-refresh')
        │       └── roles.guard.ts               # lee @Roles() y compara req.user.rol
        ├── users/                               # 🟡 F1.2 — solo lo necesario para AuthModule
        │   ├── users.module.ts
        │   └── users.service.ts                 # findByCorreo, findById
        ├── catalog/                             # ⚪ F1.3 — placeholder
        ├── recipes/                             # ⚪ F1.4 — placeholder
        ├── production/                          # ⚪ F2.1 — placeholder
        ├── closures/                            # ⚪ F2.2 — placeholder
        ├── transfers/                           # ⚪ F3.1 — placeholder
        ├── inventory/                           # ⚪ F3.2 — placeholder
        ├── waste/                               # ⚪ F2.3 — placeholder
        ├── alerts/                              # ⚪ F2/F3 — placeholder
        └── notifications/                       # ⚪ F3.3 — placeholder
```

---

## 3. Lo realizado (sesión extendida)

### 3.1 Infraestructura
- `npm install` de 858 paquetes + agregados: `cookie-parser`, `helmet@7`, `compression@1`, `pino-http@10`, `nestjs-pino@4`, `@nestjs/swagger@7`, `swagger-ui-express@5`, `@types/cookie-parser`, `@types/compression`, `@types/swagger-ui-express`, `eslint-config-prettier`, `prettier`, `pino-pretty`.

### 3.2 Prisma — correcciones pre-existentes
El `schema.prisma` entregado tenía 4 relaciones rotas. Se corrigieron:

| # | Relación | Corrección |
|---|---|---|
| 1 | `Notificacion.sucursalId` (FK huérfana) | añadido `sucursal Sucursal? @relation(fields: [sucursalId], references: [id])` |
| 2 | `OrdenProduccionBitacora.usuario` | añadido `ordenesBitacora OrdenProduccionBitacora[]` en `Usuario` |
| 3 | `TransferenciaDetalle.insumo` | añadido `detalleTransferencia TransferenciaDetalle[]` en `Insumo` |
| 4 | `Cierre.transferencia` / `Transferencia.cierre` | añadido `cierreId String? @unique` + `cierre Cierre? @relation(...)` en `Transferencia` |

### 3.3 Core del backend (Fase 1)
- `PrismaService extends PrismaClient` con `onModuleInit`/`onModuleDestroy`, `@Global()`.
- `EnvSchema` valida `.env` al startup con class-validator.
- `AllExceptionsFilter` global con formato unificado `{statusCode, error, message, path, timestamp}`.
- Decorators `@Public()`, `@CurrentUser()`, `@Roles(...)`.
- DTOs comunes: `PaginationDto`, `IdParamDto`.

### 3.4 Auth (Fase 2 — F1.1 del MVP)
- `UsersService.findByCorreo()`, `findById()`.
- `AuthService.login()` con bcrypt, `issueTokensForRefresh()` con JWT verify, `hashPassword()`.
- `JwtAccessStrategy` (Bearer) → `req.user = { id, correo, rol, sucursalId }`.
- `JwtRefreshStrategy` (cookie `rt`) → valida el token desde la cookie y devuelve `{ id, refreshToken }`.
- `JwtAuthGuard` global con `@Public()` como opt-out.
- `RolesGuard` global que lee `@Metadata('roles')` y compara con `req.user.rol`.
- `AuthController` con `/login` (pública), `/refresh` (cookie), `/logout` (Bearer), `/me` (Bearer).
- APP_GUARDs registrados en `app.module.ts` (orden: JwtAuthGuard → RolesGuard).
- `@Public()` aplicado a `HealthController` y `/auth/login` + `/auth/refresh`.
- Cookie httpOnly `rt` con `SameSite=Lax`, `secure` en producción, `maxAge` 7 días.

### 3.7 F1 backend cerrada (2026-09-08)

- **CatalogModule (CU-01)**: 5 submódulos con CRUD + archivar:
  - `Sucursal` (`sucursal.service.ts`): paginación con `search`/`tipo`/`estado`, conflict por `codigo`, archivado lógico.
  - `ProductoTerminado` (`producto.service.ts`): SKU único en MAYÚSCULAS, `vidaUtilDias` 1-365, `precioVenta > 0`, `reutilizable`/`tipoReuso`/`estado`, archivado.
  - `Insumo` (`insumo.service.ts`): SKU único, `costoUnitarioActual >= 0` con 4 decimales, flag `virtual`.
  - `Turno` (`turno.service.ts` + helper puro `turno-window.ts`): HH:mm validado con regex, `cruzaMedianoche` soportado, validación de **no-traslape** con expansión a 2 días para detectar solapes nocturnos vs matutinos.
  - `ConfiguracionMerma` (`config-merma.service.ts`): un solo `defaultGeneral`, overrides por producto/insumo, `resolveThreshold(productoId, insumoId)` retorna prioridad producto → insumo → general → 0.

- **RecipesModule (CU-02)**: `recipes.service.ts` con:
  - `create`: valida producto existe + sin receta vigente + detalle no vacío + cantidades > 0 + insumos únicos.
  - `clone`: cierra la vigente (`vigenteHasta = now`) y crea N+1 dentro de `$transaction`.
  - `update`: solo sobre recetas archivadas; reemplaza el detalle en transacción (`deleteMany` + `create` por lote).
  - `findVigente(productoId)`, `findByProducto(productoId)` con orden por versión desc.

- **UsersModule (CU-19)**: `users.service.ts` con CRUD completo:
  - `create`: valida correo único, hashea password, asigna `debeCambiarPassword: true`.
  - `update`: actualiza campos parciales, genera `AuditoriaCambio` para los campos que cambiaron (nombre/rol/sucursal/estado).
  - `changeOwnPassword`: compara con la actual, marca `debeCambiarPassword: false`.
  - `resetPassword`: solo admin, genera hash, registra en bitácora con campos enmascarados.
  - `deactivate`: marca `estado=false`, registra en bitácora.
  - `findAll`: paginación con `search` (case-insensitive en `nombre`/`correo`).

- **Endpoint PATCH recipes**: `PATCH /api/recipes/:id` agregado para cubrir el flujo de recetas archivadas. Antes solo había POST/clone.

- **Tests**: 157 tests en 24 archivos (services mockeados con Prisma, guards con Reflector, DTOs con class-validator puro). Ver sección 7.

### 3.5 Migración Prisma + seed
- Primera migración `20260909023532_init` aplicada a `walters_bakery`.
- Seed (`prisma/seed.ts`) idempotente con `upsert`:
  - 2 sucursales (`SUC-001` central, `SUC-002` punto_venta).
  - 6 usuarios demo (`admin@walters.local/admin123`, `gerente.centro@walters.local/gerente123`, `gerente.norte@walters.local/gerente123`, `jefe.centro@walters.local/jefe123`, `cierre.centro@walters.local/cierre123`, `auditor@walters.local/auditor123`).
  - Todos con `debeCambiarPassword: true`.
- Script `prisma:seed` añadido. Bloque `prisma.seed` para `prisma db seed`.

### 3.6 Hardening (Fase 3)

| Mejora | Paquete | Propósito |
|---|---|---|
| Security headers | `helmet@7` | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc. |
| Compresión gzip | `compression@1` | Middleware para respuestas grandes. |
| Logger estructurado | `nestjs-pino@4` + `pino-http@10` + `pino-pretty` | Logger app-wide con `autoLogging`, redacción de `Authorization`/`cookie.rt`/`password`/`passwordHash`, `customLogLevel` (info/warn/error según status). |
| OpenAPI/Swagger | `@nestjs/swagger@7` + `swagger-ui-express@5` | UI en `/api/docs`, JSON en `/api/docs-json`. Solo en `NODE_ENV !== 'production'`. Bearer JWT + cookie `rt` configurados. |
| Tests | `vitest@1` con `vitest.setup.ts` (carga `reflect-metadata`) | 15 tests passing en 3 archivos. |
| Lint backend | `.eslintrc.cjs` + `.prettierrc` + `eslint-config-prettier` | Reglas TS estándar + Prettier como último. |
| Lint frontend | `.eslintrc.cjs` + `.prettierrc` | ESLint ya estaba en deps; añadida config. |

**Removido:** `backend/src/common/interceptors/logging.interceptor.ts` — Pino ya loguea HTTP con `autoLogging`. La carpeta `interceptors` ya no existe.

**Reorganizado:**
- `AllExceptionsFilter` registrado como `APP_FILTER` (no `useGlobalFilters`), para que NestJS lo respete en el flujo de DI y `Reflector`.
- `nestjs-pino` configurado en `app.module.ts` con redacción de secretos.
- `main.ts` carga `helmet()` + `compression()` antes de las pipes.

---

## 4. Decisiones y trade-offs

- **Versiones pinneadas a CommonJS**: `helmet@7`, `pino-http@10`, `nestjs-pino@4`, `@nestjs/swagger@7`. Versiones más nuevas (helmet 8, pino-http 11) son ESM puro y romperían el build actual (Nest 10 + CommonJS).
- **Refresh token stateless (decisión F1)**: se mantiene JWT-only. El modelo `RefreshToken` existe en schema pero no se usa. Trade-off: simple, sin tabla extra, sin capacidad de revocación individual. Si se requiere revocación, cambiar a BD y consultar en `JwtRefreshStrategy.validate`.
- **Cookie `rt` configurada manualmente por el controller** (no por la strategy): cada respuesta setea/rota/limpia. Se optó por NO usar `cookie-parser` para setting (eso solo parsea incoming), y se usa `response.cookie(...)` de express directamente.
- **Husky/Prettier no configurado**: pre-commit hooks quedan fuera. Si se quiere, añadir `husky` + `lint-staged`.
- **Swagger solo en dev**: por seguridad y para no exponer DTOs internos en producción.
- **`@Public()` se aplica por handler y por class**: si se añade a un controller entero, todas sus rutas son públicas (útil para endpoints utilitarios como `/health` o el futuro `/webhooks`).
- **Frontend sigue intacto**: no se hicieron tests, ni se tocó lógica. Solo `Dockerfile` y ESLint config (ya tenía las deps).
- **Tests usan mocks de Prisma**: para evitar dependencia de una DB levantada en CI. Los services reciben un `PrismaService` mockeado con `vi.fn()` por delegate. Tests son rápidos (~700ms total) y determinísticos. Cuando se necesite cobertura end-to-end, agregar suite e2e con supertest + Postgres de prueba.
- **UUIDs v4 en tests**: `@IsUUID()` sin argumento de `class-validator` valida v4 por defecto, por lo que los specs usan UUIDs con el nibble característico (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`).

---

## 5. Endpoints expuestos hoy

| Método | Ruta | Auth | Respuesta |
|---|---|---|---|
| GET | `/api/health` | pública | `{ status, service, timestamp }` |
| POST | `/api/auth/login` | pública | `{ accessToken, user }` + set cookie `rt` |
| POST | `/api/auth/refresh` | cookie `rt` | `{ accessToken }` + rota cookie `rt` |
| POST | `/api/auth/logout` | Bearer | 204 + clear cookie `rt` |
| GET | `/api/auth/me` | Bearer | `{ id, correo, rol, sucursalId }` |
| GET | `/api/docs` | pública (dev) | Swagger UI |
| GET | `/api/docs-json` | pública (dev) | OpenAPI spec |

Errores siempre devuelven `{ statusCode, error, message, path, timestamp }`.

---

## 6. Variables de entorno

| Var | Requerida | Default | Notas |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development`/`production`/`test` |
| `PORT` | no | `3000` | numérico (string) |
| `CORS_ORIGIN` | no | `http://localhost:5173` | CSV de orígenes |
| `DATABASE_URL` | **sí** | — | formato `postgresql://...` |
| `JWT_ACCESS_SECRET` | **sí** | — | ≥16 chars |
| `JWT_ACCESS_TTL` | no | `15m` | TTL compatible `jsonwebtoken` (e.g., `15m`, `1h`) |
| `JWT_REFRESH_SECRET` | **sí** | — | ≥16 chars |
| `JWT_REFRESH_TTL` | no | `7d` | |
| `REDIS_HOST` | no | `localhost` | (sin uso todavía, queda para BullMQ) |
| `REDIS_PORT` | no | `6379` | |
| `SMTP_*` | no | varios | (sin uso todavía, queda para F3) |
| `JOB_VENCIMIENTO_OFFSET_MINUTOS` | no | `60` | |
| `JOB_VENCIMIENTO_TICK_CRON` | no | `*/5 * * * *` | |
| `LOG_LEVEL` | no | `info` | pino log level |

---

## 7. Tests

```
$ npm run test -w backend
 ✓ src/config/env.schema.spec.ts                                (6 tests)
 ✓ src/common/dto/pagination.dto.spec.ts                         (6 tests)
 ✓ src/common/dto/list-queries.dto.spec.ts                       (7 tests)
 ✓ src/common/filters/all-exceptions.filter.spec.ts              (3 tests)
 ✓ src/modules/auth/auth.service.spec.ts                         (9 tests)
 ✓ src/modules/auth/dto/login.dto.spec.ts                        (3 tests)
 ✓ src/modules/auth/guards/jwt-auth.guard.spec.ts                (3 tests)
 ✓ src/modules/auth/guards/roles.guard.spec.ts                   (5 tests)
 ✓ src/modules/users/users.service.spec.ts                      (13 tests)
 ✓ src/modules/users/dto/create-user.dto.spec.ts                 (8 tests)
 ✓ src/modules/catalog/sucursal/sucursal.service.spec.ts         (7 tests)
 ✓ src/modules/catalog/sucursal/dto/sucursal.dto.spec.ts         (4 tests)
 ✓ src/modules/catalog/producto/producto.service.spec.ts        (6 tests)
 ✓ src/modules/catalog/producto/dto/producto.dto.spec.ts         (3 tests)
 ✓ src/modules/catalog/insumo/insumo.service.spec.ts            (5 tests)
 ✓ src/modules/catalog/insumo/dto/insumo.dto.spec.ts             (4 tests)
 ✓ src/modules/catalog/turno/turno.service.spec.ts              (11 tests)
 ✓ src/modules/catalog/turno/turno-window.spec.ts                (10 tests)
 ✓ src/modules/catalog/turno/dto/turno.dto.spec.ts               (6 tests)
 ✓ src/modules/catalog/configuracion-merma/config-merma.service.spec.ts (11 tests)
 ✓ src/modules/catalog/configuracion-merma/dto/config-merma.dto.spec.ts (7 tests)
 ✓ src/modules/recipes/recipes.service.spec.ts                  (13 tests)
 ✓ src/modules/recipes/dto/create-recipe.dto.spec.ts             (4 tests)
 ✓ src/modules/recipes/dto/update-recipe.dto.spec.ts             (4 tests)

 Test Files  24 passed (24)
      Tests  157 passed (157)
```

| Suite | Cubre |
|---|---|
| `env.schema.spec.ts` | validación de env (JWT secrets, NODE_ENV, PORT, DATABASE_URL, defaults) |
| `pagination.dto.spec.ts` | defaults, validación pageSize/order, conversión implícita numérica, helper `toPaginatedResult` |
| `list-queries.dto.spec.ts` | filtros de catálogo (search, virtual, reutilizables, tipo, unidad) |
| `all-exceptions.filter.spec.ts` | formato unificado, mapeo a 500, respeto de `getStatus()` para HttpException custom |
| `auth.service.spec.ts` | login (éxito, user inexistente, user inactivo, password incorrecto), refresh (válido, expirado, user borrado/inactivo), hashPassword |
| `auth/guards/*` | `@Public()` opt-out, delegación a super, RolesGuard (allow si no hay @Roles, allow si rol coincide, Forbidden si no, allow multi-rol) |
| `users.service.spec.ts` | CRUD + conflict por correo + NotFound por sucursalId, update con bitácora solo de campos cambiados, changeOwnPassword (éxito y conflicto), resetPassword, deactivate, findByIdOrThrow con include sucursal, findAll paginado |
| `users/dto/*` | validaciones de CreateUser/UpdateUser/ResetPassword/ChangePassword |
| `catalog/sucursal/*` | CRUD + archivado idempotente, conflict por codigo, filtros |
| `catalog/producto/*` | defaults (vidaUtilDias=1, reutilizable=false, tipoReuso=none), SKU único MAYÚSCULAS |
| `catalog/insumo/*` | SKU único MAYÚSCULAS, costoUnitarioActual >= 0, virtual flag |
| `catalog/turno/*` | `turno-window.ts` (solapes normales, contiguos sin solape, nocturno vs matutino caso real panadería), service con no-traslape, validación HH:mm, revalidación en update |
| `catalog/configuracion-merma/*` | conflict defaultGeneral único, validación BadRequest cuando defaultGeneral=true con productoId, resolveThreshold con prioridad producto → insumo → general → 0 |
| `recipes/*` | create con conflict si vigente existe, validateDetalle (vacío, cantidad<=0, duplicado), clone transaccional que cierra vigente y crea N+1, update solo en archivada con delete+create atómico, no-op si detalle vacío |

---

## 8. Cómo arrancar el dev server

```bash
# 1. Postgres
docker compose up -d                              # contenedor walters-bakery-postgres en :5433

# 2. .env
cp backend/.env.example backend/.env
# Editar: JWT_ACCESS_SECRET y JWT_REFRESH_SECRET con strings >=16 chars

# 3. Migración + seed (solo primera vez o tras cambios de schema)
npm install
npm run prisma:migrate -w backend -- --name init
npm run prisma:seed -w backend

# 4. Arrancar
npm run dev:backend                  # http://localhost:3000/api/health
```

**Pruebas rápidas con curl:**

```bash
# Health (público)
curl http://localhost:3000/api/health

# Login
curl -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@walters.local","password":"admin123"}'

# Me (con Bearer)
curl -b /tmp/cookies.txt -H "Authorization: Bearer <accessToken>" \
  http://localhost:3000/api/auth/me

# Refresh (con cookie rt)
curl -b /tmp/cookies.txt -X POST http://localhost:3000/api/auth/refresh

# Logout
curl -b /tmp/cookies.txt -H "Authorization: Bearer <accessToken>" \
  -X POST http://localhost:3000/api/auth/logout
```

---

## 9. Pendientes abiertos

- **Persistencia / revocación de refresh tokens**: tabla `RefreshToken` existe en schema pero no se usa (decisión documentada de mantener stateless). Si en el futuro se requiere revocación individual, hidratar la tabla y consultar en `JwtRefreshStrategy.validate`.
- **ESLint `lint:fix`** en frontend — la config existe pero no se ha ejecutado. Pendiente.
- **Pre-commit hook** (husky + lint-staged) — opcional, no se ha configurado.
- **Tests e2e con supertest**: los tests actuales son unit (services con Prisma mockeado). Cuando se quiera cobertura end-to-end, levantar Postgres de prueba + supertest y validar flujos completos (login → CRUD catalog → recetas).
- **Producción (CU-04/06/07)**: pendiente F2.
- **Cierres (CU-08/09)**: pendiente F2 — incluye retorno automático a central, manejo de `retenido: true`, merma por descuadre.
- **Job vencimiento (CU-16)**: scheduler cableado, falta el `Cron` dinámico por sucursal.
- **Transferencias (CU-10/11/12/13)**: pendiente F3 — incluye FEFO y cuarentena.
- **Clasificación CU-21**: pendiente F3.
- **Notificaciones bandeja + email**: pendiente F3.

---

## 10. Convenciones

- snake_case en nombres físicos de BD, camelCase en modelos Prisma.
- UUIDs v4 como PK.
- Timestamps `createdAt` / `updatedAt` en todos los modelos.
- Mensajes de error, decoradores y logs en español (excepto claves de errores HTTP que vienen de NestJS).
- DTOs separados entre `request` y `response`.
- No se usa repositorio intermediario: los servicios consumen `PrismaService` directamente.
- Tests unitarios en `*.spec.ts` junto al archivo a probar.
- Tests de integración pendientes (e2e con supertest, sin definir).
