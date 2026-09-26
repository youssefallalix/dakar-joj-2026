import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@clerk/clerk-react";
import {
  BriefcaseBusiness,
  Calendar,
  Calendars,
  ChevronRight,
  Flame,
  Map,
  Newspaper,
  Star
} from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from "@/components/ui/item";
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { cn } from "cn";

import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { useStateContext } from "./state-provider";
import { MapManager } from "../core/MapManager";
import { Button } from "./ui/button";

export default function Countdown({ targetedDate }: { targetedDate: Date }) {
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

export const HomeContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const {
    setActiveTab,
  } = useStateContext();
  const mapManager = MapManager.getInstance();

  const STARTERS = [
    {
      title: t("home.agenda"),
      description: t("home.agendainfo"),
      available: true,
      color: "#00915a",
      icon: Calendars,
      primaryAction: () => setActiveTab("events"),
      secondaryAction: null,
      secondaryActionLabel: null,
      shortcut: false,
    },
    {
      title: t("home.my_agenda", "My Agenda"),
      available: true,
      icon: Calendar,
      color: "#FFA500",
      active: false,
      primaryAction: () => setActiveTab("events"),
      secondaryAction: null,
      secondaryActionLabel: null,
      shortcut: true,
    },
    {
      title: t("home.maps", "Maps"),
      available: false,
      icon: Map,
      color: "#FFA500",
      active: false,
      primaryAction: () => null,
      secondaryAction: null,
      secondaryActionLabel: null,
      shortcut: true,
    },
    {
      title: t("home.discover"),
      description: t("home.localservices"),
      available: false,
      color: "#b98703",
      icon: Star,
      primaryAction: () => setActiveTab("discover"),
      secondaryAction: null,
      secondaryActionLabel: null,
      shortcut: false,
    },
    {
      title: t("home.torch", "Torch"),
      available: true,
      icon: Flame,
      color: "#FFA500",
      active: mapManager.isTorchVisible(),
      primaryAction: () => void mapManager.toggleTorch(),
      secondaryAction: null,
      secondaryActionLabel: null,
      shortcut: true,
    },
    {
      title: t("home.news", "News"),
      available: true,
      icon: Newspaper,
      color: "#FFA500",
      active: false,
      primaryAction: () => setActiveTab("news"),
      secondaryAction: null,
      secondaryActionLabel: null,
      shortcut: true,
    },
    {
      title: t("home.business"),
      description: t("home.registerplace"),
      available: true,
      color: "#e03a2f",
      icon: BriefcaseBusiness,
      primaryAction: () => setActiveTab("business"),
      secondaryActionLabel: t("home.pricing", "See plans"),
      secondaryAction: () => navigate("/pricing"),
    },
  ]

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col gap-4">
        <Card
          size="sm"
          className={cn(
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
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-xs text-muted-foreground uppercase">
          {t("home.start_with", "Start with...")}
        </h2>
        <ItemGroup className="w-full grid grid-cols-[minmax(0,1fr)_5rem_5rem] gap-1">
          {STARTERS.map((item, index) => (
            <Item
              key={index}
              size="sm"
              variant={item.available ? "outline" : "muted"}
              className={cn(
                "w-full",
                "last:col-span-3",
                !item.shortcut && "relative overflow-hidden",
                item.shortcut
                && "flex-col items-center justify-center",
                item.available
                  ? "group hover:bg-primary/25 cursor-pointer"
                  : "cursor-not-allowed"
              )}
              style={!item.shortcut && item.available ? { backgroundColor: item.color + "10" } : undefined}
              onClick={item.primaryAction}
            >
              <ItemMedia
                variant={item.shortcut ? "icon" : "default"}
                className={cn(
                  !item.shortcut && "w-12 h-12",
                  !item.shortcut && "-z-10",
                  !item.shortcut && "absolute top-1/8 end-0 -translate-x-1/8 -translate-y-1/8"

                )}
              >
                {item.shortcut ? (
                  <item.icon
                    className={cn(
                      "w-12 h-12"
                    )}
                    style={item.shortcut ? { color: item.active ? item.color : undefined } : undefined}
                  />
                ) : (
                  <item.icon
                    className={cn(
                      "w-12 h-12",
                      "text-muted-foreground/20"
                    )}
                    style={{ color: item.color + "50" }}
                  />
                )}
              </ItemMedia>

              <ItemContent className="min-w-0">
                <ItemTitle className={cn(
                  !item.shortcut && "truncate whitespace-nowrap",
                  item.shortcut ? "text-center text-xs" : "text-sm",
                )}>
                  {item.title}
                </ItemTitle>
                {item.description && (

                  <ItemDescription className={cn(
                    "text-xs"
                  )}>
                    {item.description}
                  </ItemDescription>
                )}
              </ItemContent>

              {!item.shortcut && item.secondaryAction !== null && item.available && !isSignedIn && (
                <ItemActions>
                  <Button
                    className="cursor-pointer"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      item.secondaryAction();
                    }}
                  >
                    {item.secondaryActionLabel}
                  </Button>
                </ItemActions>
              )}
              {!item.shortcut && !item.secondaryAction !== null && item.available && (
                <ItemActions className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ItemDescription>
                    <ChevronRight className="w-4 h-4" />
                  </ItemDescription>
                </ItemActions>
              )}
            </Item>
          ))}
        </ItemGroup>
      </div>
    </div>
  );
}
