import {
  PrismaClient,
  Rol,
  TipoReuso,
  TipoSucursal,
  UnidadMedida,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface SeedUsuario {
  nombre: string;
  correo: string;
  password: string;
  rol: Rol;
  sucursalCodigo: string | null;
}

const USUARIOS: SeedUsuario[] = [
  {
    nombre: 'Administrador General',
    correo: 'admin@walters.local',
    password: 'admin123',
    rol: Rol.administrador_general,
    sucursalCodigo: null,
  },
  {
    nombre: 'Gerente Sucursal Centro',
    correo: 'gerente.centro@walters.local',
    password: 'gerente123',
    rol: Rol.gerente_sucursal,
    sucursalCodigo: 'SUC-001',
  },
  {
    nombre: 'Jefe Produccion Centro',
    correo: 'jefe.centro@walters.local',
    password: 'jefe123',
    rol: Rol.jefe_produccion,
    sucursalCodigo: 'SUC-001',
  },
  {
    nombre: 'Encargado Cierre Centro',
    correo: 'cierre.centro@walters.local',
    password: 'cierre123',
    rol: Rol.encargado_cierre,
    sucursalCodigo: 'SUC-001',
  },
  {
    nombre: 'Gerente Sucursal Norte',
    correo: 'gerente.norte@walters.local',
    password: 'gerente123',
    rol: Rol.gerente_sucursal,
    sucursalCodigo: 'SUC-002',
  },
  {
    nombre: 'Auditor',
    correo: 'auditor@walters.local',
    password: 'auditor123',
    rol: Rol.auditor,
    sucursalCodigo: null,
  },
];

interface SeedProducto {
  sku: string;
  nombre: string;
  descripcion?: string;
  unidad: UnidadMedida;
  precioVenta: number;
  vidaUtilDias?: number;
  reutilizable: boolean;
  tipoReuso: TipoReuso;
}

const PRODUCTOS: SeedProducto[] = [
  {
    sku: 'PAN-BCO',
    nombre: 'Pan Blanco',
    descripcion: 'Bolillo / pan blanco tradicional',
    unidad: UnidadMedida.pieza,
    precioVenta: 3.5,
    vidaUtilDias: 1,
    reutilizable: false,
    tipoReuso: TipoReuso.none,
  },
  {
    sku: 'PAN-CONCHA',
    nombre: 'Concha de Vainilla',
    unidad: UnidadMedida.pieza,
    precioVenta: 12.0,
    vidaUtilDias: 1,
    reutilizable: true,
    tipoReuso: TipoReuso.materia_prima,
  },
  {
    sku: 'PAN-CROISSANT',
    nombre: 'Croissant',
    unidad: UnidadMedida.pieza,
    precioVenta: 18.0,
    vidaUtilDias: 1,
    reutilizable: false,
    tipoReuso: TipoReuso.none,
  },
  {
    sku: 'PAN-BOLILLO',
    nombre: 'Bolillo',
    unidad: UnidadMedida.pieza,
    precioVenta: 4.0,
    vidaUtilDias: 1,
    reutilizable: true,
    tipoReuso: TipoReuso.materia_prima,
  },
  {
    sku: 'PAN-CAMPECHANO',
    nombre: 'Campechano',
    descripcion: 'Pan dulce regional',
    unidad: UnidadMedida.pieza,
    precioVenta: 8.0,
    vidaUtilDias: 1,
    reutilizable: false,
    tipoReuso: TipoReuso.none,
  },
  {
    sku: 'PAN-EMP-MANZANA',
    nombre: 'Empanada de Manzana',
    unidad: UnidadMedida.pieza,
    precioVenta: 15.0,
    vidaUtilDias: 1,
    reutilizable: false,
    tipoReuso: TipoReuso.none,
  },
];

interface SeedInsumo {
  sku: string;
  nombre: string;
  unidad: UnidadMedida;
  costoUnitarioActual: number;
  virtual: boolean;
}

const INSUMOS: SeedInsumo[] = [
  { sku: 'ING-HARINA', nombre: 'Harina de trigo', unidad: UnidadMedida.kg, costoUnitarioActual: 28.0, virtual: false },
  { sku: 'ING-AZUCAR', nombre: 'Azucar', unidad: UnidadMedida.kg, costoUnitarioActual: 25.0, virtual: false },
  { sku: 'ING-MANTEQUILLA', nombre: 'Mantequilla', unidad: UnidadMedida.kg, costoUnitarioActual: 145.0, virtual: false },
  { sku: 'ING-LEVADURA', nombre: 'Levadura', unidad: UnidadMedida.kg, costoUnitarioActual: 220.0, virtual: false },
  { sku: 'ING-SAL', nombre: 'Sal', unidad: UnidadMedida.kg, costoUnitarioActual: 8.0, virtual: false },
  { sku: 'ING-HUEVO', nombre: 'Huevo', unidad: UnidadMedida.pieza, costoUnitarioActual: 1.5, virtual: false },
  { sku: 'ING-MANZANA', nombre: 'Manzana', unidad: UnidadMedida.kg, costoUnitarioActual: 35.0, virtual: false },
  { sku: 'ING-AGUA', nombre: 'Agua', unidad: UnidadMedida.lt, costoUnitarioActual: 0.0, virtual: false },
  { sku: 'ING-PAN-VIEJO', nombre: 'Pan viejo (reutilizado)', unidad: UnidadMedida.kg, costoUnitarioActual: 0, virtual: true },
];

interface SeedTurno {
  sucursalCodigo: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  cruzaMedianoche: boolean;
  orden: number;
}

const TURNOS: SeedTurno[] = [
  { sucursalCodigo: 'SUC-001', nombre: 'Manana', horaInicio: '06:00', horaFin: '12:00', cruzaMedianoche: false, orden: 1 },
  { sucursalCodigo: 'SUC-001', nombre: 'Tarde', horaInicio: '12:00', horaFin: '18:00', cruzaMedianoche: false, orden: 2 },
  { sucursalCodigo: 'SUC-001', nombre: 'Noche', horaInicio: '18:00', horaFin: '24:00', cruzaMedianoche: true, orden: 3 },
  { sucursalCodigo: 'SUC-002', nombre: 'Manana', horaInicio: '07:00', horaFin: '13:00', cruzaMedianoche: false, orden: 1 },
  { sucursalCodigo: 'SUC-002', nombre: 'Tarde', horaInicio: '13:00', horaFin: '20:00', cruzaMedianoche: false, orden: 2 },
];

interface RecetaDetalleSeed {
  insumoSku: string;
  cantidad: number;
  unidad: UnidadMedida;
}

interface SeedReceta {
  productoSku: string;
  detalle: RecetaDetalleSeed[];
}

const RECETAS: SeedReceta[] = [
  {
    productoSku: 'PAN-BCO',
    detalle: [
      { insumoSku: 'ING-HARINA', cantidad: 0.3, unidad: UnidadMedida.kg },
      { insumoSku: 'ING-SAL', cantidad: 0.005, unidad: UnidadMedida.kg },
      { insumoSku: 'ING-LEVADURA', cantidad: 0.005, unidad: UnidadMedida.kg },
      { insumoSku: 'ING-AGUA', cantidad: 0.18, unidad: UnidadMedida.lt },
    ],
  },
  {
    productoSku: 'PAN-CROISSANT',
    detalle: [
      { insumoSku: 'ING-HARINA', cantidad: 0.12, unidad: UnidadMedida.kg },
      { insumoSku: 'ING-MANTEQUILLA', cantidad: 0.05, unidad: UnidadMedida.kg },
      { insumoSku: 'ING-AZUCAR', cantidad: 0.012, unidad: UnidadMedida.kg },
      { insumoSku: 'ING-LEVADURA', cantidad: 0.003, unidad: UnidadMedida.kg },
    ],
  },
  {
    productoSku: 'PAN-CONCHA',
    detalle: [
      { insumoSku: 'ING-HARINA', cantidad: 0.08, unidad: UnidadMedida.kg },
      { insumoSku: 'ING-AZUCAR', cantidad: 0.025, unidad: UnidadMedida.kg },
      { insumoSku: 'ING-MANTEQUILLA', cantidad: 0.015, unidad: UnidadMedida.kg },
      { insumoSku: 'ING-LEVADURA', cantidad: 0.002, unidad: UnidadMedida.kg },
    ],
  },
  {
    productoSku: 'PAN-EMP-MANZANA',
    detalle: [
      { insumoSku: 'ING-HARINA', cantidad: 0.1, unidad: UnidadMedida.kg },
      { insumoSku: 'ING-MANZANA', cantidad: 0.07, unidad: UnidadMedida.kg },
      { insumoSku: 'ING-AZUCAR', cantidad: 0.02, unidad: UnidadMedida.kg },
      { insumoSku: 'ING-MANTEQUILLA', cantidad: 0.012, unidad: UnidadMedida.kg },
    ],
  },
];

async function main(): Promise<void> {
  console.log('[seed] iniciando...');

  console.log('[seed] creando sucursales base...');
  await prisma.sucursal.upsert({
    where: { codigo: 'SUC-001' },
    update: {},
    create: {
      codigo: 'SUC-001',
      nombre: 'Sucursal Centro',
      direccion: 'Av. Reforma 123, CDMX',
      tipo: TipoSucursal.central,
      estado: true,
    },
  });
  await prisma.sucursal.upsert({
    where: { codigo: 'SUC-002' },
    update: {},
    create: {
      codigo: 'SUC-002',
      nombre: 'Sucursal Norte',
      direccion: 'Av. Insurgentes 456, CDMX',
      tipo: TipoSucursal.punto_venta,
      estado: true,
    },
  });

  console.log('[seed] creando usuarios...');
  for (const u of USUARIOS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    let sucursalId: string | null = null;
    if (u.sucursalCodigo) {
      const suc = await prisma.sucursal.findUnique({
        where: { codigo: u.sucursalCodigo },
      });
      sucursalId = suc?.id ?? null;
    }
    await prisma.usuario.upsert({
      where: { correo: u.correo },
      update: {
        nombre: u.nombre,
        rol: u.rol,
        sucursalId,
        estado: true,
        passwordHash,
      },
      create: {
        nombre: u.nombre,
        correo: u.correo,
        passwordHash,
        rol: u.rol,
        sucursalId,
        estado: true,
        debeCambiarPassword: true,
      },
    });
    console.log(`  - ${u.correo} / ${u.password}  (${u.rol})`);
  }

  console.log('[seed] creando productos terminados...');
  for (const p of PRODUCTOS) {
    await prisma.productoTerminado.upsert({
      where: { sku: p.sku },
      update: {
        nombre: p.nombre,
        descripcion: p.descripcion ?? null,
        unidad: p.unidad,
        precioVenta: p.precioVenta,
        vidaUtilDias: p.vidaUtilDias ?? 1,
        reutilizable: p.reutilizable,
        tipoReuso: p.tipoReuso,
        estado: true,
      },
      create: {
        sku: p.sku,
        nombre: p.nombre,
        descripcion: p.descripcion ?? null,
        unidad: p.unidad,
        precioVenta: p.precioVenta,
        vidaUtilDias: p.vidaUtilDias ?? 1,
        reutilizable: p.reutilizable,
        tipoReuso: p.tipoReuso,
        estado: true,
      },
    });
  }

  console.log('[seed] creando insumos...');
  for (const i of INSUMOS) {
    await prisma.insumo.upsert({
      where: { sku: i.sku },
      update: {
        nombre: i.nombre,
        unidad: i.unidad,
        costoUnitarioActual: i.costoUnitarioActual,
        virtual: i.virtual,
        estado: true,
      },
      create: {
        sku: i.sku,
        nombre: i.nombre,
        unidad: i.unidad,
        costoUnitarioActual: i.costoUnitarioActual,
        virtual: i.virtual,
        estado: true,
      },
    });
  }

  console.log('[seed] creando turnos...');
  for (const t of TURNOS) {
    const suc = await prisma.sucursal.findUnique({
      where: { codigo: t.sucursalCodigo },
    });
    if (!suc) continue;
    const existe = await prisma.turno.findFirst({
      where: { sucursalId: suc.id, orden: t.orden },
    });
    if (existe) continue;
    await prisma.turno.create({
      data: {
        sucursalId: suc.id,
        nombre: t.nombre,
        horaInicio: t.horaInicio,
        horaFin: t.horaFin,
        cruzaMedianoche: t.cruzaMedianoche,
        orden: t.orden,
      },
    });
    console.log(`  - ${suc.codigo} ${t.nombre} (${t.horaInicio}-${t.horaFin}${t.cruzaMedianoche ? '*' : ''})`);
  }

  console.log('[seed] creando recetas v1...');
  for (const r of RECETAS) {
    const prod = await prisma.productoTerminado.findUnique({
      where: { sku: r.productoSku },
    });
    if (!prod) continue;
    const existe = await prisma.receta.findFirst({
      where: { productoTerminadoId: prod.id },
    });
    if (existe) continue;
    const detalleCreate = [];
    for (const d of r.detalle) {
      const ins = await prisma.insumo.findUnique({ where: { sku: d.insumoSku } });
      if (!ins) continue;
      detalleCreate.push({
        insumoId: ins.id,
        productoTerminadoId: null,
        cantidad: d.cantidad,
        unidad: d.unidad,
      });
    }
    await prisma.receta.create({
      data: {
        productoTerminadoId: prod.id,
        version: 1,
        vigenteDesde: new Date(),
        detalle: { create: detalleCreate },
      },
    });
    console.log(`  - receta ${r.productoSku} (v1) con ${detalleCreate.length} insumos`);
  }

  console.log('[seed] creando configuracion de mermas...');
  const existeGeneral = await prisma.configuracionMerma.findFirst({
    where: { defaultGeneral: true },
  });
  if (!existeGeneral) {
    await prisma.configuracionMerma.create({
      data: { umbral: 5, defaultGeneral: true },
    });
  }
  const panViejo = await prisma.insumo.findUnique({
    where: { sku: 'ING-PAN-VIEJO' },
  });
  if (panViejo) {
    const existeOverride = await prisma.configuracionMerma.findFirst({
      where: { insumoId: panViejo.id },
    });
    if (!existeOverride) {
      await prisma.configuracionMerma.create({
        data: { umbral: 0, insumoId: panViejo.id },
      });
    }
  }

  console.log('[seed] listo.');
}

main()
  .catch((err) => {
    console.error('[seed] error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
