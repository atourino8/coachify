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
