import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  CreateConfiguracionMermaDto,
  UpdateConfiguracionMermaDto,
} from './config-merma.dto';

describe('ConfiguracionMermaDto', () => {
  describe('CreateConfiguracionMermaDto', () => {
    it('acepta umbral y defaultGeneral=true', () => {
      const dto = plainToInstance(CreateConfiguracionMermaDto, {
        umbral: 10,
        defaultGeneral: true,
      });
      expect(validateSync(dto)).toHaveLength(0);
    });

    it('acepta umbral con override de producto', () => {
      const dto = plainToInstance(CreateConfiguracionMermaDto, {
        umbral: 8,
        productoTerminadoId: 'a1b2c3d4-e5f6-4789-9abc-def012345678',
      });
      expect(validateSync(dto)).toHaveLength(0);
    });

    it('rechaza umbral negativo', () => {
      const dto = plainToInstance(CreateConfiguracionMermaDto, { umbral: -5 });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'umbral')).toBe(true);
    });

    it('rechaza umbral no entero', () => {
      const dto = plainToInstance(
        CreateConfiguracionMermaDto,
        { umbral: 3.5 },
        { enableImplicitConversion: true },
      );
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'umbral')).toBe(true);
    });

    it('rechaza productoTerminadoId que no es UUID', () => {
      const dto = plainToInstance(CreateConfiguracionMermaDto, {
        umbral: 5,
        productoTerminadoId: 'not-a-uuid',
      });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'productoTerminadoId')).toBe(true);
    });
  });

  describe('UpdateConfiguracionMermaDto', () => {
    it('permite cambiar solo defaultGeneral', () => {
      const dto = plainToInstance(UpdateConfiguracionMermaDto, { defaultGeneral: true });
      expect(validateSync(dto)).toHaveLength(0);
    });
  });
});
