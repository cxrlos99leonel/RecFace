const brazilFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Data no fuso de Brasília no formato YYYY-MM-DD. */
export function toBrazilDate(d: Date = new Date()): string {
  return brazilFormatter.format(d).split("/").reverse().join("-");
}

/** YYYY-MM-DD de N dias atrás (0 = hoje), no fuso de Brasília. */
export function brazilDateDaysAgo(days: number): string {
  return toBrazilDate(new Date(Date.now() - days * 86_400_000));
}

/** YYYY-MM-DD -> DD/MM/YYYY */
export function formatDateBR(isoDate: string): string {
  return isoDate.split("-").reverse().join("/");
}

export function formatTimeBR(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
