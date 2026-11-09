export function getBrazilDate(d?: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d ?? new Date())
    .split("/")
    .reverse()
    .join("-");
}

export function isTodayBrazil(dateStr: string): boolean {
  return dateStr === getBrazilDate();
}
