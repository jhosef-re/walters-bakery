import { ConflictException, NotFoundException } from '@nestjs/common';
import { UnidadMedida } from '@prisma/client';
import { InsumoService } from './insumo.service';
import { PrismaService } from '../../../prisma/prisma.service';

const buildSvc = () => {
  const prisma = {
    insumo: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return {
    svc: new InsumoService(prisma as unknown as PrismaService),
    prisma,
  };
};

const baseInsumo = {
  id: '22222222-aaaa-bbbb-cccc-222222222222',
  sku: 'HARINA',
  nombre: 'Harina de trigo',
  descripcion: null,
  unidad: UnidadMedida.kg,
  costoUnitarioActual: 25,
  virtual: false,
  estado: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('InsumoService', () => {
  describe('create', () => {
    it('crea insumo con defaults (costoUnitarioActual=0, virtual=false, estado=true)', async () => {
      const { svc, prisma } = buildSvc();
      prisma.insumo.findUnique.mockResolvedValue(null);
      prisma.insumo.create.mockResolvedValue(baseInsumo);

      await svc.create({
        sku: 'HARINA',
        nombre: 'Harina de trigo',
        unidad: UnidadMedida.kg,
      });

      const args = prisma.insumo.create.mock.calls[0]?.[0];
      expect(args?.data).toEqual(
        expect.objectContaining({
          sku: 'HARINA',
          costoUnitarioActual: 0,
          virtual: false,
          estado: true,
        }),
      );
    });

    it('lanza Conflict si SKU duplicado', async () => {
      const { svc, prisma } = buildSvc();
      prisma.insumo.findUnique.mockResolvedValue(baseInsumo);
      await expect(
        svc.create({ sku: 'HARINA', nombre: 'x', unidad: UnidadMedida.kg }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('archivar', () => {
    it('no actualiza si ya estaba inactivo', async () => {
      const { svc, prisma } = buildSvc();
      prisma.insumo.findUnique.mockResolvedValue({ ...baseInsumo, estado: false });
      await svc.archivar(baseInsumo.id);
      expect(prisma.insumo.update).not.toHaveBeenCalled();
    });
  });

  describe('findBySkuOrThrow', () => {
    it('lanza NotFound si SKU no existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.insumo.findUnique.mockResolvedValue(null);
      await expect(svc.findBySkuOrThrow('NOPE')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('aplica filtros virtual y estado', async () => {
      const { svc, prisma } = buildSvc();
      prisma.$transaction.mockResolvedValue([[], 0]);

      await svc.findAll({
        virtual: true,
        estado: true,
        page: 1,
        pageSize: 20,
        order: 'asc',
      });

      const args = prisma.insumo.findMany.mock.calls[0]?.[0];
      expect(args?.where).toEqual(
        expect.objectContaining({ virtual: true, estado: true }),
      );
    });
  });
});
