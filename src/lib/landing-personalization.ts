export function greetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) return "Dobro jutro";
  if (hour >= 12 && hour < 18) return "Dobar dan";
  if (hour >= 18 && hour < 23) return "Dobro veče";
  return "Dobro došli";
}
export function formatLandingDate(date: Date, locale = "hr-HR") { const formatted = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date); return formatted.charAt(0).toLocaleUpperCase(locale) + formatted.slice(1); }
export function formatLandingTime(date: Date, locale = "hr-HR") { return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(date); }
