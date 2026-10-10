import { useTranslation } from "react-i18next";
import { Clock9, Globe, BadgeCheck, MapPin, ArrowLeft } from "lucide-react";
import { getDomain } from "tldts";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription } from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import type { BusinessListing } from "../../shared/contracts";
import { useStateContext } from "../state-provider";
import { getFriendlyCategoryName } from "@/utils/key-translations";
import { getMediaUrl } from "@/lib/fileConvert";

type RouteStep = {
  instruction: string;
  location: [number, number];
  distance: number;
  duration: number;
  name?: string;
  maneuver?: { type?: string; modifier?: string; exit?: number };
};

export type RouteSummary = {
  distance: number;
  duration: number;
  steps: RouteStep[];
} | null;

export function BusinessDetails({ listing }: { listing: unknown }) {
  const { t } = useTranslation();
  const business = listing as BusinessListing | null;
  const { setSelectedPlace } = useStateContext();

  if (!business) {
    return (
      <Empty>
        <EmptyContent>
          <EmptyDescription>
            {t("place.details.not_found", "Business not found.")}
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="relative flex flex-col gap-2">
      <div className="absolute top-16 start-3">
        <Button
          size="icon"
          variant="secondary"
          className="fixed top-16 start-3 z-50"
          onClick={() => setSelectedPlace(null)}
        >
          <ArrowLeft />
          <span className="sr-only">{t("place.details.back", "Back")}</span>
        </Button>
      </div>

      <div className="w-full h-full flex flex-col items-stretch justify-center overflow-y-auto">
        <div className="w-full flex flex-col gap-2 py-2">
          <div className="relative w-full rounded-2xl overflow-hidden">
            {/* Hero image */}
            {business.photos?.[0] ? (
              <>
                <div className="absolute bottom-0 bg-gradient-to-t from-background to-transparent w-full h-1/4 aspect-video object-cover" />
                <img
                  src={getMediaUrl(business.photos[0])}
                  alt={business.name}
                  className="w-full rounded-2xl aspect-video object-cover"
                />
              </>
            ) : (
              <div className="mt-20" />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="flex-1 text-xl/6">{business.name}</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm/7 font-extralight text-muted-foreground">
                {getFriendlyCategoryName(business.cat, t)}
              </span>
            </div>

            <Separator />
          </div>

          {business.desc && (
            <div>
              <p className="text-sm/7 text-foreground/60 leading-snug">
                {business.desc}
              </p>
            </div>
          )}

          <ItemGroup className="flex flex-col !gap-0.5">
            <Item size="xs" variant="default">
              <ItemMedia variant="icon">
                <MapPin />
              </ItemMedia>
              <ItemContent>
                <ItemDescription className="break-words">
                  {business.address}
                </ItemDescription>
              </ItemContent>
            </Item>

            {business.website && (
              <Item size="xs" variant="default">
                <ItemMedia variant="icon">
                  <Globe />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription className="break-words">
                    <a
                      className="underline"
                      href={business.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {getDomain(business.website)}
                    </a>
                  </ItemDescription>
                </ItemContent>
              </Item>
            )}

            {business.openHours && (
              <Item size="xs" variant="default">
                <ItemMedia variant="icon">
                  <Clock9 />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription className="break-words">{business.openHours}</ItemDescription>
                </ItemContent>
              </Item>
            )}

            {business.social && (
              <Item size="xs" variant="default">
                <ItemMedia variant="icon">
                  <BadgeCheck />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription className="break-all">
                    <span className="text-sm font-mono">{business.social}</span>
                  </ItemDescription>
                </ItemContent>
              </Item>
            )}

            {business.email && (
              <Item size="xs" variant="default">
                <ItemMedia variant="icon">
                  <BadgeCheck />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription className="break-all">
                    <a
                      className="underline"
                      href={`mailto:${business.email}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {business.email}
                    </a>
                  </ItemDescription>
                </ItemContent>
              </Item>
            )}
          </ItemGroup>
        </div>
      </div>
    </div>
  );
}
