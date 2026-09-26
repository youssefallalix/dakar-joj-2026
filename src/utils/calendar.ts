import type { Event } from "../shared/contracts";

export function formatGoogleCalendarDate(date: string) {
  return new Date(date)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function getCalendarUrl(event: Event) {
  const start = event.startAt
    ? formatGoogleCalendarDate(event.startAt)
    : "";

  // If you don't have an end time yet:
  const end = event.endAt
    ? formatGoogleCalendarDate(event.endAt)
    : "";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name ?? "Sport Event",
    dates: `${start}/${end}`,
    details: `${event.sport ?? ""}`,
    location: event.venue ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params}`;
}

export function formatDuration(
  start: Date | string,
  end: Date | string,
  lang: string,
): string {
  const totalMinutes = Math.max(
    0,
    Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 60_000,
    ),
  );

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const format = (unit: Intl.NumberFormatOptions["unit"]) =>
    new Intl.NumberFormat(lang, {
      style: "unit",
      unit,
      unitDisplay: "narrow",
    });

  return (
    [
      days && format("day").format(days),
      hours && format("hour").format(hours),
      minutes && format("minute").format(minutes),
    ]
      .filter(Boolean)
      .join(" ") || format("minute").format(0)
  );
}
