import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateRecetaDto, RecetaDetalleInput } from './create-recipe.dto';
import { UnidadMedida } from '@prisma/client';

const V4_PT = 'a1a1a1a1-b2b2-4c3c-8d4d-e5e5e5e5e5e5';
const V4_INSUMO = 'b2b2b2b2-c3c3-4d4d-8e5e-f6f6f6f6f6f6';

describe('Recipe DTOs', () => {
  describe('RecetaDetalleInput', () => {
    it('requiere insumoId, cantidad > 0, unidad', () => {
      const dto = plainToInstance(RecetaDetalleInput, {
        insumoId: V4_INSUMO,
        cantidad: 0.5,
        unidad: UnidadMedida.kg,
      });
      expect(validateSync(dto)).toHaveLength(0);
    });

    it('rechaza cuando no es numero', () => {
      const dto = plainToInstance(RecetaDetalleInput, {
        insumoId: V4_INSUMO,
        cantidad: 'no-es-numero' as never,
        unidad: UnidadMedida.kg,
      });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'cantidad')).toBe(true);
    });
  });

  describe('CreateRecetaDto', () => {
    it('acepta receta con un detalle', () => {
      const dto = plainToInstance(CreateRecetaDto, {
        productoTerminadoId: V4_PT,
        detalle: [
          {
            insumoId: V4_INSUMO,
            cantidad: 0.5,
            unidad: UnidadMedida.kg,
          },
        ],
      });
      expect(validateSync(dto)).toHaveLength(0);
    });

    it('rechaza detalle vacio', () => {
      const dto = plainToInstance(CreateRecetaDto, {
        productoTerminadoId: V4_PT,
        detalle: [],
      });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'detalle')).toBe(true);
    });
  });
});
