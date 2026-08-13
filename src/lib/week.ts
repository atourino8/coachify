// Helpers para trabajar con semanas (lunes-domingo).

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

// YYYY-MM-DD de un Date interpretado en LOCAL, no en UTC.
function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo, 1 = lunes...
  const diff = day === 0 ? -6 : 1 - day; // si domingo, retroceder 6 días
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * YYYY-MM-DD de un Date.
 *
 * ANTES USABA toISOString() Y ESO ERA UN ERROR, no un detalle.
 *
 * Todos los Date que pasan por aquí se construyen en LOCAL: `new Date(iso +
 * 'T00:00:00')`, `new Date(y, m - 1, 1)`, `addDays(...)`. Formatearlos en UTC
 * los devuelve al día ANTERIOR en cualquier huso al este de Greenwich —el
 * nuestro— porque la medianoche del 13 en Madrid son las 22:00 del 12 en UTC.
 *
 * No saltaba en producción porque Vercel corre en UTC, donde local y UTC
 * coinciden. Sí saltaba en el navegador: pasar página en la vista de catorce
 * días retrocedía un día de más en cada salto.
 */
export function formatDateISO(date: Date): string {
  return toLocalISO(date);
}

// Fechas ISO de un rango [startISO, endISO] cuyo día de la semana (0=domingo
// … 6=sábado, como Date#getDay) está en `weekdays`. El tope de 400 días evita
// un bucle sin fin si algún día endISO llega invertido o clavado a un año.
export function datesInRangeOnWeekdays(
  startISO: string,
  endISO: string,
  weekdays: number[]
): string[] {
  const dates: string[] = [];
  const cur = new Date(startISO + 'T00:00:00');
  const end = new Date(endISO + 'T00:00:00');
  let guard = 0;
  while (cur <= end && guard < 400) {
    if (weekdays.includes(cur.getDay())) dates.push(formatDateISO(cur));
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return dates;
}

export function weekDays(start: Date): { iso: string; label: string; short: string }[] {
  const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return labels.map((label, i) => {
    const d = addDays(start, i);
    return {
      iso: formatDateISO(d),
      label,
      short: `${label} ${d.getDate()}`
    };
  });
}

export function formatHumanDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

// Fecha de hoy en formato ISO usando la fecha LOCAL (no UTC).
export function todayISOLocal(): string {
  return toLocalISO(new Date());
}

// Fecha de hoy en formato ISO EN UNA ZONA HORARIA concreta. Necesario en SSR:
// el servidor de Vercel corre en UTC, así que new Date() da la fecha UTC, que
// puede diferir de la fecha real del usuario (p. ej. de noche en España).
// Usamos 'en-CA' porque formatea como YYYY-MM-DD.
export function todayISOInTZ(tz: string): string {
  return isoDateInTZ(new Date(), tz);
}

// Fecha (YYYY-MM-DD) de un instante concreto en una zona horaria. Útil para
// obtener la fecha-calendario de una cita (starts_at es un timestamp) tal como
// la ve el coach, sin desfase UTC del servidor.
export function isoDateInTZ(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch {
    return todayISOLocal();
  }
}

// Cuadrícula de un mes completo (6 semanas Lun-Dom = 42 celdas), con
// metadatos para la UI. `monthISO` es "YYYY-MM".
export function monthGrid(monthISO: string): {
  iso: string;
  dayNum: number;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}[] {
  const today = todayISOLocal();
  const [y, m] = monthISO.split('-').map(Number);
  const firstOfMonth = new Date(y, m - 1, 1);
  // Retroceder hasta el lunes de esa semana
  const dow = firstOfMonth.getDay(); // 0=domingo
  const back = dow === 0 ? 6 : dow - 1;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - back);

  const out = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    const iso = toLocalISO(d);
    out.push({
      iso,
      dayNum: d.getDate(),
      inMonth: d.getMonth() === m - 1,
      isToday: iso === today,
      isPast: iso < today
    });
  }
  return out;
}

// Devuelve "YYYY-MM" del mes actual (local).
export function currentMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

// Suma/resta meses a un "YYYY-MM" y devuelve el nuevo "YYYY-MM".
export function shiftMonth(monthISO: string, delta: number): string {
  const [y, m] = monthISO.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

// Etiqueta legible de un mes: "julio 2026".
export function monthLabel(monthISO: string): string {
  const [y, m] = monthISO.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

// Genera una ventana móvil de `count` días a partir de `startIso`, con
// metadatos para la UI (día de la semana, número, si es hoy/pasado).
export function rollingDays(
  startIso: string,
  count: number
): {
  iso: string;
  weekday: string;
  dayNum: number;
  monthShort: string;
  isToday: boolean;
  isPast: boolean;
}[] {
  const today = todayISOLocal();
  const start = new Date(startIso + 'T00:00:00');
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = toLocalISO(d);
    out.push({
      iso,
      weekday: d.toLocaleDateString('es-ES', { weekday: 'short' }),
      dayNum: d.getDate(),
      monthShort: d.toLocaleDateString('es-ES', { month: 'short' }),
      isToday: iso === today,
      isPast: iso < today
    });
  }
  return out;
}
