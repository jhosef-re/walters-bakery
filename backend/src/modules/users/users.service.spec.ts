import { ConflictException, NotFoundException } from '@nestjs/common';
import { Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../prisma/prisma.service';

interface PrismaMock {
  usuario: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  sucursal: { findUnique: ReturnType<typeof vi.fn> };
  auditoriaCambio: { createMany: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
}

interface AuthMock {
  hashPassword: ReturnType<typeof vi.fn>;
}

const buildSvc = () => {
  const prisma: PrismaMock = {
    usuario: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    sucursal: { findUnique: vi.fn() },
    auditoriaCambio: { createMany: vi.fn() },
    $transaction: vi.fn(),
  };
  const auth: AuthMock = {
    hashPassword: vi.fn(async (pwd: string) => bcrypt.hashSync(pwd, 4)),
  };
  const svc = new UsersService(
    prisma as unknown as PrismaService,
    auth as unknown as AuthService,
  );
  return { svc, prisma, auth };
};

const baseUsuario = {
  id: '33333333-3333-3333-3333-333333333333',
  nombre: 'Test User',
  correo: 'test@walters.local',
  passwordHash: bcrypt.hashSync('old123', 4),
  rol: Rol.gerente_sucursal,
  sucursalId: 'SUC-001',
  estado: true,
  debeCambiarPassword: true,
};

describe('UsersService', () => {
  describe('create', () => {
    it('crea usuario cuando correo no existe y hashea password', async () => {
      const { svc, prisma, auth } = buildSvc();
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.sucursal.findUnique.mockResolvedValue({ id: 'SUC-001' });
      prisma.usuario.create.mockResolvedValue({ ...baseUsuario, debeCambiarPassword: true });

      const result = await svc.create({
        nombre: 'Test',
        correo: 'test@walters.local',
        password: 'new123',
        rol: Rol.gerente_sucursal,
        sucursalId: 'SUC-001',
      });

      expect(auth.hashPassword).toHaveBeenCalledWith('new123');
      expect(prisma.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            correo: 'test@walters.local',
            debeCambiarPassword: true,
          }),
        }),
      );
      expect(result.debeCambiarPassword).toBe(true);
    });

    it('lanza Conflict si el correo ya existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.usuario.findUnique.mockResolvedValue(baseUsuario);
      await expect(
        svc.create({
          nombre: 'x',
          correo: 'test@walters.local',
          password: 'new123',
          rol: Rol.gerente_sucursal,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lanza NotFound si sucursalId no existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.sucursal.findUnique.mockResolvedValue(null);
      await expect(
        svc.create({
          nombre: 'x',
          correo: 'new@walters.local',
          password: 'new123',
          rol: Rol.gerente_sucursal,
          sucursalId: 'SUC-INVALIDA',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('actualiza campos y registra bitacora solo de los campos que cambiaron', async () => {
      const { svc, prisma } = buildSvc();
      prisma.usuario.findUnique
        .mockResolvedValueOnce({ ...baseUsuario }) // findByIdOrThrow (con include)
        .mockResolvedValueOnce(baseUsuario); // ensureSucursalExists
      prisma.usuario.update.mockResolvedValue({
        ...baseUsuario,
        nombre: 'Renombrado',
        rol: Rol.jefe_produccion,
      });
      prisma.auditoriaCambio.createMany.mockResolvedValue({ count: 2 });

      await svc.update(
        baseUsuario.id,
        { nombre: 'Renombrado', rol: Rol.jefe_produccion },
        'admin-id',
      );

      expect(prisma.usuario.update).toHaveBeenCalled();
      expect(prisma.auditoriaCambio.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ campo: 'nombre', valorAnterior: 'Test User' }),
          expect.objectContaining({ campo: 'rol' }),
        ]),
      });
    });

    it('NO registra bitacora si no hubo cambios', async () => {
      const { svc, prisma } = buildSvc();
      prisma.usuario.findUnique.mockResolvedValueOnce(baseUsuario);
      prisma.usuario.update.mockResolvedValue(baseUsuario);

      await svc.update(baseUsuario.id, {}, 'admin-id');

      expect(prisma.auditoriaCambio.createMany).not.toHaveBeenCalled();
    });

    it('lanza NotFound si el usuario no existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.usuario.findUnique.mockResolvedValue(null);
      await expect(svc.update('no-existe', { nombre: 'x' }, 'admin-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('resetPassword', () => {
    it('hashea nueva contrasena y deja debeCambiarPassword=true por default', async () => {
      const { svc, prisma, auth } = buildSvc();
      prisma.usuario.findUnique.mockResolvedValue(baseUsuario);
      prisma.usuario.update.mockResolvedValue({
        ...baseUsuario,
        passwordHash: 'NEW_HASH',
        debeCambiarPassword: true,
      });
      prisma.auditoriaCambio.createMany.mockResolvedValue({ count: 1 });

      await svc.resetPassword(baseUsuario.id, { nuevaPassword: 'otra456' }, 'admin-id');

      expect(auth.hashPassword).toHaveBeenCalledWith('otra456');
      expect(prisma.usuario.update).toHaveBeenCalledWith({
        where: { id: baseUsuario.id },
        data: expect.objectContaining({ debeCambiarPassword: true }),
      });
      expect(prisma.auditoriaCambio.createMany).toHaveBeenCalled();
    });
  });

  describe('changeOwnPassword', () => {
    it('cambia contrasena y limpia debeCambiarPassword si la actual coincide', async () => {
      const { svc, prisma } = buildSvc();
      prisma.usuario.findUnique.mockResolvedValue(baseUsuario);
      prisma.usuario.update.mockResolvedValue({
        ...baseUsuario,
        debeCambiarPassword: false,
      });

      const result = await svc.changeOwnPassword(
        { id: baseUsuario.id, correo: baseUsuario.correo, rol: baseUsuario.rol, sucursalId: null },
        'old123',
        'new123',
      );

      expect(prisma.usuario.update).toHaveBeenCalledWith({
        where: { id: baseUsuario.id },
        data: expect.objectContaining({ debeCambiarPassword: false }),
      });
      expect(result.debeCambiarPassword).toBe(false);
    });

    it('lanza Conflict si la contrasena actual no coincide', async () => {
      const { svc, prisma } = buildSvc();
      prisma.usuario.findUnique.mockResolvedValue(baseUsuario);
      await expect(
        svc.changeOwnPassword(
          { id: baseUsuario.id, correo: baseUsuario.correo, rol: baseUsuario.rol, sucursalId: null },
          'wrong',
          'new123',
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('deactivate', () => {
    it('marca estado=false y registra bitacora', async () => {
      const { svc, prisma } = buildSvc();
      prisma.usuario.findUnique.mockResolvedValue(baseUsuario);
      prisma.usuario.update.mockResolvedValue({ ...baseUsuario, estado: false });
      prisma.auditoriaCambio.createMany.mockResolvedValue({ count: 1 });

      const result = await svc.deactivate(baseUsuario.id, 'admin-id');

      expect(result.estado).toBe(false);
      expect(prisma.auditoriaCambio.createMany).toHaveBeenCalled();
    });
  });

  describe('findByIdOrThrow', () => {
    it('incluye sucursal y devuelve NotFound si no existe', async () => {
      const { svc, prisma } = buildSvc();
      prisma.usuario.findUnique.mockResolvedValue(null);
      await expect(svc.findByIdOrThrow('no-id')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { id: 'no-id' },
        include: { sucursal: true },
      });
    });
  });

  describe('findAll', () => {
    it('pasa search al where con OR + mode insensitive', async () => {
      const { svc, prisma } = buildSvc();
      prisma.$transaction.mockResolvedValue([[], 0]);

      await svc.findAll({ search: 'admin', page: 1, pageSize: 20, order: 'asc' });

      expect(prisma.$transaction).toHaveBeenCalled();
      const [findManyArgs] = prisma.usuario.findMany.mock.calls[0] ?? [];
      expect(findManyArgs).toEqual(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ nombre: expect.objectContaining({ mode: 'insensitive' }) }),
              expect.objectContaining({ correo: expect.objectContaining({ mode: 'insensitive' }) }),
            ]),
          }),
          skip: 0,
          take: 20,
        }),
      );
    });

    it('pagina correctamente', async () => {
      const { svc, prisma } = buildSvc();
      prisma.$transaction.mockResolvedValue([[], 0]);
      await svc.findAll({ page: 2, pageSize: 5, order: 'desc' });
      const args = prisma.usuario.findMany.mock.calls[0]?.[0];
      expect(args?.skip).toBe(5);
      expect(args?.take).toBe(5);
    });
  });
});
