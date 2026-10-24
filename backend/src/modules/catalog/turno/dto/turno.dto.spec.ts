import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateTurnoDto, UpdateTurnoDto } from './turno.dto';

const baseCreate = {
  nombre: 'Mañana',
  horaInicio: '06:00',
  horaFin: '11:00',
};

describe('TurnoDto', () => {
  describe('CreateTurnoDto', () => {
    it('acepta HH:mm valido', () => {
      const dto = plainToInstance(CreateTurnoDto, baseCreate);
      expect(validateSync(dto)).toHaveLength(0);
    });

    it('rechaza formato HH:mm invalido en horaInicio', () => {
      const dto = plainToInstance(CreateTurnoDto, { ...baseCreate, horaInicio: '6am' });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'horaInicio')).toBe(true);
    });

    it('rechaza formato HH:mm invalido en horaFin', () => {
      const dto = plainToInstance(CreateTurnoDto, { ...baseCreate, horaFin: '25:00' });
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'horaFin')).toBe(true);
    });

    it('rechaza orden negativo', () => {
      const dto = plainToInstance(
        CreateTurnoDto,
        { ...baseCreate, orden: -1 },
        { enableImplicitConversion: true },
      );
      const errors = validateSync(dto);
      expect(errors.some((e) => e.property === 'orden')).toBe(true);
    });
  });

  describe('UpdateTurnoDto', () => {
    it('permite cambio parcial solo de estado', () => {
      const dto = plainToInstance(UpdateTurnoDto, { estado: false });
      expect(validateSync(dto)).toHaveLength(0);
    });
  });
});
