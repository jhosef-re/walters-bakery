import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  ListInsumosQuery,
  ListProductosQuery,
  ListSucursalesQuery,
  ListUsersQuery,
} from './list-queries.dto';
import { TipoSucursal, UnidadMedida } from '@prisma/client';

describe('List query DTOs', () => {
  describe('ListUsersQuery', () => {
    it('acepta solo search', () => {
      const dto = plainToInstance(ListUsersQuery, { search: 'admin' });
      expect(validateSync(dto, { skipMissingProperties: true })).toHaveLength(0);
    });
  });

  describe('ListSucursalesQuery', () => {
    it('acepta tipo y estado', () => {
      const dto = plainToInstance(ListSucursalesQuery, {
        tipo: TipoSucursal.central,
        estado: true,
      });
      expect(validateSync(dto, { skipMissingProperties: true })).toHaveLength(0);
    });

    it('rechaza tipo fuera del enum', () => {
      const dto = plainToInstance(ListSucursalesQuery, { tipo: 'otra' as never });
      const errors = validateSync(dto, { skipMissingProperties: true });
      expect(errors.some((e) => e.property === 'tipo')).toBe(true);
    });
  });

  describe('ListProductosQuery', () => {
    it('acepta filtros de producto', () => {
      const dto = plainToInstance(ListProductosQuery, {
        reutilizables: true,
        unidad: UnidadMedida.kg,
      });
      expect(validateSync(dto, { skipMissingProperties: true })).toHaveLength(0);
    });

    it('rechaza unidad invalida', () => {
      const dto = plainToInstance(ListProductosQuery, { unidad: 'galon' as never });
      const errors = validateSync(dto, { skipMissingProperties: true });
      expect(errors.some((e) => e.property === 'unidad')).toBe(true);
    });
  });

  describe('ListInsumosQuery', () => {
    it('acepta filtro virtual=true', () => {
      const dto = plainToInstance(ListInsumosQuery, { virtual: true });
      expect(validateSync(dto, { skipMissingProperties: true })).toHaveLength(0);
    });
  });
});
