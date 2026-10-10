import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "cn";
import Autoplay from "embla-carousel-autoplay";
// import { formatDuration } from "../utils/calendar";
import { useRelativeTime } from "@/utils/helpers";
import { getSportIcon } from "@/utils/helpers";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardFooter,
  CardContent,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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

function Countdown({ targetedDate }: { targetedDate: Date }) {
  const { t } = useTranslation();

  const targetDate = targetedDate.getTime();

  const [timeLeft, setTimeLeft] = useState(targetDate - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(targetDate - Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft <= 0) {
    return <span>{t("home.event_is_here", "The event is here!")}</span>;
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <span>
      <span className="text-5xl font-semibold">{days}</span>
      &nbsp;
      <span className="uppercase text-[#f2b705] text-sm">{t("home.days", "days")}</span>
    </span>
  );
}


export const SPORT_OPTIONS_BY_KEY = Object.fromEntries(
  ALL_SPORT_OPTIONS.map((sport) => [sport.key, sport])
);


export const Promo = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || "en";
  const [events, setEvents] = useState<ApiEventsItem[]>([]);
  const [eventLoading, setEventLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getRelativeTime } = useRelativeTime();

  const plugin = useRef(
    Autoplay({
      delay: 6000,
      stopOnInteraction: true
    })
  )

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventLoading(true);
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
        setEventLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <Carousel className="w-full"
      orientation="vertical"
      opts={{
        align: "center",
        loop: true,
      }}
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className="-mt-1 h-42">
        <CarouselItem className="basis-full pt-1">
          <Card
            size="sm"
            className={cn(
              "h-full",
              "backdrop-blur-sm bg-gradient-to-b from-[#f2b705]/10 to-[#f2b705]/5",
              "overflow-hidden relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[linear-gradient(90deg,#008751_0%,#FCD116_52%,#CE1126_100%)] before:content-['']"
            )}
          >
            <CardHeader>
              <CardTitle>
                <Countdown targetedDate={new Date("2026-10-31T00:00:00")} />
              </CardTitle>
              <CardDescription>
                {t("home.countdown_description", "Days left until the Dakar 2026 Youth Olympic Games!")}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Badge variant="secondary" className="uppercase text-xs">
                31 Oct - 13 Nov 2026
              </Badge>
            </CardFooter>
          </Card>
        </CarouselItem>

        {!error && !eventLoading && (
          <CarouselItem
            // key={index}
            className="basis-full pt-1"
          >
            {(events as typeof events).slice(0, 1).map((item, index) => {
              const sport = SPORT_OPTIONS_BY_KEY[item.sport];

              return (
                <Card
                  key={index}
                  size="default"
                  className={cn(
                    "h-full",
                    "group",
                    "backdrop-blur-sm bg-gradient-to-b from-primary/10 to-primary/5",
                  )}
                >
                  {sport?.icon && (
                    <CardHeader
                      className="absolute top-1/8 end-12 -translate-x-1/8 -translate-y-1/8"
                    >
                      <Icon
                        className="w-12 h-12"
                        icon={getSportIcon({ sportId: item.sport }) || "mdi:help"}
                      />
                    </CardHeader>
                  )}
                  <CardContent className="min-w-0 flex-1">
                    <CardTitle
                      className="min-w-0 truncate overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {item.name}
                    </CardTitle>
                    <CardDescription
                      className="min-w-0 truncate overflow-hidden text-ellipsis whitespace-nowrap"
                      title={getRelativeTime(new Date(item.startAt))}
                    >
                      {new Date(item.startAt).toLocaleDateString(lang, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {/*
                      {" • "}
                      {formatDuration(item.startAt, item.endAt, lang)}
                      */}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="shrink-0">
                    <CardDescription className="text-xs">
                      {item.venue}
                    </CardDescription>
                  </CardFooter>
                </Card>
              );
            })}
          </CarouselItem>
        )}
      </CarouselContent>
      <CarouselPrevious size="icon-sm" variant="secondary" className="-top-4" />
      <CarouselNext size="icon-sm" variant="secondary" className="-bottom-4" />
    </Carousel>
  )
}