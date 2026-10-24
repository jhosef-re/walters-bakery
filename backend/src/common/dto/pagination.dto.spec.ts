import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PaginationDto, toPaginatedResult } from './pagination.dto';

function make(input: Partial<PaginationDto>): PaginationDto {
  return plainToInstance(PaginationDto, input, { enableImplicitConversion: true });
}

describe('PaginationDto', () => {
  it('aplica defaults razonables', () => {
    const dto = make({});
    const errors = validateSync(dto, { skipMissingProperties: true });
    expect(errors).toHaveLength(0);
    expect(dto.pageSize).toBe(20);
    expect(dto.page).toBe(1);
    expect(dto.order).toBe('asc');
  });

  it('rechaza pageSize > 200', () => {
    const dto = make({ pageSize: 999 });
    const errors = validateSync(dto, { skipMissingProperties: true });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza order distinto de asc/desc', () => {
    const dto = make({ order: 'DESCENDING' as unknown as 'asc' });
    const errors = validateSync(dto, { skipMissingProperties: true });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('convierte strings numericos a number', () => {
    const dto = make({
      page: '3' as unknown as number,
      pageSize: '50' as unknown as number,
    });
    expect(dto.page).toBe(3);
    expect(dto.pageSize).toBe(50);
  });
});

describe('toPaginatedResult', () => {
  it('calcula totalPages', () => {
    expect(toPaginatedResult([1, 2], 25, 1, 10).meta.totalPages).toBe(3);
    expect(toPaginatedResult([], 0, 1, 20).meta.totalPages).toBe(1);
    expect(toPaginatedResult([], 100, 1, 20).meta.totalPages).toBe(5);
  });

  it('expone data y meta tal cual', () => {
    const r = toPaginatedResult([1, 2, 3], 3, 1, 20);
    expect(r.data).toEqual([1, 2, 3]);
    expect(r.meta).toEqual({ page: 1, pageSize: 20, total: 3, totalPages: 1 });
  });
});
