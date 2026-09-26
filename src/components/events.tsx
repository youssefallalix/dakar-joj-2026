import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
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
      <div className="flex flex-col gap-2">
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
              <Item key={index} size="sm" variant="muted">
                {sport?.icon && (
                  <ItemMedia variant="icon" className="w-10 h-10">
                    <Icon
                      icon={getSportIcon({ sportId: item.sport }) || "mdi:help"}
                      className="w-10 h-10"
                    />
                  </ItemMedia>
                )}
                <ItemContent>
                  <ItemTitle>{item.name}</ItemTitle>
                  <ItemDescription>
                    {new Date(item.startAt).toLocaleDateString(lang, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" • "}
                    {new Date(item.endAt).toLocaleDateString(lang, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" • "}
                    {item.venue}
                  </ItemDescription>
                </ItemContent>
              </Item>
            );
          })}
        </ItemGroup>
      </div>
    </div>
  );
};
