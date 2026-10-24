import { ConflictException, NotFoundException } from '@nestjs/common';
import { TipoReuso, UnidadMedida } from '@prisma/client';
import { ProductoService } from './producto.service';
import { PrismaService } from '../../../prisma/prisma.service';

const buildSvc = () => {
  const prisma = {
    productoTerminado: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return {
    svc: new ProductoService(prisma as unknown as PrismaService),
    prisma,
  };
};

const baseProducto = {
  id: '11111111-aaaa-bbbb-cccc-111111111111',
  sku: 'PAN-BCO',
  nombre: 'Pan blanco',
  descripcion: null,
  unidad: UnidadMedida.pieza,
  vidaUtilDias: 1,
  precioVenta: { toString: () => '5.00' } as unknown as never,
  reutilizable: false,
  tipoReuso: TipoReuso.none,
  estado: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProductoService', () => {
  describe('create', () => {
    it('crea con defaults (vidaUtilDias=1, reutilizable=false, tipoReuso=none)', async () => {
      const { svc, prisma } = buildSvc();
      prisma.productoTerminado.findUnique.mockResolvedValue(null);
      prisma.productoTerminado.create.mockResolvedValue(baseProducto);

      await svc.create({
        sku: 'PAN-BCO',
        nombre: 'Pan blanco',
        unidad: UnidadMedida.pieza,
        precioVenta: 5,
      });

      const args = prisma.productoTerminado.create.mock.calls[0]?.[0];
      expect(args?.data).toEqual(
        expect.objectContaining({
          sku: 'PAN-BCO',
          vidaUtilDias: 1,
          reutilizable: false,
          tipoReuso: 'none',
          estado: true,
        }),
      );
    });

    it('lanza Conflict si SKU ya registrado', async () => {
      const { svc, prisma } = buildSvc();
      prisma.productoTerminado.findUnique.mockResolvedValue(baseProducto);
      await expect(
        svc.create({
          sku: 'PAN-BCO',
          nombre: 'x',
          unidad: UnidadMedida.pieza,
          precioVenta: 5,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('archivar', () => {
    it('marca estado=false si estaba activo', async () => {
      const { svc, prisma } = buildSvc();
      prisma.productoTerminado.findUnique.mockResolvedValue(baseProducto);
      prisma.productoTerminado.update.mockResolvedValue({ ...baseProducto, estado: false });

      await svc.archivar(baseProducto.id);
      expect(prisma.productoTerminado.update).toHaveBeenCalledWith({
        where: { id: baseProducto.id },
        data: { estado: false },
      });
    });

    it('no actualiza si ya estaba inactivo', async () => {
      const { svc, prisma } = buildSvc();
      prisma.productoTerminado.findUnique.mockResolvedValue({ ...baseProducto, estado: false });
      await svc.archivar(baseProducto.id);
      expect(prisma.productoTerminado.update).not.toHaveBeenCalled();
    });
  });

  describe('findBySkuOrThrow', () => {
    it('lanza NotFound si SKU no existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.productoTerminado.findUnique.mockResolvedValue(null);
      await expect(svc.findBySkuOrThrow('NOPE')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('aplica filtros search, reutilizables, unidad, estado', async () => {
      const { svc, prisma } = buildSvc();
      prisma.$transaction.mockResolvedValue([[], 0]);

      await svc.findAll({
        search: 'pan',
        reutilizables: true,
        unidad: UnidadMedida.kg,
        estado: true,
        page: 1,
        pageSize: 10,
        order: 'asc',
      });

      const args = prisma.productoTerminado.findMany.mock.calls[0]?.[0];
      expect(args?.where).toEqual(
        expect.objectContaining({
          OR: expect.any(Array),
          reutilizable: true,
          unidad: UnidadMedida.kg,
          estado: true,
        }),
      );
    });
  });
});
