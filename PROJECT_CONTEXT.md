# Walters Bakery — Contexto del Proyecto

Documento vivo de contexto cross-stack (raíz del monorepo). Última actualización: 2026-09-08.

> Documento técnico detallado del backend: [`backend/PROJECT_CONTEXT.md`](./backend/PROJECT_CONTEXT.md).
>
> Documento funcional maestro: [`Casos_de_Uso_Sistema_Panaderia.md`](./Casos_de_Uso_Sistema_Panaderia.md).

---

## 1. Qué es

Sistema de **control de inventario, producción, mermas y cierres de venta** para una cadena de panaderías multi-sucursal. No maneja venta pieza-por-pieza: modela **cierre por turno** con total recaudado + existencia final declarada.

Inventario separado en **materia prima (insumos)** y **producto terminado (PT)** controlado por lotes con vida útil configurable (default 1 día).

---

## 2. Estado actual del MVP

### Línea de progreso por fase

| Fase | Alcance (definido en README.md §Fases) | Estado |
|---|---|---|
| **F1** | modelo de datos + auth + CU-01 catálogo + CU-02 recetas + CU-19 usuarios + `ConfiguracionMerma` | ✅ Cerrada backend. Frontend pendiente (intacto). 157 tests passing. |
| **F2** | CU-04/06/07 producción + CU-08 cierre + CU-09 descuadre + CU-15 merma manual + CU-16 job vencimiento + CU-17 conteo | ⚪ pendiente |
| **F3** | CU-10/11/12/13 transferencias + CU-13.B Fase 1 + CU-21 Fase 2 + notificaciones | ⚪ pendiente |

### Backend

✅ **Listo y operativo**

- Infraestructura NestJS + Prisma + Postgres + Redis (BullMQ).
- Core transversal: `PrismaService` con lifecycle, validación de `.env` con `class-validator` + `EnvSchema`, exception filter global con formato unificado, swagger en `/api/docs`, logger pino estructurado, helmet + compression.
- Auth (F1.1): JWT access + refresh en cookie httpOnly `rt`, bcrypt, estrategias `jwt-access` y `jwt-refresh`, guards globales (`JwtAuthGuard` con `@Public()` opt-out + `RolesGuard` lee `@Roles(...)`), rutas `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Migración Prisma inicial aplicada. Seed con 2 sucursales (1 central + 1 punto_venta) y 6 usuarios demo (admin, 2 gerentes, jefe producción, encargado cierre, auditor).
- `CatalogModule` (CU-01): 5 submódulos con CRUD + archivar — `Sucursal`, `ProductoTerminado`, `Insumo`, `Turno` (con validación de no-traslape y `cruzaMedianoche`), `ConfiguracionMerma` (umbral general + override por producto o insumo + `resolveThreshold` con prioridad).
- `RecipesModule` (CU-02): `Receta` con versionado. `POST /api/recipes` crea v1, `POST /api/recipes/:id/clone` crea N+1 dentro de transacción cerrando la anterior, `PATCH /api/recipes/:id` reemplaza el detalle de una receta archivada (no vigente). Conflict si se intenta editar vigente.
- `UsersModule` (CU-19) completo: CRUD + `/me/profile` + `/me/change-password` + admin reset/activate/deactivate. Bitácora `AuditoriaCambio` automática para cambios en `nombre`/`rol`/`sucursalId`/`estado` y para resets de password.
- **Tests**: 157 tests en 24 archivos. Cubre Auth, Users, Catalog (5), Recipes, Guards, DTOs. Prisma mockeado en services para evitar dependencia de DB en unit tests.
- **Refresh token**: decisión consciente de mantenerlo stateless (JWT-only). El modelo `RefreshToken` existe en schema pero no se usa. Trade-off: simple, sin tabla extra, sin capacidad de revocación individual. Si se requiere revocación, cambiar a BD y consultar en `JwtRefreshStrategy.validate`.

### Frontend

⚪ **Sin tocar** (solo `Dockerfile` de producción generado; `package.json` con Vite + React 18 + TS + TanStack Query + React Hook Form + Zod + Zustand ya estaba dado). El backend de F1 ya expone todos los endpoints; el frontend es la siguiente frontera una vez se priorice.

### Infraestructura

✅ **Listo y operativo**

- Docker Compose con perfiles: `default` (solo Postgres), `with-redis`, `full`, `backend`, `frontend`, `mail`.
- Postgres 16-alpine en host **5433** (DB `walters_bakery`, user/pass `postgres/postgres`, volumen nombrado `walters-bakery_postgres_data`).
- Redis 7-alpine (perfil `with-redis`/`full`).
- MailHog para dev SMTP (perfil `full`/`mail`).
- Backend multi-stage (`node:20-alpine`, usuario no-root, healthcheck a `/api/health`).
- Frontend multi-stage (Vite + `nginx:1.27-alpine`, SPA fallback, cache por hash).

---

## 3. Stack

| Capa | Tecnología |
|---|---|
| **Runtime** | Node 20+ |
| **Backend** | NestJS 10, TypeScript 5, Prisma 5 |
| **DB** | PostgreSQL 16 |
| **Colas** | BullMQ sobre Redis 7 |
| **Auth** | JWT (access en respuesta + refresh en httpOnly cookie `rt`), bcrypt, `@nestjs/passport` |
| **Logger** | pino vía `nestjs-pino` (colorizado en dev, JSON en prod) |
| **Hardening backend** | helmet, compression, swagger en `/api/docs` (solo dev), vitest |
| **Frontend** | Vite 5, React 18, TypeScript 5, React Router 6, TanStack Query 5, React Hook Form 7, Zod 3, Zustand 4 |
| **Tests frontend** | vitest + @testing-library |
| **Linting** | ESLint 8 + `@typescript-eslint`, Prettier 3 |

---

## 4. Reglas de negocio duras (resumen)

(Todas en sección 5 de `Casos_de_Uso_Sistema_Panaderia.md` — esta es la TL;DR.)

- Toda merma pasa por `ConfiguracionMerma`. Sin excepciones (incluye mermas en tránsito).
- Cierre de turno → retorno automático a central (CU-08) → cuarentena (CU-13.B Fase 1) → clasificación (CU-21).
- Sin central → PT no vendido se marca `retenido: true` (no se transfiere retroactivamente).
- Costo promedio ponderado por sucursal.
- Inventario en cuarentena: no vende, no FEFO, vence → alerta (no merma automática).
- FEFO solo PT; fecha de vencimiento se **conserva** al transferir.
- Insumos virtuales (`virtual: true`) solo se alimentan desde mermas con destino reuso.
- `stock_reutilizable` vive únicamente en la central.
- Turnos por sucursal (no globales), `cruzaMedianoche` soportado.
- Job de vencimiento (CU-16) dinámico: una vez por día por sucursal, N min tras fin del último turno.
- Visibilidad entre sucursales no existe; solo Administrador General = vista total.
- Órdenes `confirmada` inmutables; bitácora obligatoria.

---

## 5. Cuentas seed (desarrollo)

| Rol | Correo | Password |
|---|---|---|
| `administrador_general` | admin@walters.local | admin123 |
| `gerente_sucursal` | gerente.centro@walters.local | gerente123 |
| `jefe_produccion` | jefe.centro@walters.local | jefe123 |
| `encargado_cierre` | cierre.centro@walters.local | cierre123 |
| `gerente_sucursal` | gerente.norte@walters.local | gerente123 |
| `auditor` | auditor@walters.local | auditor123 |

> Todos con `debeCambiarPassword: true`. **Solo para desarrollo.**

Sucursales sembradas:

- `SUC-001` — Sucursal Centro (Av. Reforma 123, CDMX) — tipo `central`.
- `SUC-002` — Sucursal Norte (Av. Insurgentes 456, CDMX) — tipo `punto_venta`.

---

## 6. Cómo arrancar

### Stack completo en Docker (recomendado)

```bash
docker compose --profile full up -d --build
# - postgres :5433
# - redis    :6379
# - backend  :3000
# - frontend :8080  (vite build servido por nginx)
# - mailhog  :1025 (smtp) / :8025 (UI web)
```

- API: <http://localhost:3000/api>
- Swagger: <http://localhost:3000/api/docs> (solo en dev)
- Frontend: <http://localhost:8080>
- MailHog UI: <http://localhost:8025>
- Postgres: `localhost:5433` (DB `walters_bakery`, user/pass `postgres/postgres`)

### Solo Postgres (dev con npm)

```bash
docker compose up -d                              # postgres only
cp backend/.env.example backend/.env              # editar secretos JWT (>=16 chars)
npm install
npm run prisma:migrate -w backend -- --name init  # solo la primera vez o tras cambios de schema
npm run prisma:seed -w backend                    # solo una vez
npm run dev                                       # backend :3000 + frontend :5173
```

> Si la DB ya tiene migración aplicada (carpeta `backend/prisma/migrations/`), omite el paso `prisma:migrate`.

### Reset completo

```bash
docker compose down -v                            # elimina contenedores y volumen
rm -rf backend/prisma/migrations                  # para regenerar init desde cero
npm run prisma:migrate -w backend -- --name init
npm run prisma:seed -w backend
```

---

## 7. Comandos

| Acción | Comando |
|---|---|
| Levantar todo | `docker compose --profile full up -d --build` |
| Solo Postgres | `docker compose up -d` |
| Logs backend (docker) | `docker compose --profile backend logs -f` |
| Migrar schema | `npm run prisma:migrate -w backend -- --name <nombre>` |
| Aplicar migración existente | `npm run prisma:deploy -w backend` |
| Generar cliente Prisma | `npm run prisma:generate -w backend` |
| Seed | `npm run prisma:seed -w backend` |
| Build backend | `npm run build -w backend` |
| Lint backend | `npm run lint -w backend` |
| Tests backend | `npm run test -w backend` |
| Dev backend | `npm run dev:backend` |
| Dev frontend | `npm run dev:frontend` |
| Build todo | `npm run build` |
| Tests todo | `npm run test` |

---

## 8. Estructura del monorepo

```
walters-bakery/
├── PROJECT_CONTEXT.md            # ESTE archivo (cross-stack, vista raíz)
├── README.md                     # índice general, fases, reglas de negocio
├── Casos_de_Uso_Sistema_Panaderia.md   # documento funcional maestro
├── docker-compose.yml            # orquestación con perfiles
├── package.json                  # npm workspaces (backend + frontend)
├── backend/
│   ├── PROJECT_CONTEXT.md        # detalle técnico backend
│   ├── Dockerfile                # multi-stage Node 20-alpine
│   ├── .dockerignore / .env.example / .env / .eslintrc.cjs / .prettierrc / .eslintignore / .prettierignore
│   ├── nest-cli.json / tsconfig.json / vitest.config.ts / vitest.setup.ts
│   ├── prisma/
│   │   ├── schema.prisma         # 21 modelos, 13 enums (4 relaciones reparadas)
│   │   ├── migrations/           # generado
│   │   └── seed.ts               # sucursales + 6 usuarios demo
│   └── src/
│       ├── main.ts               # bootstrap: helmet, compression, swagger, pino
│       ├── app.module.ts         # APP_FILTER + APP_GUARD (Jwt + Roles), LoggerModule
│       ├── config/env.schema.ts  # validación de variables de entorno
│       ├── prisma/               # PrismaService + PrismaModule (@Global)
│       ├── common/
│       │   ├── filters/all-exceptions.filter.ts       # + .spec.ts
│       │   ├── decorators/{public,roles,current-user}.decorator.ts
│       │   ├── dto/{pagination,id-param}.dto.ts       # + pagination.spec.ts
│       │   └── types/rol.enum.ts                      # re-export desde Prisma
│       ├── health.controller.ts   # @Public() GET /api/health
│       └── modules/
│           ├── auth/             # ✅ login/refresh/logout/me + JWT strategies + guards
│           ├── users/            # 🟡 UsersService mínimo; CRUD completo pendiente
│           ├── catalog/          # ⚪ placeholder (F1)
│           ├── recipes/          # ⚪ placeholder (F1)
│           ├── production/       # ⚪ placeholder (F2)
│           ├── closures/         # ⚪ placeholder (F2)
│           ├── transfers/        # ⚪ placeholder (F3)
│           ├── inventory/        # ⚪ placeholder (F3)
│           ├── waste/            # ⚪ placeholder (F2)
│           ├── alerts/           # ⚪ placeholder (CU-16/9/13.B, F2/F3)
│           └── notifications/    # ⚪ placeholder (F3)
└── frontend/
    ├── Dockerfile                # Vite + nginx
    ├── nginx.conf                # SPA fallback
    ├── .dockerignore / .prettierrc / .eslintrc.cjs
    ├── index.html / package.json / vite.config.ts / tsconfig.json
    └── src/{components,hooks,pages,router,services,stores,types}
```

---

## 9. Endpoints expuestos hoy

### Auth + salud

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | pública | Estado del servicio |
| POST | `/api/auth/login` | pública | Login con `correo`+`password`. Devuelve `accessToken` y setea cookie `rt`. |
| POST | `/api/auth/refresh` | cookie `rt` | Renueva access + rota cookie. |
| POST | `/api/auth/logout` | Bearer | Limpia cookie `rt`. |
| GET | `/api/auth/me` | Bearer | Devuelve `req.user` parseado del JWT. |
| GET | `/api/docs` | pública (solo dev) | Swagger UI. |
| GET | `/api/docs-json` | pública (solo dev) | OpenAPI JSON. |

### Usuarios (CU-19)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/users/me/profile` | Bearer | Perfil propio. |
| POST | `/api/users/me/change-password` | Bearer | Cambia password propia. |
| GET | `/api/users` | `administrador_general` | Lista paginada, soporta `?search=`. |
| POST | `/api/users` | `administrador_general` | Crea usuario. |
| GET | `/api/users/:id` | Bearer | Perfil por id. |
| PATCH | `/api/users/:id` | `administrador_general` | Edita nombre/rol/sucursal/estado. Genera bitácora. |
| POST | `/api/users/:id/reset-password` | `administrador_general` | Reset + `debeCambiarPassword`. |
| PATCH | `/api/users/:id/deactivate` | `administrador_general` | Marca `estado=false`. |

### Catálogo (CU-01)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/catalog/sucursales` | Bearer | Lista paginada. Filtros `search`, `tipo`, `estado`. |
| GET | `/api/catalog/sucursales/:id` | Bearer | Detalle. |
| POST | `/api/catalog/sucursales` | `administrador_general` | Crea. |
| PATCH | `/api/catalog/sucursales/:id` | `administrador_general` | Edita. |
| DELETE | `/api/catalog/sucursales/:id` | `administrador_general` | Archiva (`estado=false`). |
| GET | `/api/catalog/productos` | Bearer | Lista paginada. Filtros `search`, `reutilizables`, `unidad`, `estado`. |
| GET/POST/PATCH/DELETE | `/api/catalog/productos[/:id]` | Bearer / `administrador_general` | CRUD + archivar. |
| GET/POST/PATCH/DELETE | `/api/catalog/insumos[/:id]` | Bearer / `administrador_general` | CRUD + archivar. |
| GET | `/api/catalog/sucursales/:id/turnos` | Bearer | Turnos activos de la sucursal. |
| POST | `/api/catalog/sucursales/:id/turnos` | `administrador_general`/`gerente_sucursal` | Crea turno (valida no-traslape). |
| GET/PATCH/DELETE | `/api/catalog/turnos/:id` | Bearer / admin+gerente | Detalle, edita, archiva. |
| GET | `/api/catalog/configuracion-merma` | Bearer | Lista todas. |
| GET | `/api/catalog/configuracion-merma/umbral?productoId=&insumoId=` | Bearer | Resuelve umbral aplicable. |
| POST | `/api/catalog/configuracion-merma` | `administrador_general` | Crea (un solo `defaultGeneral=true`). |
| PATCH | `/api/catalog/configuracion-merma/:id` | `administrador_general` | Edita. |

### Recetas (CU-02)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/recipes` | Bearer | Lista todas. `?productoId=` filtra por producto. |
| GET | `/api/recipes/vigente?productoId=` | Bearer | Devuelve la receta vigente de un producto. |
| GET | `/api/recipes/:id` | Bearer | Detalle con detalle expandido. |
| POST | `/api/recipes` | `administrador_general` | Crea v1 (falla si ya hay vigente). |
| POST | `/api/recipes/:id/clone` | `administrador_general` | Versiona (cierra vigente + crea N+1, transaccional). |
| PATCH | `/api/recipes/:id` | `administrador_general` | Reemplaza detalle (solo recetas archivadas; conflict si vigente). |

---

## 10. Próximos pasos

### Camino crítico F1 (recomendado, en orden)

✅ **F1 backend cerrada**. Items ejecutados en este ciclo:

1. ✅ `UsersModule` completo (CU-19): CRUD + `/me/profile`/`/me/change-password` + admin reset/activate/deactivate + bitácora `AuditoriaCambio`.
2. ✅ `CatalogModule` (CU-01): 5 submódulos con CRUD + archivar.
3. ✅ `RecipesModule` (CU-02): crear/clone (versionado transaccional)/update (reemplazo de detalle en receta archivada).
4. ✅ Tests: 157 tests en 24 archivos (services + guards + DTOs).

### Después de F1

- **F2 backend**: Producción (CU-04/06/07), Cierre (CU-08) con retorno automático a central, Descuadre (CU-09) con merma, Merma manual (CU-15), Job vencimiento dinámico por sucursal (CU-16), Conteo físico (CU-17).
- **F3 backend**: Transferencias (CU-10/11/12/13), Cuarentena Fase 1 (CU-13.B), Clasificación (CU-21), Notificaciones (bandeja + email).
- **Frontend**: arrancar contra los endpoints F1 ya expuestos (auth, users, catalog, recipes).

### Pendientes operativos

- ESLint `lint:fix` en frontend — config existe, no se ha ejecutado.
- Tests e2e con supertest contra el servidor levantado (no contemplados en esta ronda; solo unit tests con mocks de Prisma).
- Pre-commit hook (husky + lint-staged) — opcional.
- Revocación de refresh tokens (ver decisión documentada arriba).

---

## 11. Convenciones

- **snake_case** en nombres físicos de BD, **camelCase** en modelos Prisma.
- **UUIDs v4** como PK.
- Timestamps `createdAt` / `updatedAt` en todos los modelos.
- Enums generados por Prisma se re-exportan desde `common/types/`.
- Mensajes de error en español.
- Branching git: no definido (decidir).
- Commits: no se han hecho todavía (decidir convención, p.ej. Conventional Commits).
