import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateRecetaDto } from './update-recipe.dto';
import { UnidadMedida } from '@prisma/client';

const V4_INSUMO_A = 'a1a1a1a1-b2b2-4c3c-8d4d-e5e5e5e5e5e5';
const V4_INSUMO_B = 'b2b2b2b2-c3c3-4d4d-8e5e-f6f6f6f6f6f6';

describe('UpdateRecetaDto', () => {
  it('acepta detalle nuevo con varios insumos', () => {
    const dto = plainToInstance(UpdateRecetaDto, {
      detalle: [
        { insumoId: V4_INSUMO_A, cantidad: 0.5, unidad: UnidadMedida.kg },
        { insumoId: V4_INSUMO_B, cantidad: 0.05, unidad: UnidadMedida.kg },
      ],
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('acepta objeto vacio (no-op)', () => {
    const dto = plainToInstance(UpdateRecetaDto, {});
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rechaza detalle vacio (debe tener >= 1 elemento)', () => {
    const dto = plainToInstance(UpdateRecetaDto, { detalle: [] });
    const errors = validateSync(dto);
    expect(errors.some((e) => e.property === 'detalle')).toBe(true);
  });

  it('rechaza insumoId que no es UUID v4', () => {
    const dto = plainToInstance(UpdateRecetaDto, {
      detalle: [{ insumoId: 'no-uuid', cantidad: 1, unidad: UnidadMedida.kg }],
    });
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
