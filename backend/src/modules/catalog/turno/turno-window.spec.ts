import {
  hhmmToMin,
  turnosOverlap,
  validateShape,
} from './turno-window';

describe('turno-window helpers', () => {
  describe('hhmmToMin', () => {
    it('convierte HH:mm a minutos', () => {
      expect(hhmmToMin('06:00')).toBe(360);
      expect(hhmmToMin('18:30')).toBe(1110);
      expect(hhmmToMin('00:00')).toBe(0);
    });
  });

  describe('validateShape', () => {
    it('rechaza ini == fin', () => {
      expect(() => validateShape('08:00', '08:00', false)).toThrow();
    });
    it('rechaza ini >= fin sin cruzar medianoche', () => {
      expect(() => validateShape('18:00', '06:00', false)).toThrow();
    });
    it('permite ini > fin cruzando medianoche', () => {
      expect(() => validateShape('18:00', '06:00', true)).not.toThrow();
    });
  });

  describe('turnosOverlap', () => {
    const maniana = (ini = '05:00', fin = '11:00'): { horaInicio: string; horaFin: string; cruzaMedianoche: boolean } => ({
      horaInicio: ini,
      horaFin: fin,
      cruzaMedianoche: false,
    });

    it('detecta solape entre turnos normales', () => {
      expect(turnosOverlap(maniana('09:00', '12:00'), maniana('11:30', '14:00'))).toBe(true);
    });

    it('no detecta solape en bordes (turnos contiguos)', () => {
      expect(turnosOverlap(maniana('09:00', '11:00'), maniana('11:00', '14:00'))).toBe(false);
    });

    it('detecta solape nocturno vs maniana (caso real panaderia)', () => {
      // Noche 18:00-06:00 (cruza) vs Maniana 05:00-11:00 — se solapan a las 05:00-06:00
      expect(
        turnosOverlap(
          { horaInicio: '18:00', horaFin: '06:00', cruzaMedianoche: true },
          maniana('05:00', '11:00'),
        ),
      ).toBe(true);
    });

    it('no hay solape si maniana empieza despues de que termina la madrugada del turno nocturno', () => {
      // Noche 18:00-04:00 vs Maniana 06:00-12:00 → no solapan
      expect(
        turnosOverlap(
          { horaInicio: '18:00', horaFin: '04:00', cruzaMedianoche: true },
          maniana('06:00', '12:00'),
        ),
      ).toBe(false);
    });

    it('turno de manana no se solapa consigo mismo lejano (mismo dia)', () => {
      expect(turnosOverlap(maniana('06:00', '11:00'), maniana('15:00', '20:00'))).toBe(false);
    });

    it('turno nocturno contra turno de tarde no se solapan', () => {
      // Noche 18:00-06:00 vs Tarde 12:00-17:00
      expect(
        turnosOverlap(
          { horaInicio: '18:00', horaFin: '06:00', cruzaMedianoche: true },
          maniana('12:00', '17:00'),
        ),
      ).toBe(false);
    });
  });
});
