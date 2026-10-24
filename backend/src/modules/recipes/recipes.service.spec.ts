import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecipesService } from './recipes.service';
import { PrismaService } from '../../prisma/prisma.service';

const buildSvc = () => {
  type TxMock = {
    receta: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    productoTerminado: { findUnique: ReturnType<typeof vi.fn> };
    recetaDetalle?: { deleteMany: ReturnType<typeof vi.fn> };
  };
  const tx: TxMock = {
    receta: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    productoTerminado: { findUnique: vi.fn() },
  };
  const prisma = {
    receta: tx.receta,
    productoTerminado: tx.productoTerminado,
    $transaction: vi.fn(async (fn: (tx: TxMock) => unknown) => fn(tx)),
  };
  return {
    svc: new RecipesService(prisma as unknown as PrismaService),
    prisma,
    tx,
  };
};

const baseProductoId = 'p-1';
const insumoA = 'i-A';
const insumoB = 'i-B';

const baseReceta = {
  id: 'r-1',
  productoTerminadoId: baseProductoId,
  version: 1,
  vigenteDesde: new Date(),
  vigenteHasta: null,
  detalle: [
    {
      id: 'rd-1',
      recetaId: 'r-1',
      insumoId: insumoA,
      productoTerminadoId: null,
      cantidad: new Prisma.Decimal(0.5),
      unidad: 'kg' as never,
      insumo: { id: insumoA, sku: 'HARINA' },
      productoTerminado: null,
    },
  ],
  productoTerminado: {
    id: baseProductoId,
    sku: 'PAN-BCO',
  },
};

describe('RecipesService', () => {
  describe('create', () => {
    it('crea receta version 1 con detalle', async () => {
      const { svc, prisma } = buildSvc();
      prisma.productoTerminado.findUnique.mockResolvedValue({ id: baseProductoId });
      prisma.receta.findFirst.mockResolvedValue(null); // sin vigente
      prisma.receta.create.mockResolvedValue(baseReceta);

      await svc.create({
        productoTerminadoId: baseProductoId,
        detalle: [
          { insumoId: insumoA, cantidad: 0.5, unidad: 'kg' as never },
        ],
      });

      const args = prisma.receta.create.mock.calls[0]?.[0];
      expect(args?.data.version).toBe(1);
      expect(args?.data.vigenteHasta).toBeNull();
      expect(args?.data.detalle.create).toHaveLength(1);
    });

    it('lanza NotFound si el producto no existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.productoTerminado.findUnique.mockResolvedValue(null);
      await expect(
        svc.create({
          productoTerminadoId: 'no-p',
          detalle: [{ insumoId: insumoA, cantidad: 1, unidad: 'kg' as never }],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza Conflict si ya existe receta vigente para el producto', async () => {
      const { svc, prisma } = buildSvc();
      prisma.productoTerminado.findUnique.mockResolvedValue({ id: baseProductoId });
      prisma.receta.findFirst.mockResolvedValue({ id: 'r-existente', vigenteHasta: null });

      await expect(
        svc.create({
          productoTerminadoId: baseProductoId,
          detalle: [{ insumoId: insumoA, cantidad: 1, unidad: 'kg' as never }],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lanza BadRequest si detalle vacio', async () => {
      const { svc, prisma } = buildSvc();
      prisma.productoTerminado.findUnique.mockResolvedValue({ id: baseProductoId });
      prisma.receta.findFirst.mockResolvedValue(null);

      await expect(
        svc.create({ productoTerminadoId: baseProductoId, detalle: [] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza BadRequest si cantidad <= 0', async () => {
      const { svc, prisma } = buildSvc();
      prisma.productoTerminado.findUnique.mockResolvedValue({ id: baseProductoId });
      prisma.receta.findFirst.mockResolvedValue(null);

      await expect(
        svc.create({
          productoTerminadoId: baseProductoId,
          detalle: [{ insumoId: insumoA, cantidad: 0, unidad: 'kg' as never }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza BadRequest si insumo duplicado en detalle', async () => {
      const { svc, prisma } = buildSvc();
      prisma.productoTerminado.findUnique.mockResolvedValue({ id: baseProductoId });
      prisma.receta.findFirst.mockResolvedValue(null);

      await expect(
        svc.create({
          productoTerminadoId: baseProductoId,
          detalle: [
            { insumoId: insumoA, cantidad: 0.5, unidad: 'kg' as never },
            { insumoId: insumoA, cantidad: 1, unidad: 'kg' as never },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('clone (versionado)', () => {
    it('cierra vigenteHasta de la anterior y crea version N+1 dentro de transaccion', async () => {
      const { svc, prisma, tx } = buildSvc();
      const original = {
        ...baseReceta,
        version: 2,
        detalle: [
          {
            id: 'rd-1',
            recetaId: 'r-1',
            insumoId: insumoA,
            productoTerminadoId: null,
            cantidad: new Prisma.Decimal(0.5),
            unidad: 'kg' as never,
            insumo: { id: insumoA, sku: 'HARINA' },
            productoTerminado: null,
          },
          {
            id: 'rd-2',
            recetaId: 'r-1',
            insumoId: insumoB,
            productoTerminadoId: null,
            cantidad: new Prisma.Decimal(0.1),
            unidad: 'kg' as never,
            insumo: { id: insumoB, sku: 'SAL' },
            productoTerminado: null,
          },
        ],
      };
      prisma.receta.findUnique.mockResolvedValue(original);
      tx.receta.update.mockResolvedValue({ ...original, vigenteHasta: new Date() });
      tx.receta.create.mockResolvedValue({ ...original, id: 'r-2', version: 3 });

      await svc.clone('r-1', { motivo: 'ajuste' });

      // La actualizacion para cerrar la anterior
      expect(tx.receta.update).toHaveBeenCalledWith({
        where: { id: 'r-1' },
        data: { vigenteHasta: expect.any(Date) },
      });
      // La creacion de la nueva version
      const createArgs = tx.receta.create.mock.calls[0]?.[0];
      expect(createArgs?.data.version).toBe(3);
      expect(createArgs?.data.vigenteHasta).toBeNull();
      expect(createArgs?.data.detalle.create).toHaveLength(2);
      // Se ejecuta dentro de transaccion
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('lanza NotFound si la receta original no existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.receta.findUnique.mockResolvedValue(null);
      await expect(svc.clone('no-id', {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findVigente', () => {
    it('consulta por productoTerminadoId y vigenteHasta null', async () => {
      const { svc, prisma } = buildSvc();
      prisma.receta.findFirst.mockResolvedValue(baseReceta);

      await svc.findVigente(baseProductoId);

      expect(prisma.receta.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productoTerminadoId: baseProductoId, vigenteHasta: null },
        }),
      );
    });
  });

  describe('update', () => {
    it('lanza Conflict si la receta esta vigente', async () => {
      const { svc, prisma } = buildSvc();
      prisma.receta.findUnique.mockResolvedValue(baseReceta); // vigenteHasta: null

      await expect(
        svc.update('r-1', {
          detalle: [{ insumoId: insumoA, cantidad: 1, unidad: 'kg' as never }],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza detalle con insumo duplicado', async () => {
      const { svc, prisma } = buildSvc();
      prisma.receta.findUnique.mockResolvedValue({
        ...baseReceta,
        vigenteHasta: new Date(),
      });

      await expect(
        svc.update('r-1', {
          detalle: [
            { insumoId: insumoA, cantidad: 1, unidad: 'kg' as never },
            { insumoId: insumoA, cantidad: 2, unidad: 'kg' as never },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('reemplaza detalle y retorna receta actualizada si NO esta vigente', async () => {
      const { svc, prisma, tx } = buildSvc();
      const archivada = { ...baseReceta, vigenteHasta: new Date() };
      prisma.receta.findUnique.mockResolvedValue(archivada);
      tx.recetaDetalle = {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      };
      tx.receta.update.mockResolvedValue({
        ...archivada,
        detalle: [
          {
            id: 'rd-new',
            recetaId: 'r-1',
            insumoId: insumoA,
            productoTerminadoId: null,
            cantidad: new Prisma.Decimal(0.7),
            unidad: 'kg' as never,
            insumo: { id: insumoA, sku: 'HARINA' },
            productoTerminado: null,
          },
        ],
      });

      const result = await svc.update('r-1', {
        detalle: [{ insumoId: insumoA, cantidad: 0.7, unidad: 'kg' as never }],
      });

      // tx.recetaDetalle.deleteMany se ejecuto dentro de la transaccion
      expect(prisma.$transaction).toHaveBeenCalled();
      // rx.findUnique para verificar receta archivada
      expect(prisma.receta.findUnique).toHaveBeenCalled();
      // rx.update para reemplazar el detalle
      expect(tx.receta.update).toHaveBeenCalled();
      expect(result.id).toBe('r-1');
    });

    it('es no-op si no viene detalle', async () => {
      const { svc, prisma } = buildSvc();
      const archivada = { ...baseReceta, vigenteHasta: new Date() };
      prisma.receta.findUnique.mockResolvedValue(archivada);

      const result = await svc.update('r-1', {});

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual(archivada);
    });
  });
});
