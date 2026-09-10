// src/components/search/GlobalPlacesTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { MapManager } from "../../core/MapManager";
import { X, SearchIcon, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { Field, FieldDescription } from "@/components/ui/field";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "../ui/alert";

type Feature = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  category?: string;
  address?: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
};

export function GlobalPlacesTab({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const [results, setResults] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const placeholder = t("search.placeholder.global");
  const tipText = t("search.tip.global");

  const mgr = MapManager.getInstance();
  const map = mgr.getMap();
  const proximity = useMemo(() => {
    const c = map?.getCenter();

    if (!c) return undefined;

    return {
      lat: c.lat,
      lon: c.lng,
    };
  }, [map]);

  // Debounced search against Geocoding API
  useEffect(() => {
    if (!query?.trim()) {
      setResults([]);
      setErr(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErr(null);

    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const url = new URL(
          "https://nominatim.openstreetmap.org/search",
        );

        url.searchParams.set("q", query.trim());
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("limit", "8");
        url.searchParams.set("accept-language", i18n.language || "en",);
        url.searchParams.set("addressdetails", "1");

        if (proximity) {
          const delta = 1.0;
          const left = proximity.lon - delta;
          const right = proximity.lon + delta;
          const top = proximity.lat + delta;
          const bottom = proximity.lat - delta;

          url.searchParams.set(
            "viewbox",
            `${left},${top},${right},${bottom}`,
          );

          // Don't strictly restrict results to the viewbox.
          url.searchParams.set("bounded", "0");
        }

        const res = await fetch(url.toString(), {
          signal: ctrl.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setResults(data || []);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setErr("Unable to search right now.");
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => {
      clearTimeout(handle);
      abortRef.current?.abort();
    };
  }, [query, proximity]);

  const handleZoomTo = (f: Feature) => {
    const center: [number, number] = [
      Number(f.lon),
      Number(f.lat),
    ];

    const m = map || mgr.getMap();
    if (center && m) {
      m.flyTo({ center, zoom: 14, speed: 1.2 });
    }
  };

  return (
    <div className="space-y-3">
      {/* Input */}
      <Field className="py-2">
        <InputGroup className="flex items-center gap-2">
          <InputGroupAddon>
            <SearchIcon className="w-4 h-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => onQueryChange(e.currentTarget.value)}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            autoFocus
          />
          {!!query && (
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              onClick={() => onQueryChange("")}
              aria-label="Clear"
            >
              <X />
            </InputGroupButton>
          )}
        </InputGroup>
        {!query && (
          <FieldDescription>
            {tipText}
          </FieldDescription>
        )}
      </Field>

      {/* Results (inside modal) */}
      <div className="rounded-xl overflow-hidden">
        <div className="max-h-72 overflow-auto space-y-4 rounded-xl">
          {/* States */}

          {query && loading && (
            <div className="flex justify-center items-center gap-2 text-muted-foreground">
              <Spinner />
              <span className="text-sm">Searching…</span>
            </div>
          )}

          {query && !loading && err && (
            <Alert variant="destructive">
              <AlertDescription>
                {err}
              </AlertDescription>
            </Alert>
          )}

          {query && !loading && !err && results.length === 0 && (
            <Empty>
              <EmptyDescription className="text-sm text-muted-foreground">
                No results.
              </EmptyDescription>
            </Empty>
          )}
          {results.length > 0 && !loading && (
            <div className="space-y-1">
              {/* List */}
              {results.map((f) => (
                <Item
                  key={f.place_id}
                  variant="default"
                  size="xs"
                  onClick={() => handleZoomTo(f)}
                  className="w-full hover:bg-background/50 cursor-pointer"
                >
                  <ItemMedia className="h-9 w-9 bg-muted-background">
                    <MapPin />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="text-sm font-medium truncate">
                      {f.display_name.split(",")[0]}
                    </ItemTitle>
                    <ItemDescription className="text-xs line-clamp-2">
                      {f.display_name}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </div>
          )}
        </div>

        {/* Attribution */}
        <div className="px-3 py-2 text-xs text-muted-foreground text-end">
          © OpenStreetMap contributors
        </div>
      </div>
    </div>
  );
}
