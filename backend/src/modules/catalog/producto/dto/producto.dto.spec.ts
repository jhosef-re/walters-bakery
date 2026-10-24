import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  CreateProductoTerminadoDto,
} from './producto.dto';

const base = {
  sku: 'PAN-X',
  nombre: 'Pan X',
  unidad: 'pieza' as never,
  precioVenta: 5,
};

describe('CreateProductoTerminadoDto', () => {
  it('acepta un payload completo', () => {
    const dto = plainToInstance(CreateProductoTerminadoDto, base, { enableImplicitConversion: true });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza SKU en minusculas', () => {
    const dto = plainToInstance(
      CreateProductoTerminadoDto,
      { ...base, sku: 'pan-bco' },
      { enableImplicitConversion: true },
    );
    const errors = validateSync(dto);
    expect(errors.some((e) => e.property === 'sku')).toBe(true);
  });

  it('rechaza precioVenta <= 0', () => {
    const dto = plainToInstance(
      CreateProductoTerminadoDto,
      { ...base, precioVenta: 0 },
      { enableImplicitConversion: true },
    );
    const errors = validateSync(dto);
    expect(errors.some((e) => e.property === 'precioVenta')).toBe(true);
  });
});
