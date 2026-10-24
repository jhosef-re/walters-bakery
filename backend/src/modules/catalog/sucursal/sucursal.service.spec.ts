import { ConflictException, NotFoundException } from '@nestjs/common';
import { TipoSucursal } from '@prisma/client';
import { SucursalService } from './sucursal.service';
import { PrismaService } from '../../../prisma/prisma.service';

const buildSvc = () => {
  const prisma = {
    sucursal: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return {
    svc: new SucursalService(prisma as unknown as PrismaService),
    prisma,
  };
};

const baseSucursal = {
  id: 'SUC-001',
  codigo: 'SUC-001',
  nombre: 'Sucursal Centro',
  direccion: 'Av. Reforma 123',
  tipo: TipoSucursal.central,
  estado: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SucursalService', () => {
  describe('create', () => {
    it('crea sucursal cuando codigo no existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue(null);
      prisma.sucursal.create.mockResolvedValue(baseSucursal);

      const result = await svc.create({
        codigo: 'SUC-001',
        nombre: 'Sucursal Centro',
        tipo: TipoSucursal.central,
      });

      expect(result).toEqual(baseSucursal);
      expect(prisma.sucursal.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ codigo: 'SUC-001' }) }),
      );
    });

    it('lanza Conflict si codigo ya registrado', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue(baseSucursal);
      await expect(
        svc.create({ codigo: 'SUC-001', nombre: 'x', tipo: TipoSucursal.central }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.sucursal.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('actualiza si existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue(baseSucursal);
      prisma.sucursal.update.mockResolvedValue({ ...baseSucursal, nombre: 'Nuevo' });

      const result = await svc.update(baseSucursal.id, { nombre: 'Nuevo' });
      expect(result.nombre).toBe('Nuevo');
    });

    it('lanza NotFound si no existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue(null);
      await expect(svc.update('no-id', { nombre: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('archivar', () => {
    it('marca estado=false si estaba activa', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue(baseSucursal);
      prisma.sucursal.update.mockResolvedValue({ ...baseSucursal, estado: false });

      await svc.archivar(baseSucursal.id);

      expect(prisma.sucursal.update).toHaveBeenCalledWith({
        where: { id: baseSucursal.id },
        data: { estado: false },
      });
    });

    it('no actualiza si ya estaba inactiva', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue({ ...baseSucursal, estado: false });

      await svc.archivar(baseSucursal.id);
      expect(prisma.sucursal.update).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('pasa filtros search, tipo y estado al where', async () => {
      const { svc, prisma } = buildSvc();
      prisma.$transaction.mockResolvedValue([[], 0]);

      await svc.findAll({
        search: 'centro',
        tipo: TipoSucursal.central,
        estado: true,
        page: 1,
        pageSize: 20,
        order: 'asc',
      });

      const args = prisma.sucursal.findMany.mock.calls[0]?.[0];
      expect(args?.where).toEqual(
        expect.objectContaining({
          OR: expect.any(Array),
          tipo: TipoSucursal.central,
          estado: true,
        }),
      );
    });
  });
});
