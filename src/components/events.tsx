import { useEffect, useMemo, useState } from "react";
import { cn } from "cn";
import { useTranslation } from "react-i18next";
import { AlertCircle, CalendarPlus, Check, ExternalLink } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@iconify/react";
import {
  getCalendarUrl,
  formatDuration,
} from "../utils/calendar";
import { addEventToCalendar } from "../lib/api/events";
import { ALL_SPORT_OPTIONS } from "../data/sports";

type ApiEventsItem = {
  _id: string;
  name: string;
  updatedAt: string;
  startAt: string;
  endAt: string;
  venue: string;
  sport: string;
};

type EventsResponse = {
  success: boolean;
  data: ApiEventsItem[];
};

export const SPORT_OPTIONS_BY_KEY = Object.fromEntries(
  ALL_SPORT_OPTIONS.map((sport) => [sport.key, sport])
);

export function getSportIcon({ sportId }: { sportId: any }) {
  return ALL_SPORT_OPTIONS.find((sport) => sport.key === sportId)?.icon;
}

export const EventsContent = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || "en";
  const [events, setEvents] = useState<ApiEventsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);
  const [trackedEventIds, setTrackedEventIds] = useState<Set<string>>(
    () => new Set()
  );

  async function handleAddToCalendar(event: ApiEventsItem) {
    setLoadingEventId(event._id);

    try {
      window.open(
        getCalendarUrl(event),
        "google-calendar",
        [
          `width=${600}`,
          `height=${700}`,
          `left=${200}`,
          `top=${100}`,
          "popup=yes",
          "noopener,noreferrer",
        ].join(",")
      );

      await addEventToCalendar(event);

      setTrackedEventIds((prev) => {
        const next = new Set(prev);
        next.add(event._id);
        return next;
      });
    } catch (error) {
      console.error("Failed to track calendar addition:", error);
    } finally {
      setLoadingEventId(null);
    }
  }

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/api/v2/events?status=published&limit=20"
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }

        const result: EventsResponse = await response.json();

        if (!result.success) {
          throw new Error("Failed to fetch events");
        }

        setEvents(result.data);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Unable to load events.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const groups = useMemo(() => {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const startOfDayAfterTomorrow = new Date(startOfTomorrow);
    startOfDayAfterTomorrow.setDate(
      startOfDayAfterTomorrow.getDate() + 1,
    );

    const grouped = {
      earlier: [] as typeof events,
      happening: [] as typeof events,
      today: [] as typeof events,
      tomorrow: [] as typeof events,
      later: [] as typeof events,
    };

    for (const event of events) {
      const start = new Date(event.startAt);
      const end = new Date(event.endAt);

      // Event has completely finished.
      if (end <= now) {
        grouped.earlier.push(event);
        continue;
      }

      // Event is currently happening.
      if (start <= now && now < end) {
        grouped.happening.push(event);
        continue;
      }

      // Event hasn't started yet.
      if (start < startOfTomorrow) {
        grouped.today.push(event);
      } else if (start < startOfDayAfterTomorrow) {
        grouped.tomorrow.push(event);
      } else {
        grouped.later.push(event);
      }
    }

    const sortByStart = (
      a: (typeof events)[number],
      b: (typeof events)[number],
    ) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime();

    grouped.earlier.sort(
      (a, b) =>
        new Date(b.endAt).getTime() - new Date(a.endAt).getTime(),
    );

    grouped.happening.sort(sortByStart);
    grouped.today.sort(sortByStart);
    grouped.tomorrow.sort(sortByStart);
    grouped.later.sort(sortByStart);

    return grouped;
  }, [events]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="overflow-hidden h-16 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>{error}</AlertTitle>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col gap-2 overflow-hidden">
        <p className="text-xs text-[#f2b705] uppercase">
          {t("events.live_and_upcoming", "Live & upcoming")}
        </p>
        <h2 className="text-xl text-foreground font-bold uppercase">
          {t("events.plan_your_games", "Plan your Games")}
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {[
          [t("events.happening", "Happening now"), groups.happening],
          [t("events.today", "Today"), groups.today],
          [t("events.tomorrow", "Tomorrow"), groups.tomorrow],
          [t("events.later", "Later"), groups.later],
        ].map(([label, items]) => {
          if (!items.length) return null;

          return (
            <div
              className="flex flex-col gap-3"
              key={label as string}>
              <h2 className="text-xs text-muted-foreground uppercase">
                {label as string}
              </h2>

              <ItemGroup className="gap-2">
                {(items as typeof events).map((item, index) => {
                  const sport = SPORT_OPTIONS_BY_KEY[item.sport];
                  const isLoading = loadingEventId === item._id;
                  const tracked = trackedEventIds.has(item._id);

                  return (
                    <Item
                      key={index}
                      size="xs"
                      variant="outline"
                      className="group hover:bg-accent"
                    >
                      {sport?.icon && (
                        <ItemMedia variant="icon" >
                          <Icon
                            icon={getSportIcon({ sportId: item.sport }) || "mdi:help"}
                          />
                        </ItemMedia>
                      )}
                      <ItemContent className="min-w-0 flex-1">
                        <ItemTitle
                          className="min-w-0 truncate overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          {item.name}
                        </ItemTitle>
                        <ItemDescription
                          className="min-w-0 truncate overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          {new Date(item.startAt).toLocaleDateString(lang, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" • "}
                          {formatDuration(item.startAt, item.endAt, lang)}
                        </ItemDescription>
                      </ItemContent>
                      <ItemContent className="shrink-0">
                        <ItemDescription className="text-xs">
                          {item.venue}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions
                        className={cn("shrink-0",
                          "hidden opacity-0 group-hover:flex group-hover:opacity-100 transition-opacity duration-300",
                          (tracked || isLoading) ? "flex opacity-100" : "",
                        )}
                      >
                        <Button
                          variant={isLoading ? "secondary" : tracked ? "outline" : "default"}
                          size={tracked ? "default" : "icon"}
                          onClick={() => handleAddToCalendar(item)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Spinner />
                              <span className="sr-only">{t("calendar.adding_to_calendar", "Adding...")}</span>
                            </>
                          ) : tracked ? (
                            <>
                              <Check />
                              <span>{t("calendar.added_to_calendar", "Added")}</span>
                            </>
                          ) : (
                            <>
                              <CalendarPlus />
                              <span className="sr-only">{t("calendar.add_to_calendar", "Add to Calendar")}</span>
                            </>
                          )}
                        </Button>
                      </ItemActions>
                    </Item>
                  );
                })}
              </ItemGroup>
            </div>
          )
        })}

        <Item onClick={() => window.open("https://tickets.dakar2026.org/ticketing", "_blank")}
          variant="outline"
          className="w-full sticky rounded-xl p-4 bg-primary/90 backdrop-blur-sm min-h-12 bottom-0 cursor-pointer">
          <ItemContent>
            <ItemTitle className="text-sm text-primary-foreground">
              {t("visit_tickets_website", "Get your tickets now")}
            </ItemTitle>
          </ItemContent>
          <ItemContent className="text-primary-foreground">
            <ExternalLink className="w-4 h-4 text-primary-foreground" />
          </ItemContent>
        </Item>
      </div>
    </div>
  );
};
