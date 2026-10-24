import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  ChangePasswordDto,
  CreateUserDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './create-user.dto';
import { Rol } from '@prisma/client';

const V4_SUC = 'a1b2c3d4-e5f6-4789-9abc-def012345678';

describe('User DTOs', () => {
  describe('CreateUserDto', () => {
    it('acepta payload valido', () => {
      const dto = plainToInstance(CreateUserDto, {
        nombre: 'Test',
        correo: 'test@walters.local',
        password: 'new123',
        rol: Rol.gerente_sucursal,
        sucursalId: V4_SUC,
      });
      expect(validateSync(dto)).toHaveLength(0);
    });

    it('rechaza correo invalido', () => {
      const dto = plainToInstance(CreateUserDto, {
        nombre: 'x',
        correo: 'no-es-email',
        password: 'new123',
        rol: Rol.gerente_sucursal,
      });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'correo')).toBe(true);
    });

    it('rechaza password < 6 chars', () => {
      const dto = plainToInstance(CreateUserDto, {
        nombre: 'x',
        correo: 'test@walters.local',
        password: 'short',
        rol: Rol.gerente_sucursal,
      });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('rechaza rol fuera del enum', () => {
      const dto = plainToInstance(CreateUserDto, {
        nombre: 'x',
        correo: 'test@walters.local',
        password: 'new123',
        rol: 'inventado' as never,
      });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'rol')).toBe(true);
    });
  });

  describe('UpdateUserDto', () => {
    it('permite update parcial solo de estado', () => {
      const dto = plainToInstance(UpdateUserDto, { estado: false });
      expect(validateSync(dto)).toHaveLength(0);
    });

    it('rechaza sucursalId no UUID', () => {
      const dto = plainToInstance(UpdateUserDto, { sucursalId: 'no-uuid' });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'sucursalId')).toBe(true);
    });
  });

  describe('ResetPasswordDto', () => {
    it('acepta nuevaPassword >= 6 chars', () => {
      const dto = plainToInstance(ResetPasswordDto, { nuevaPassword: 'newone1' });
      expect(validateSync(dto)).toHaveLength(0);
    });

    it('acepta nuevaPassword + debeCambiarPassword', () => {
      const dto = plainToInstance(ResetPasswordDto, {
        nuevaPassword: 'newone1',
        debeCambiarPassword: false,
      });
      expect(validateSync(dto)).toHaveLength(0);
    });
  });

  describe('ChangePasswordDto', () => {
    it('rechaza cuando passwordNueva < 6', () => {
      const dto = plainToInstance(ChangePasswordDto, {
        passwordActual: 'old1234',
        passwordNueva: 'short',
      });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'passwordNueva')).toBe(true);
    });
  });
});
