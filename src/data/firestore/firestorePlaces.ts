import type {
  Feature,
  FeatureCollection,
  Point,
  GeoJsonProperties,
} from "geojson";
import { listPlaces, listZones } from "../../lib/api/places";

export type SiteConfig = { name: string; file: string; color: string };

// Zones list for a category (used by PlacesList + generic category layers)
export async function getZonesForCategory(
  categoryId: string,
): Promise<SiteConfig[]> {
  const zones = await listZones(categoryId);
  return zones.map((data) => {
    return {
      name: data.name || "Unnamed Zone",
      file: `firestore://${data.id}`,
      color: data.color || "#3b82f6",
    };
  });
}

function toLatLng(p: any) {
  const lat =
    p?.location?.latitude ??
    p?.location?._lat ??
    p?.location?.lat ??
    p?.lat ??
    null;
  const lng =
    p?.location?.longitude ??
    p?.location?._long ??
    p?.location?.lng ??
    p?.lng ??
    null;
  return { lat, lng };
}

// Normalize & enrich Firestore place document into GeoJSON properties
function buildProps(
  p: any,
  zoneName: string,
  zoneId: string | null,
): GeoJsonProperties {
  return {
    // Map card basics
    id: p.id || null,
    title: p.name ?? "Untitled",
    title_fr: p.name_fr ?? p.nameFr ?? null,
    Name: p.name ?? "Untitled", // legacy compatibility (PlacesList uses `Name`)
    name_fr: p.name_fr ?? p.nameFr ?? null,
    address: p.address ?? null,
    info: p.info ?? null,
    info_fr: p.info_fr ?? p.infoFr ?? null,
    rating: p.rating ?? null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    pointColor: p.pointColor ?? "#2962FF",
    imageUrl: p.imageUrl ?? null,

    // Event/branding fields (used by EventVenueCard)
    brandTitle: p.brandTitle ?? null,
    brandSubtitle: p.brandSubtitle ?? null,
    locationLabel: p.locationLabel ?? null,
    shortCode: p.shortCode ?? null,
    gradientFrom: p.gradientFrom ?? "#12B76A",
    gradientTo: p.gradientTo ?? "#0A6B4A",
    website: p.website ?? null,
    socialHandle: p.socialHandle ?? null,

    // Sports (crucial for competition popup)
    sportCount: Number(
      p.sportCount ?? (Array.isArray(p.sports) ? p.sports.length : 0),
    ),
    sports: Array.isArray(p.sports) ? p.sports : [],

    // Category/zone identifiers
    categoryId: p.categoryId ?? null,
    zoneId: zoneId,
    zone: zoneName || "Unassigned",
  };
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Load all places under a specific zone (/zones/{zoneId}/places) as a FeatureCollection
 */
export async function getZoneFeatureCollection(zoneId: string) {
  const places = await listPlaces({ zoneId, scope: "zone" });
  const color = "#3b82f6";
  const features = places
    .map((p) => {
      const { lat, lng } = toLatLng(p);
      if (typeof lat !== "number" || typeof lng !== "number") return null;

      const tags = parseStringArray(p.tags);
      const gradient =
        p.gradientFrom && p.gradientTo
          ? [String(p.gradientFrom), String(p.gradientTo)]
          : undefined;

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat] as [number, number],
        },
        properties: {
          ...p,
          tags, // ✅ normalized
          gradient, // ✅ array form
          Name: p.name,
          zone: p.zone || zoneId,
        },
      } as GeoJSON.Feature;
    })
    .filter(Boolean) as GeoJSON.Feature[];

  return { color, fc: { type: "FeatureCollection", features } as const };
}

export async function getFeatureCollection() {
  const places = await listPlaces({ scope: "all" });
  const color = "#3b82f6";
  const features = places
    .map((p) => {
      const { lat, lng } = toLatLng(p);
      if (typeof lat !== "number" || typeof lng !== "number") return null;

      const tags = parseStringArray(p.tags);
      const gradient =
        p.gradientFrom && p.gradientTo
          ? [String(p.gradientFrom), String(p.gradientTo)]
          : undefined;

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat] as [number, number],
        },
        properties: {
          ...p,
          tags, // ✅ normalized
          gradient, // ✅ array form
          Name: p.name,
          zone: p.zone,
        },
      } as GeoJSON.Feature;
    })
    .filter(Boolean) as GeoJSON.Feature[];

  return { color, fc: { type: "FeatureCollection", features } as const };
}

export async function getMainCategoryFeatureCollection(mainCategoryId: string) {
  const places = await listPlaces({ mainCategoryId, scope: "all" });
  const features: Feature<Point, GeoJsonProperties>[] = places
    .map((raw) => {
      const { lat, lng } = toLatLng(raw);
      if (typeof lat !== "number" || typeof lng !== "number") return null;
      const props = buildProps(
        { ...raw, id: raw.id },
        raw.zone || raw.zoneId || "Unassigned",
        raw.zoneId ?? null,
      );
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: props,
      } as Feature<Point, GeoJsonProperties>;
    })
    .filter(Boolean) as Feature<Point, GeoJsonProperties>[];

  return {
    color: "#3b82f6",
    fc: { type: "FeatureCollection", features },
  };
}

/**
 * Load all unzoned places from top-level /places for a category
 * (categoryId == X and zoneId == null)
 */
export async function getUnassignedFeatureCollection(
  categoryId: string,
): Promise<{
  color: string;
  fc: FeatureCollection<Point, GeoJsonProperties>;
}> {
  const places = await listPlaces({ categoryId, scope: "root" });
  const features: Feature<Point, GeoJsonProperties>[] = places
    .map((raw) => {
      const { lat, lng } = toLatLng(raw);
      if (typeof lat !== "number" || typeof lng !== "number") return null;
      const zoneLabel = raw?.zone || "Unassigned";
      const props = buildProps({ ...raw, id: raw.id }, zoneLabel, null);
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: props,
      } as Feature<Point, GeoJsonProperties>;
    })
    .filter(Boolean) as Feature<Point, GeoJsonProperties>[];

  // neutral color for unassigned collections
  return {
    color: "#64748b",
    fc: { type: "FeatureCollection", features },
  };
}
