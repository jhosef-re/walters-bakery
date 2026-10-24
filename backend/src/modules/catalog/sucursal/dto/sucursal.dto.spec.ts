import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  CreateSucursalDto,
  UpdateSucursalDto,
} from './sucursal.dto';
import { TipoSucursal } from '@prisma/client';

const baseCreate = {
  nombre: 'Sucursal Centro',
  codigo: 'SUC-001',
  direccion: 'Av. Reforma 123',
  tipo: TipoSucursal.central,
};

describe('SucursalDto', () => {
  describe('CreateSucursalDto', () => {
    it('acepta payload valido', () => {
      const dto = plainToInstance(CreateSucursalDto, baseCreate, {
        enableImplicitConversion: true,
      });
      expect(validateSync(dto)).toHaveLength(0);
    });

    it('rechaza nombre de 1 caracter', () => {
      const dto = plainToInstance(CreateSucursalDto, { ...baseCreate, nombre: 'a' });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'nombre')).toBe(true);
    });

    it('rechaza tipo fuera del enum', () => {
      const dto = plainToInstance(CreateSucursalDto, { ...baseCreate, tipo: 'invalid' as never });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'tipo')).toBe(true);
    });
  });

  describe('UpdateSucursalDto', () => {
    it('permite actualizacion parcial (solo estado)', () => {
      const dto = plainToInstance(UpdateSucursalDto, { estado: false });
      const errors = validateSync(dto);
      expect(errors).toHaveLength(0);
    });

    it('permite objeto vacio (no-op)', () => {
      const dto = plainToInstance(UpdateSucursalDto, {});
      const errors = validateSync(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
