import { useEffect, useMemo, useRef, useState } from "react";
import type { Feature, Point, GeoJsonProperties } from "geojson";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MapManager } from "../../core/MapManager";
import {
  getFeatureCollection,
} from "../../data/firestore/firestorePlaces";
import { getLocalizedCategory } from "../place-list/categoryTranslations";
import {
  getMainCategoryIcon,
  getMainCategoryColor
} from "../place-list/place-list-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from "@/components/ui/item";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
// import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner";
import type { CategoryConfig } from "@/types/config";

// —— types & helpers ——
type VenueFeature = Feature<Point, GeoJsonProperties>;
type LoadedVenue = VenueFeature & {
  zoneColor?: string;
  __catId?: string;
  __catLabel?: string;
  __zone?: string;
};

let allPlacesPromise: ReturnType<typeof getFeatureCollection> | null = null;

function loadAllPlaces() {
  if (!allPlacesPromise) {
    allPlacesPromise = getFeatureCollection().catch((error) => {
      allPlacesPromise = null;
      throw error;
    });
  }
  return allPlacesPromise;
}

function layerPrefixFor(catId: string): string {
  if (catId === "competition") return "comp-";
  if (catId === "training") return "train-";
  if (catId === "fan-zones") return "fanz-";
  if (catId === "hotels") return "hotel-";
  if (catId === "restaurants") return "rest-";
  if (catId === "artworks") return "artworks-";
  if (catId === "attraction") return "attraction-";
  if (catId === "castle") return "castle-";
  if (catId === "church") return "church-";
  if (catId === "gallery") return "gallery-";
  if (catId === "memorial") return "memorial-";
  if (catId === "monument") return "monument-";
  if (catId === "mosque") return "mosque-";
  if (catId === "museum") return "museum-";
  if (catId === "viewpoints") return "viewpoints-";
  if (catId === "zoo") return "zoo-";
  if (catId === "hospitals") return "hosp-";
  if (catId === "transport") return "trans-";
  if (catId === "police") return "pol-";
  if (catId === "bank") return "ban-";
  if (catId === "atm") return "atm-";
  if (catId === "firestation") return "fires-";
  if (catId === "embassy") return "embassy-";
  if (catId === "consulate") return "consulate-";
  if (catId === "airport") return "airport-";
  if (catId === "bus") return "bus-";
  if (catId === "ferry") return "ferry-";
  if (catId === "railway") return "railway-";
  return `${catId}-`;
}

function getCategoryLayerIds(catId: string, map: mapboxgl.Map): string[] {
  const prefix = layerPrefixFor(catId);
  const style = map.getStyle();
  const layers = style?.layers || [];
  return layers
    .filter((l) => l.id?.startsWith?.(prefix) && l.id.endsWith("-points"))
    .map((l) => l.id);
}

function openPopupForCategory(
  catId: string | undefined,
  lng: number,
  lat: number,
  map: mapboxgl.Map,
) {
  if (!catId) return;
  const layerIds = getCategoryLayerIds(catId, map);
  if (layerIds.length === 0) return;

  const pt = map.project([lng, lat]);
  const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
    { x: pt.x - 6, y: pt.y - 6 } as any,
    { x: pt.x + 6, y: pt.y + 6 } as any,
  ];

  const hits = map.queryRenderedFeatures(bbox, { layers: layerIds });
  if (hits.length > 0) {
    (map as any).fire("click", {
      point: pt,
      lngLat: { lng, lat },
    });
  }
}

// —— component ——
export function LocalPlacesTab({
  categories,
  query,
  onQueryChange,
}: {
  categories: CategoryConfig[];
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const { t } = useTranslation();
  const mapManager = MapManager.getInstance();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataLoadedRef = useRef(false);
  const [venues, setVenues] = useState<LoadedVenue[]>([]);

  // load once, first time this tab is shown
  useEffect(() => {
    if (dataLoadedRef.current) return;

    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      setError(null);
      const all: LoadedVenue[] = [];

      try {
        const { fc } = await loadAllPlaces();
        const features = (fc.features || []) as VenueFeature[];
        features.forEach((f) => {
          const categoryId = f.properties?.categoryId;
          const zone = f.properties?.zone;
          all.push({
            ...f,
            properties: { ...f.properties },
            __catId: typeof categoryId === "string" ? categoryId : undefined,
            __zone: typeof zone === "string" ? zone : undefined,
          });
        });

        if (!cancelled) {
          setVenues(all);
          dataLoadedRef.current = true;
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? t("local.error.loadPlaces"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [categories]);

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return venues;
    return venues.filter((v) => {
      const name =
        (v.properties?.Name as string) ||
        (v.properties?.title as string) ||
        (v.properties?.name as string) ||
        "";
      return (
        name.toLowerCase().includes(t) ||
        v.__zone?.toLowerCase().includes(t) ||
        v.__catId?.toLowerCase().includes(t)
      );
    });
  }, [query, venues]);

  const handleSelect = (v: LoadedVenue) => {
    const map = mapManager.getMap();
    if (!map) return;
    const [lng, lat] = v.geometry.coordinates;

    map.flyTo({ center: [lng, lat], zoom: 14, speed: 1.2 });
    const once = () => {
      openPopupForCategory(v.__catId, lng, lat, map);
      map.off("moveend", once);
    };
    map.on("moveend", once);
  };

  return (
    <div className="space-y-3">
      {/* Search input */}
      <Field className="py-2">
        <InputGroup className="flex items-center gap-2">
          <InputGroupAddon>
            <Search className="w-4 h-4 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("local.search.placeholder")}
            className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
            autoFocus
          />
          {/* 
          <InputGroupAddon align="inline-end">
            <Kbd>⌘K</Kbd>
          </InputGroupAddon>
          */}
        </InputGroup>
      </Field>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center gap-2 text-muted-foreground">
          <Spinner />
          <span>{t("local.loading")}</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyDescription className="text-sm text-muted-foreground">
            {t("local.noMatches")}
          </EmptyDescription>
        </Empty>
      ) : (
        <ItemGroup className="max-h-[60vh] overflow-y-auto">
          {filtered.map((v, index) => {
            const name =
              (v.properties?.Name as string) ||
              (v.properties?.title as string) ||
              (v.properties?.name as string) ||
              t("local.untitled");
            const mainCategory = v.properties?.mainCategoryId as string | undefined;
            const Icon = getMainCategoryIcon(mainCategory);
            const color = getMainCategoryColor(mainCategory);
            return (
              <Item key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSelect(v)}
                className="hover:bg-primary/10 transition cursor-pointer"
              >
                <ItemMedia variant="icon">
                  <Icon style={{ color: color }} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{name}</ItemTitle>
                  <ItemDescription >
                    {getLocalizedCategory(v.__catId as any, t)}
                  </ItemDescription>
                </ItemContent>
                <ItemContent>
                  <ItemDescription >
                    {v.__zone || ""}
                  </ItemDescription>
                </ItemContent>
                {v.properties?.imageUrl && (
                  <ItemMedia variant="image">
                    <img
                      src={
                        (v.properties?.imageUrl as string) ||
                        undefined
                      }
                      alt={name}
                    />
                  </ItemMedia>
                )}
              </Item>
            );
          })}
        </ItemGroup>
      )}
    </div>
  );
}
