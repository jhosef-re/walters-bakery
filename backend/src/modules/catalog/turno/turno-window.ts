/**
 * Helpers de HH:mm para calculos de no-traslape entre turnos.
 *
 * Representacion: cada turno se "expande" a una lista de rangos [a, b) en
 * minutos (donde a, b pueden superar 1440). Para detectar solape, generamos
 * todas las vistas del turno en "hoy" (offset 0) y "manana" (offset 1440)
 * y comparamos contra las dos vistas del otro turno. Si algun par se
 * solapa, hay conflicto.
 */

export const MINUTOS_POR_DIA = 1440;

export interface Shift {
  a: number;
  b: number;
}

export interface TurnoInput {
  horaInicio: string;
  horaFin: string;
  cruzaMedianoche: boolean;
}

export function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return h * 60 + m;
}

/**
 * Dada la representacion logica (00:00-24:00 = un dia, sin offset), devuelve
 * los rangos que ocupa el turno. Un turno que cruza medianoche genera 2
 * rangos: [ini, 1440) + [0, fin).
 */
function rangesEnUnDia(turno: TurnoInput): Shift[] {
  const ai = hhmmToMin(turno.horaInicio);
  const bi = hhmmToMin(turno.horaFin);
  if (!turno.cruzaMedianoche) {
    if (ai >= bi) return []; // invalido
    return [{ a: ai, b: bi }];
  }
  if (ai <= bi) {
    // cruzaMedianoche=true pero horas no cruzan => tratar como normal
    return [{ a: ai, b: bi }];
  }
  // Caso real: [ai, 1440) + [0, bi)
  return [
    { a: ai, b: MINUTOS_POR_DIA },
    { a: 0, b: bi },
  ];
}

/**
 * Devuelve los rangos del turno representados como "hoy" + "manana". Esto
 * captura correctamente solapes entre un turno nocturno y un turno matutino
 * del dia siguiente (caso panaderia: noche 18:00-06:00 vs maniana 05:00-11:00).
 */
function expandBothDays(turno: TurnoInput): Shift[] {
  const out: Shift[] = [];
  for (const r of rangesEnUnDia(turno)) {
    out.push({ a: r.a, b: r.b }); // vista "hoy"
    out.push({ a: r.a + MINUTOS_POR_DIA, b: r.b + MINUTOS_POR_DIA }); // vista "manana"
  }
  return out;
}

export function rangesOverlap(a: Shift, b: Shift): boolean {
  return a.a < b.b && b.a < a.b;
}

export function turnosOverlap(a: TurnoInput, b: TurnoInput): boolean {
  const sa = expandBothDays(a);
  const sb = expandBothDays(b);
  for (const ra of sa) {
    for (const rb of sb) {
      if (rangesOverlap(ra, rb)) return true;
    }
  }
  return false;
}

/** Valida coherencia de horaInicio, horaFin y cruzaMedianoche. */
export function validateShape(
  horaInicio: string,
  horaFin: string,
  cruzaMedianoche: boolean,
): void {
  if (horaInicio === horaFin) {
    throw new Error('horaInicio y horaFin no pueden ser iguales');
  }
  if (!cruzaMedianoche && horaInicio >= horaFin) {
    throw new Error(
      'Para turnos que NO cruzan medianoche, horaInicio debe ser menor a horaFin. Marca cruzaMedianoche=true si la intencion es cruzar.',
    );
  }
}
