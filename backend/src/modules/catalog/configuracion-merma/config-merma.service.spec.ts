import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfiguracionMermaService } from './config-merma.service';
import { PrismaService } from '../../../prisma/prisma.service';

const buildSvc = () => {
  const prisma = {
    configuracionMerma: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    svc: new ConfiguracionMermaService(prisma as unknown as PrismaService),
    prisma,
  };
};

const baseGeneral = {
  id: 'cm-1',
  umbral: 5,
  defaultGeneral: true,
  productoTerminadoId: null,
  insumoId: null,
};

describe('ConfiguracionMermaService', () => {
  describe('create', () => {
    it('lanza BadRequest si defaultGeneral=true viene con productoTerminadoId', async () => {
      const { svc } = buildSvc();
      await expect(
        svc.create({
          umbral: 10,
          defaultGeneral: true,
          productoTerminadoId: 'p-1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza BadRequest si no es defaultGeneral y no tiene producto ni insumo', async () => {
      const { svc } = buildSvc();
      await expect(svc.create({ umbral: 10 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza Conflict si ya existe un defaultGeneral', async () => {
      const { svc, prisma } = buildSvc();
      prisma.configuracionMerma.findFirst.mockResolvedValue(baseGeneral);

      await expect(svc.create({ umbral: 5, defaultGeneral: true })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('crea override por producto cuando productoTerminadoId presente', async () => {
      const { svc, prisma } = buildSvc();
      prisma.configuracionMerma.create.mockResolvedValue({
        id: 'cm-2',
        umbral: 8,
        defaultGeneral: false,
        productoTerminadoId: 'p-1',
        insumoId: null,
      });

      await svc.create({ umbral: 8, productoTerminadoId: 'p-1' });

      expect(prisma.configuracionMerma.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          umbral: 8,
          defaultGeneral: false,
          productoTerminadoId: 'p-1',
        }),
      });
    });
  });

  describe('update', () => {
    it('lanza NotFound si id no existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.configuracionMerma.findUnique.mockResolvedValue(null);
      await expect(svc.update('no-id', { umbral: 5 })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('resolveThreshold', () => {
    it('prioriza override por producto', async () => {
      const { svc, prisma } = buildSvc();
      prisma.configuracionMerma.findFirst
        .mockResolvedValueOnce({ ...baseGeneral, umbral: 12 }) // primer findFirst para producto
        .mockResolvedValueOnce(null); // por si acaso
      // Aqui el orden de findFirst es producto, insumo, general
      // Para producto: encuentra override
      prisma.configuracionMerma.findFirst.mockReset();
      prisma.configuracionMerma.findFirst.mockResolvedValueOnce({
        id: 'cm-3',
        umbral: 15,
        defaultGeneral: false,
        productoTerminadoId: 'p-1',
        insumoId: null,
      });

      const r = await svc.resolveThreshold('p-1');
      expect(r).toBe(15);
      // Verificar que NO consulto insumo ni general
      expect(prisma.configuracionMerma.findFirst).toHaveBeenCalledTimes(1);
    });

    it('cae a override por insumo si no hay override por producto', async () => {
      const { svc, prisma } = buildSvc();
      prisma.configuracionMerma.findFirst
        .mockResolvedValueOnce(null) // sin override de producto
        .mockResolvedValueOnce({ id: 'cm-i', umbral: 20, defaultGeneral: false, insumoId: 'i-1' });

      const r = await svc.resolveThreshold('p-1', 'i-1');
      expect(r).toBe(20);
      expect(prisma.configuracionMerma.findFirst).toHaveBeenCalledTimes(2);
    });

    it('cae a default general si no hay overrides', async () => {
      const { svc, prisma } = buildSvc();
      // Sin ids: skip producto+insumo, solo consulta el general
      prisma.configuracionMerma.findFirst.mockResolvedValueOnce({ ...baseGeneral, umbral: 5 });

      const r = await svc.resolveThreshold();
      expect(r).toBe(5);
      expect(prisma.configuracionMerma.findFirst).toHaveBeenCalledTimes(1);
    });

    it('devuelve 0 si nada coincide', async () => {
      const { svc, prisma } = buildSvc();
      prisma.configuracionMerma.findFirst.mockResolvedValue(null);
      const r = await svc.resolveThreshold();
      expect(r).toBe(0);
    });

    it('hace skip directo a general si no se pasan ids', async () => {
      const { svc, prisma } = buildSvc();
      prisma.configuracionMerma.findFirst.mockResolvedValue({ ...baseGeneral, umbral: 7 });
      const r = await svc.resolveThreshold();
      expect(r).toBe(7);
      expect(prisma.configuracionMerma.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('ordena defaultGeneral primero y luego por umbral asc', async () => {
      const { svc, prisma } = buildSvc();
      prisma.configuracionMerma.findMany.mockResolvedValue([]);
      await svc.findAll();
      expect(prisma.configuracionMerma.findMany).toHaveBeenCalledWith({
        orderBy: [{ defaultGeneral: 'desc' }, { umbral: 'asc' }],
      });
    });
  });
});
