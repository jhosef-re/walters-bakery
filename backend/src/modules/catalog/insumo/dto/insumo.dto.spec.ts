import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateInsumoDto, UpdateInsumoDto } from './insumo.dto';
import { UnidadMedida } from '@prisma/client';

const baseCreate = {
  sku: 'HARINA',
  nombre: 'Harina de trigo',
  unidad: UnidadMedida.kg,
  costoUnitarioActual: 25,
};

describe('InsumoDto', () => {
  describe('CreateInsumoDto', () => {
    it('acepta payload valido', () => {
      const dto = plainToInstance(CreateInsumoDto, baseCreate, {
        enableImplicitConversion: true,
      });
      expect(validateSync(dto)).toHaveLength(0);
    });

    it('rechaza SKU en minusculas', () => {
      const dto = plainToInstance(CreateInsumoDto, { ...baseCreate, sku: 'harina' });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'sku')).toBe(true);
    });

    it('rechaza costoUnitarioActual negativo', () => {
      const dto = plainToInstance(
        CreateInsumoDto,
        { ...baseCreate, costoUnitarioActual: -1 },
        { enableImplicitConversion: true },
      );
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'costoUnitarioActual')).toBe(true);
    });
  });

  describe('UpdateInsumoDto', () => {
    it('permite marcar virtual=true sin tocar el resto', () => {
      const dto = plainToInstance(UpdateInsumoDto, { virtual: true });
      const errors = validateSync(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
