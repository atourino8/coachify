// Helpers para trabajar con semanas (lunes-domingo).

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

export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
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
// formatDateISO usa toISOString (UTC), que puede dar el día anterior de
// madrugada en husos como el español. Para "hoy" queremos la fecha local.
export function todayISOLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
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
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const iso = `${y}-${m}-${dd}`;
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
