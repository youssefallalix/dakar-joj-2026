import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";

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

import { ALL_SPORT_OPTIONS } from "../data/sports";
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
        <ItemGroup className="gap-2">
          {events.map((item, index) => {
            const sport = SPORT_OPTIONS_BY_KEY[item.sport];
            return (
              <Item
                key={index}
                size="xs"
                variant="outline"
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
                    {new Date(item.endAt).toLocaleDateString(lang, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </ItemDescription>
                </ItemContent>
                <ItemContent className="shrink-0">
                  <ItemDescription className="text-xs">
                    {item.venue}
                  </ItemDescription>
                </ItemContent>
              </Item>
            );
          })}
        </ItemGroup>
        <Item
          onClick={() => window.open("https://tickets.dakar2026.org/ticketing", "_blank")}
          variant="outline"
          className="w-full sticky rounded-xl p-4 bg-primary/90 backdrop-blur-sm min-h-12 bottom-0 cursor-pointer">
          <ItemContent>
            <ItemTitle className="text-sm text-primary-foreground">
              {t("tickets", "Visit the tickets website")}
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
