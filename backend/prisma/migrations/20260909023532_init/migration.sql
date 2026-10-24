-- CreateEnum
CREATE TYPE "TipoSucursal" AS ENUM ('central', 'punto_venta');

-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('pieza', 'kg', 'lt', 'paquete');

-- CreateEnum
CREATE TYPE "TipoReuso" AS ENUM ('none', 'materia_prima', 'nuevo_producto');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('administrador_general', 'gerente_sucursal', 'jefe_produccion', 'encargado_cierre', 'encargado_logistica', 'auditor');

-- CreateEnum
CREATE TYPE "EstadoOrdenProduccion" AS ENUM ('planeada', 'en_proceso', 'confirmada', 'cancelada');

-- CreateEnum
CREATE TYPE "TipoReferencia" AS ENUM ('producto_terminado', 'insumo');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('compra', 'produccion_consumo', 'produccion_entrada', 'venta', 'transferencia_salida', 'transferencia_entrada', 'merma', 'ajuste', 'reuso_alta');

-- CreateEnum
CREATE TYPE "TipoIniciativaTransferencia" AS ENUM ('solicitud', 'envio_directo', 'retorno_cierre');

-- CreateEnum
CREATE TYPE "EstadoTransferencia" AS ENUM ('solicitada', 'aprobada', 'rechazada', 'en_transito', 'recibida_pendiente_clasificar', 'completada');

-- CreateEnum
CREATE TYPE "DestinoProductoCentral" AS ENUM ('venta_directa', 'merma', 'reuso');

-- CreateEnum
CREATE TYPE "EstadoCierre" AS ENUM ('cerrado');

-- CreateEnum
CREATE TYPE "OrigenMerma" AS ENUM ('manual', 'descuadre', 'en_transito');

-- CreateEnum
CREATE TYPE "EstadoMerma" AS ENUM ('pendiente_aprobacion', 'confirmada', 'rechazada');

-- CreateTable
CREATE TABLE "Sucursal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "direccion" TEXT,
    "tipo" "TipoSucursal" NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turno" (
    "id" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "cruzaMedianoche" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoTerminado" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "unidad" "UnidadMedida" NOT NULL,
    "vidaUtilDias" INTEGER NOT NULL DEFAULT 1,
    "precioVenta" DECIMAL(12,2) NOT NULL,
    "reutilizable" BOOLEAN NOT NULL DEFAULT false,
    "tipoReuso" "TipoReuso" NOT NULL DEFAULT 'none',
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductoTerminado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insumo" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "unidad" "UnidadMedida" NOT NULL,
    "costoUnitarioActual" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "virtual" BOOLEAN NOT NULL DEFAULT false,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionMerma" (
    "id" TEXT NOT NULL,
    "umbral" INTEGER NOT NULL,
    "defaultGeneral" BOOLEAN NOT NULL DEFAULT false,
    "productoTerminadoId" TEXT,
    "insumoId" TEXT,

    CONSTRAINT "ConfiguracionMerma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receta" (
    "id" TEXT NOT NULL,
    "productoTerminadoId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "vigenteDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenteHasta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecetaDetalle" (
    "id" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "productoTerminadoId" TEXT,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "unidad" "UnidadMedida" NOT NULL,

    CONSTRAINT "RecetaDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "sucursalId" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT true,
    "ultimoCambioPassword" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenProduccion" (
    "id" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "turnoId" TEXT NOT NULL,
    "cantidadPlaneada" DECIMAL(12,4) NOT NULL,
    "cantidadRealProducida" DECIMAL(12,4),
    "estado" "EstadoOrdenProduccion" NOT NULL,
    "motivoCancelacion" TEXT,
    "usuarioCreadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdenProduccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenProduccionDetalleInsumoReal" (
    "id" TEXT NOT NULL,
    "ordenProduccionId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "productoTerminadoId" TEXT,
    "cantidadReal" DECIMAL(12,4) NOT NULL,
    "costoPromedioUsado" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "OrdenProduccionDetalleInsumoReal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenProduccionBitacora" (
    "id" TEXT NOT NULL,
    "ordenProduccionId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrdenProduccionBitacora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lote" (
    "id" TEXT NOT NULL,
    "productoTerminadoId" TEXT NOT NULL,
    "ordenProduccionId" TEXT NOT NULL,
    "fechaProduccion" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "cantidadInicial" DECIMAL(12,4) NOT NULL,
    "cantidadDisponible" DECIMAL(12,4) NOT NULL,
    "costoReal" DECIMAL(12,4) NOT NULL,
    "enCuarentena" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventario" (
    "id" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "tipo" "TipoReferencia" NOT NULL,
    "productoTerminadoId" TEXT,
    "insumoId" TEXT,
    "loteId" TEXT,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "costoPromedio" DECIMAL(12,4) NOT NULL,
    "retenido" BOOLEAN NOT NULL DEFAULT false,
    "enCuarentena" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "tipo" "TipoReferencia" NOT NULL,
    "productoTerminadoId" TEXT,
    "insumoId" TEXT,
    "loteId" TEXT,
    "tipoMovimiento" "TipoMovimiento" NOT NULL,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "costoUnitario" DECIMAL(12,4) NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transferencia" (
    "id" TEXT NOT NULL,
    "origenId" TEXT NOT NULL,
    "destinoId" TEXT NOT NULL,
    "tipoIniciativa" "TipoIniciativaTransferencia" NOT NULL,
    "estado" "EstadoTransferencia" NOT NULL,
    "usuarioCreadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completadaEn" TIMESTAMP(3),
    "cierreId" TEXT,

    CONSTRAINT "Transferencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferenciaDetalle" (
    "id" TEXT NOT NULL,
    "transferenciaId" TEXT NOT NULL,
    "tipo" "TipoReferencia" NOT NULL,
    "productoTerminadoId" TEXT,
    "insumoId" TEXT,
    "loteId" TEXT,
    "cantidadEnviada" DECIMAL(12,4) NOT NULL,
    "cantidadRecibida" DECIMAL(12,4),
    "destinoCentral" "DestinoProductoCentral",
    "insumoVirtualId" TEXT,

    CONSTRAINT "TransferenciaDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReutilizable" (
    "id" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "loteOrigenId" TEXT,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockReutilizable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cierre" (
    "id" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "turnoId" TEXT NOT NULL,
    "totalRecaudado" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoCierre" NOT NULL DEFAULT 'cerrado',
    "contingencia" BOOLEAN NOT NULL DEFAULT false,
    "usuarioCreadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cierre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CierreDetalle" (
    "id" TEXT NOT NULL,
    "cierreId" TEXT NOT NULL,
    "productoTerminadoId" TEXT NOT NULL,
    "loteId" TEXT,
    "cantidadVendida" DECIMAL(12,4) NOT NULL,
    "existenciaFinalDeclarada" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "CierreDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merma" (
    "id" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "tipo" "TipoReferencia" NOT NULL,
    "productoTerminadoId" TEXT,
    "insumoId" TEXT,
    "loteId" TEXT,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "motivo" TEXT NOT NULL,
    "submotivo" TEXT,
    "estado" "EstadoMerma" NOT NULL,
    "origen" "OrigenMerma" NOT NULL,
    "usuarioCreadorId" TEXT NOT NULL,
    "usuarioAprobadorId" TEXT,
    "fechaAprobacion" TIMESTAMP(3),
    "referenciaOrigenTipo" TEXT,
    "referenciaOrigenId" TEXT,
    "ordenProduccionId" TEXT,
    "transferenciaId" TEXT,
    "insumoVirtualDestinoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Merma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "emailEnviado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sucursalId" TEXT,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaCambio" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaCambio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sucursal_codigo_key" ON "Sucursal"("codigo");

-- CreateIndex
CREATE INDEX "Turno_sucursalId_estado_idx" ON "Turno"("sucursalId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Turno_sucursalId_orden_key" ON "Turno"("sucursalId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoTerminado_sku_key" ON "ProductoTerminado"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Insumo_sku_key" ON "Insumo"("sku");

-- CreateIndex
CREATE INDEX "ConfiguracionMerma_productoTerminadoId_idx" ON "ConfiguracionMerma"("productoTerminadoId");

-- CreateIndex
CREATE INDEX "ConfiguracionMerma_insumoId_idx" ON "ConfiguracionMerma"("insumoId");

-- CreateIndex
CREATE UNIQUE INDEX "Receta_productoTerminadoId_version_key" ON "Receta"("productoTerminadoId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RecetaDetalle_recetaId_insumoId_key" ON "RecetaDetalle"("recetaId", "insumoId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_usuarioId_idx" ON "RefreshToken"("usuarioId");

-- CreateIndex
CREATE INDEX "OrdenProduccion_sucursalId_fecha_turnoId_idx" ON "OrdenProduccion"("sucursalId", "fecha", "turnoId");

-- CreateIndex
CREATE INDEX "OrdenProduccionBitacora_ordenProduccionId_idx" ON "OrdenProduccionBitacora"("ordenProduccionId");

-- CreateIndex
CREATE INDEX "Lote_productoTerminadoId_fechaVencimiento_idx" ON "Lote"("productoTerminadoId", "fechaVencimiento");

-- CreateIndex
CREATE INDEX "Lote_enCuarentena_fechaVencimiento_idx" ON "Lote"("enCuarentena", "fechaVencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_loteId_key" ON "Inventario"("loteId");

-- CreateIndex
CREATE INDEX "Inventario_sucursalId_tipo_idx" ON "Inventario"("sucursalId", "tipo");

-- CreateIndex
CREATE INDEX "Inventario_sucursalId_retenido_idx" ON "Inventario"("sucursalId", "retenido");

-- CreateIndex
CREATE INDEX "Inventario_sucursalId_enCuarentena_idx" ON "Inventario"("sucursalId", "enCuarentena");

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_sucursalId_tipo_productoTerminadoId_loteId_key" ON "Inventario"("sucursalId", "tipo", "productoTerminadoId", "loteId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_sucursalId_createdAt_idx" ON "MovimientoInventario"("sucursalId", "createdAt");

-- CreateIndex
CREATE INDEX "MovimientoInventario_referenciaTipo_referenciaId_idx" ON "MovimientoInventario"("referenciaTipo", "referenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "Transferencia_cierreId_key" ON "Transferencia"("cierreId");

-- CreateIndex
CREATE INDEX "Transferencia_estado_idx" ON "Transferencia"("estado");

-- CreateIndex
CREATE INDEX "Transferencia_destinoId_estado_idx" ON "Transferencia"("destinoId", "estado");

-- CreateIndex
CREATE INDEX "TransferenciaDetalle_transferenciaId_idx" ON "TransferenciaDetalle"("transferenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "StockReutilizable_sucursalId_insumoId_loteOrigenId_key" ON "StockReutilizable"("sucursalId", "insumoId", "loteOrigenId");

-- CreateIndex
CREATE UNIQUE INDEX "Cierre_sucursalId_fecha_turnoId_key" ON "Cierre"("sucursalId", "fecha", "turnoId");

-- CreateIndex
CREATE INDEX "Merma_sucursalId_estado_idx" ON "Merma"("sucursalId", "estado");

-- CreateIndex
CREATE INDEX "Merma_origen_idx" ON "Merma"("origen");

-- CreateIndex
CREATE INDEX "Notificacion_usuarioId_leida_idx" ON "Notificacion"("usuarioId", "leida");

-- CreateIndex
CREATE INDEX "AuditoriaCambio_entidad_entidadId_idx" ON "AuditoriaCambio"("entidad", "entidadId");

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionMerma" ADD CONSTRAINT "ConfiguracionMerma_productoTerminadoId_fkey" FOREIGN KEY ("productoTerminadoId") REFERENCES "ProductoTerminado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionMerma" ADD CONSTRAINT "ConfiguracionMerma_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_productoTerminadoId_fkey" FOREIGN KEY ("productoTerminadoId") REFERENCES "ProductoTerminado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaDetalle" ADD CONSTRAINT "RecetaDetalle_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaDetalle" ADD CONSTRAINT "RecetaDetalle_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaDetalle" ADD CONSTRAINT "RecetaDetalle_productoTerminadoId_fkey" FOREIGN KEY ("productoTerminadoId") REFERENCES "ProductoTerminado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenProduccion" ADD CONSTRAINT "OrdenProduccion_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenProduccion" ADD CONSTRAINT "OrdenProduccion_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenProduccion" ADD CONSTRAINT "OrdenProduccion_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "Turno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenProduccion" ADD CONSTRAINT "OrdenProduccion_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenProduccionDetalleInsumoReal" ADD CONSTRAINT "OrdenProduccionDetalleInsumoReal_ordenProduccionId_fkey" FOREIGN KEY ("ordenProduccionId") REFERENCES "OrdenProduccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenProduccionDetalleInsumoReal" ADD CONSTRAINT "OrdenProduccionDetalleInsumoReal_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenProduccionDetalleInsumoReal" ADD CONSTRAINT "OrdenProduccionDetalleInsumoReal_productoTerminadoId_fkey" FOREIGN KEY ("productoTerminadoId") REFERENCES "ProductoTerminado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenProduccionBitacora" ADD CONSTRAINT "OrdenProduccionBitacora_ordenProduccionId_fkey" FOREIGN KEY ("ordenProduccionId") REFERENCES "OrdenProduccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenProduccionBitacora" ADD CONSTRAINT "OrdenProduccionBitacora_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_productoTerminadoId_fkey" FOREIGN KEY ("productoTerminadoId") REFERENCES "ProductoTerminado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_ordenProduccionId_fkey" FOREIGN KEY ("ordenProduccionId") REFERENCES "OrdenProduccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_productoTerminadoId_fkey" FOREIGN KEY ("productoTerminadoId") REFERENCES "ProductoTerminado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_productoTerminadoId_fkey" FOREIGN KEY ("productoTerminadoId") REFERENCES "ProductoTerminado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_origenId_fkey" FOREIGN KEY ("origenId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_cierreId_fkey" FOREIGN KEY ("cierreId") REFERENCES "Cierre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaDetalle" ADD CONSTRAINT "TransferenciaDetalle_transferenciaId_fkey" FOREIGN KEY ("transferenciaId") REFERENCES "Transferencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaDetalle" ADD CONSTRAINT "TransferenciaDetalle_productoTerminadoId_fkey" FOREIGN KEY ("productoTerminadoId") REFERENCES "ProductoTerminado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaDetalle" ADD CONSTRAINT "TransferenciaDetalle_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaDetalle" ADD CONSTRAINT "TransferenciaDetalle_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReutilizable" ADD CONSTRAINT "StockReutilizable_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReutilizable" ADD CONSTRAINT "StockReutilizable_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReutilizable" ADD CONSTRAINT "StockReutilizable_loteOrigenId_fkey" FOREIGN KEY ("loteOrigenId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cierre" ADD CONSTRAINT "Cierre_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cierre" ADD CONSTRAINT "Cierre_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "Turno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cierre" ADD CONSTRAINT "Cierre_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CierreDetalle" ADD CONSTRAINT "CierreDetalle_cierreId_fkey" FOREIGN KEY ("cierreId") REFERENCES "Cierre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CierreDetalle" ADD CONSTRAINT "CierreDetalle_productoTerminadoId_fkey" FOREIGN KEY ("productoTerminadoId") REFERENCES "ProductoTerminado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CierreDetalle" ADD CONSTRAINT "CierreDetalle_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merma" ADD CONSTRAINT "Merma_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merma" ADD CONSTRAINT "Merma_usuarioCreadorId_fkey" FOREIGN KEY ("usuarioCreadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merma" ADD CONSTRAINT "Merma_usuarioAprobadorId_fkey" FOREIGN KEY ("usuarioAprobadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merma" ADD CONSTRAINT "Merma_ordenProduccionId_fkey" FOREIGN KEY ("ordenProduccionId") REFERENCES "OrdenProduccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merma" ADD CONSTRAINT "Merma_transferenciaId_fkey" FOREIGN KEY ("transferenciaId") REFERENCES "Transferencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaCambio" ADD CONSTRAINT "AuditoriaCambio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
