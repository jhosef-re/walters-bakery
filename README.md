# Walters Bakery — MVP

Sistema de control de inventario, producción, mermas y cierres de venta para panadería multi-sucursal.

## Documentación
- [`Casos_de_Uso_Sistema_Panaderia.md`](./Casos_de_Uso_Sistema_Panaderia.md) — documento funcional maestro.

## Estructura del monorepo
```
walters-bakery/
├── backend/        # NestJS + Prisma + PostgreSQL + Redis (BullMQ)
├── frontend/       # Vite + React + TypeScript + React Query
└── package.json    # npm workspaces (dev, build, lint, test)
```

## Stack
- **Backend:** NestJS, Prisma, PostgreSQL, BullMQ (Redis), JWT (access + refresh en httpOnly cookie), nodemailer.
- **Frontend:** Vite, React 18, TypeScript, React Router, React Query, React Hook Form, Zod, Zustand.
- **Tests:** Vitest (unit/integration backend y frontend), Playwright (e2e, a añadir).

## Variables de entorno
Copia `backend/.env.example` a `backend/.env` y completa los valores.

## Comandos principales
```bash
npm install                  # instala dependencias del monorepo
npm run dev                  # arranca backend y frontend en paralelo
npm run dev:backend          # solo backend (http://localhost:3000/api)
npm run dev:frontend         # solo frontend (http://localhost:5173)
npm run prisma:migrate       # crea/actualiza schema de DB
npm run prisma:generate      # regenera el cliente Prisma
npm run build                # build de producción de ambos
npm run test                 # corre tests
```

## Fases del MVP (un solo hito)
- **F1:** modelo de datos + auth + CU-01 catálogo (con `reutilizable`/`tipo_reuso`, insumos virtuales y turnos configurables) + CU-02 recetas + CU-19 usuarios + `ConfiguracionMerma`.
- **F2:** CU-04/06/07 producción + CU-08 cierre (con transferencia automática a la central y contingencia `retenido`) + CU-09 descuadre + CU-15 merma manual + CU-16 job de vencimiento dinámico por sucursal (incluye alerta en cuarentena) + CU-17 conteo físico.
- **F3:** CU-10/11/12/13 transferencias + CU-13.B Fase 1 (recepción rápida con cuarentena) + CU-21 Fase 2 (clasificación diferida venta/merma/reuso) + notificaciones (bandeja + correo).

## Reglas clave que guían el diseño
- **Turnos configurables por sucursal** (CU-01.E). No hay turnos globales. La validación de no-traslape se hace al guardar. Soporta turnos que cruzan medianoche (`cruzaMedianoche`).
- **Job de vencimiento dinámico** (CU-16): se ejecuta una vez por día por sucursal, N minutos después de la hora de fin del último turno configurado. Sin hora fija global.
- **Inventario en cuarentena** (CU-13.B + CU-21): no disponible para venta, no participa en FEFO. Si vence mientras está en cuarentena, el sistema **alerta** al receptor (no fuerza merma).
- **Inventario retenido** (CU-08 contingencia): cuando una sucursal cierra sin central configurada, el PT no vendido queda con `retenido: true`. No se transfiere automáticamente al configurar la central más tarde.
- **Toda merma pasa por umbral** de `ConfiguracionMerma`, **incluidas las mermas en tránsito** (control antifraude de transporte).
- **Notificaciones por dos canales**: bandeja interna + correo electrónico.

## Pendientes activos (sección 6 del documento)
- Costeo de `stock_reutilizable` derivado de PT mermado.
- SLA configurable de clasificación diferida (CU-21).
- Insumo virtual por defecto para cada producto reutilizable.
- Flujo explícito para gestionar inventario retenido cuando se configure la central después.
- Detalle de CU-03 (compras), CU-05 (validación), CU-17 (semántica de ajuste) y CU-18 (reportes).
