import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Rol } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

interface UsuarioStub {
  id: string;
  nombre: string;
  correo: string;
  passwordHash: string;
  rol: Rol;
  sucursalId: string | null;
  estado: boolean;
  debeCambiarPassword: boolean;
}

const makeUsuario = (overrides: Partial<UsuarioStub> = {}): UsuarioStub => ({
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Admin',
  correo: 'admin@walters.local',
  passwordHash: bcrypt.hashSync('admin123', 4),
  rol: Rol.administrador_general,
  sucursalId: 'SUC-001',
  estado: true,
  debeCambiarPassword: true,
  ...overrides,
});

const buildAuth = (overrides: {
  users: Partial<UsersService>;
  jwt?: Partial<JwtService>;
  config?: Partial<ConfigService>;
}): AuthService => {
  const usersMock = {
    findByCorreo: vi.fn(),
    findById: vi.fn(),
    ...overrides.users,
  } as unknown as UsersService;
  const jwtMock = {
    sign: vi.fn((payload: unknown) => `signed.${JSON.stringify(payload)}`),
    verifyAsync: vi.fn(),
    ...overrides.jwt,
  } as unknown as JwtService;
  const configMock = {
    get: vi.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return 'access-secret-aaaaaaaaaaaaaa';
      if (key === 'JWT_ACCESS_TTL') return '15m';
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret-bbbbbbbbbbbbb';
      if (key === 'JWT_REFRESH_TTL') return '7d';
      return undefined;
    }),
    ...overrides.config,
  } as unknown as ConfigService;
  return new AuthService(usersMock, jwtMock, configMock);
};

describe('AuthService', () => {
  describe('login', () => {
    it('devuelve accessToken, refreshToken y user cuando credenciales son validas', async () => {
      const u = makeUsuario();
      const auth = buildAuth({
        users: { findByCorreo: vi.fn().mockResolvedValue(u) },
      });

      const result = await auth.login({ correo: u.correo, password: 'admin123' });

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user).toEqual({
        id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        rol: u.rol,
        sucursalId: u.sucursalId,
        debeCambiarPassword: u.debeCambiarPassword,
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('lanza Unauthorized cuando el usuario no existe', async () => {
      const auth = buildAuth({
        users: { findByCorreo: vi.fn().mockResolvedValue(null) },
      });
      await expect(
        auth.login({ correo: 'nobody@walters.local', password: 'whatever' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lanza Unauthorized cuando el usuario esta inactivo', async () => {
      const auth = buildAuth({
        users: { findByCorreo: vi.fn().mockResolvedValue(makeUsuario({ estado: false })) },
      });
      await expect(
        auth.login({ correo: 'admin@walters.local', password: 'admin123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lanza Unauthorized cuando la contrasena no coincide', async () => {
      const auth = buildAuth({
        users: { findByCorreo: vi.fn().mockResolvedValue(makeUsuario()) },
      });
      await expect(
        auth.login({ correo: 'admin@walters.local', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('issueTokensForRefresh', () => {
    const payload = {
      sub: '22222222-2222-2222-2222-222222222222',
      correo: 'admin@walters.local',
      rol: Rol.administrador_general,
      sucursalId: 'SUC-001',
    };

    it('emite nuevos tokens si el refresh es valido y el usuario activo', async () => {
      const auth = buildAuth({
        jwt: { verifyAsync: vi.fn().mockResolvedValue(payload) },
        users: { findById: vi.fn().mockResolvedValue(makeUsuario({ id: payload.sub })) },
      });

      const tokens = await auth.issueTokensForRefresh('rt-valid');

      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });

    it('lanza Unauthorized si el refresh token no verifica (firma/expiracion)', async () => {
      const auth = buildAuth({
        jwt: { verifyAsync: vi.fn().mockRejectedValue(new Error('jwt expired')) },
        users: { findById: vi.fn() },
      });
      await expect(auth.issueTokensForRefresh('rt-bad')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('lanza Unauthorized si el usuario del refresh ya no existe', async () => {
      const auth = buildAuth({
        jwt: { verifyAsync: vi.fn().mockResolvedValue(payload) },
        users: { findById: vi.fn().mockResolvedValue(null) },
      });
      await expect(auth.issueTokensForRefresh('rt-valid')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('lanza Unauthorized si el usuario del refresh esta inactivo', async () => {
      const auth = buildAuth({
        jwt: { verifyAsync: vi.fn().mockResolvedValue(payload) },
        users: {
          findById: vi.fn().mockResolvedValue(makeUsuario({ id: payload.sub, estado: false })),
        },
      });
      await expect(auth.issueTokensForRefresh('rt-valid')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('hashPassword', () => {
    it('genera un bcrypt hash que valida contra la misma contrasena', async () => {
      const auth = buildAuth({ users: {} });
      const hash = await auth.hashPassword('plain-pass');
      expect(hash).not.toBe('plain-pass');
      expect(await bcrypt.compare('plain-pass', hash)).toBe(true);
      expect(await bcrypt.compare('otra', hash)).toBe(false);
    });
  });
});
