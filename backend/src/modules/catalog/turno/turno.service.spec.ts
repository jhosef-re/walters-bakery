import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TurnoService } from './turno.service';
import { PrismaService } from '../../../prisma/prisma.service';

const buildSvc = () => {
  const prisma = {
    turno: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    sucursal: { findUnique: vi.fn() },
  };
  return {
    svc: new TurnoService(prisma as unknown as PrismaService),
    prisma,
  };
};

const baseSucursalId = 'SUC-001';

const makeTurno = (overrides: Partial<{
  id: string;
  sucursalId: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  cruzaMedianoche: boolean;
  orden: number;
  estado: boolean;
}> = {}) => ({
  id: 't-1',
  sucursalId: baseSucursalId,
  nombre: 'Turno Mañana',
  horaInicio: '06:00',
  horaFin: '11:00',
  cruzaMedianoche: false,
  orden: 1,
  estado: true,
  ...overrides,
});

describe('TurnoService', () => {
  describe('create', () => {
    it('crea turno cuando la sucursal existe y no hay traslape', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue({ id: baseSucursalId });
      prisma.turno.findMany.mockResolvedValue([]);
      prisma.turno.create.mockResolvedValue(makeTurno());

      await svc.create(baseSucursalId, {
        nombre: 'Mañana',
        horaInicio: '06:00',
        horaFin: '11:00',
      });

      expect(prisma.turno.create).toHaveBeenCalled();
    });

    it('lanza NotFound si la sucursal no existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue(null);
      await expect(
        svc.create(baseSucursalId, {
          nombre: 'x',
          horaInicio: '06:00',
          horaFin: '11:00',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza BadRequest si horaInicio == horaFin', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue({ id: baseSucursalId });
      await expect(
        svc.create(baseSucursalId, {
          nombre: 'x',
          horaInicio: '06:00',
          horaFin: '06:00',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza BadRequest si ini > fin sin cruzar medianoche', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue({ id: baseSucursalId });
      await expect(
        svc.create(baseSucursalId, {
          nombre: 'Noche mal',
          horaInicio: '18:00',
          horaFin: '06:00',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza BadRequest si se traslapa con un turno existente', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue({ id: baseSucursalId });
      prisma.turno.findMany.mockResolvedValue([makeTurno({ horaInicio: '09:00', horaFin: '12:00' })]);

      await expect(
        svc.create(baseSucursalId, {
          nombre: 'Nuevo',
          horaInicio: '11:30',
          horaFin: '14:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('permite crear turno nocturno que cruza medianoche', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue({ id: baseSucursalId });
      prisma.turno.findMany.mockResolvedValue([]);
      prisma.turno.create.mockResolvedValue(
        makeTurno({
          nombre: 'Noche',
          horaInicio: '18:00',
          horaFin: '06:00',
          cruzaMedianoche: true,
          orden: 2,
        }),
      );

      await svc.create(baseSucursalId, {
        nombre: 'Noche',
        horaInicio: '18:00',
        horaFin: '06:00',
        cruzaMedianoche: true,
      });

      const args = prisma.turno.create.mock.calls[0]?.[0];
      expect(args?.data.cruzaMedianoche).toBe(true);
    });
  });

  describe('update', () => {
    it('actualiza sin revalidar traslape si no cambian las horas', async () => {
      const { svc, prisma } = buildSvc();
      prisma.turno.findUnique.mockResolvedValue(makeTurno());
      prisma.turno.update.mockResolvedValue(makeTurno({ nombre: 'Renombrado' }));

      await svc.update('t-1', { nombre: 'Renombrado' });
      expect(prisma.turno.findMany).not.toHaveBeenCalled();
      expect(prisma.turno.update).toHaveBeenCalled();
    });

    it('revalida traslape si cambian las horas', async () => {
      const { svc, prisma } = buildSvc();
      prisma.turno.findUnique.mockResolvedValue(makeTurno());
      prisma.turno.findMany.mockResolvedValue([makeTurno({ id: 't-2', orden: 2, horaInicio: '09:00', horaFin: '12:00' })]);

      await expect(
        svc.update('t-1', { horaInicio: '11:30', horaFin: '14:00' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findBySucursal', () => {
    it('solo trae turnos activos por default', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue({ id: baseSucursalId });
      prisma.turno.findMany.mockResolvedValue([makeTurno()]);

      await svc.findBySucursal(baseSucursalId);

      const args = prisma.turno.findMany.mock.calls[0]?.[0];
      expect(args?.where).toEqual({ sucursalId: baseSucursalId, estado: true });
      expect(args?.orderBy).toEqual({ orden: 'asc' });
    });

    it('puede traer inactivos si onlyActive=false', async () => {
      const { svc, prisma } = buildSvc();
      prisma.sucursal.findUnique.mockResolvedValue({ id: baseSucursalId });
      prisma.turno.findMany.mockResolvedValue([]);

      await svc.findBySucursal(baseSucursalId, false);
      const args = prisma.turno.findMany.mock.calls[0]?.[0];
      expect(args?.where).toEqual({ sucursalId: baseSucursalId });
    });
  });

  describe('findByIdOrThrow', () => {
    it('lanza NotFound si no existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.turno.findUnique.mockResolvedValue(null);
      await expect(svc.findByIdOrThrow('no-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
