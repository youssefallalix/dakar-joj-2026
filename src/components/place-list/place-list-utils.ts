import type { CategoryConfig } from "@/types/config";
import { Car, Landmark, Cross, Siren, Store, Mosque, CircleEllipsis, ShoppingCart, House, Utensils, Trophy, Circle, type LucideIcon } from "lucide-react";

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "competition",
    label: "Competition Sites",
    sources: []
  },
  {
    id: "hotels",
    label: "Hotels",
    sources: []
  },
  {
    id: "restaurants",
    label: "Restaurants",
    sources: []
  },
  {
    id: "artworks",
    label: "Artworks",
    sources: []
  },
  {
    id: "hospitals",
    label: "Hospitals",
    sources: []
  },
  {
    id: "transport",
    label: "Transportation",
    sources: []
  },
  {
    id: "police",
    label: "Police",
    sources: []
  },
  {
    id: "attraction",
    label: "Attraction",
    sources: [],
    hint: "Attraction places will appear here soon.",
  },
  {
    id: "castle",
    label: "Castle",
    sources: [],
    hint: "Castle locations will be listed here.",
  },
  {
    id: "church",
    label: "Church",
    sources: [],
    hint: "Church locations will be listed here.",
  },
  {
    id: "gallery",
    label: "Gallery",
    sources: [],
    hint: "Gallery locations will be listed here.",
  },
  {
    id: "memorial",
    label: "Memorial",
    sources: [],
    hint: "Memorial locations will be listed here.",
  },
  {
    id: "monument",
    label: "Monument",
    sources: [],
    hint: "Monument locations will be listed here.",
  },
  {
    id: "mosque",
    label: "Mosque",
    sources: [],
    hint: "Mosque locations will be listed here.",
  },
  {
    id: "museum",
    label: "Museum",
    sources: [],
    hint: "Museum locations will be listed here.",
  },
  {
    id: "viewpoints",
    label: "Viewpoints",
    sources: [],
    hint: "Viewpoints locations will be listed here.",
  },
  {
    id: "zoo",
    label: "Zoo",
    sources: [],
    hint: "Zoo locations will be listed here.",
  },
  {
    id: "bank",
    label: "Bank",
    sources: [],
    hint: "Bank locations will be listed here.",
  },
  {
    id: "atm",
    label: "ATM",
    sources: [],
    hint: "ATM locations will be listed here.",
  },
  {
    id: "firestation",
    label: "Fire Station",
    sources: [],
    hint: "Fire station locations will be listed here.",
  },
  {
    id: "embassy",
    label: "Embassy",
    sources: [],
    hint: "Embassy locations will be listed here.",
  },
  {
    id: "consulate",
    label: "Consulate",
    sources: [],
    hint: "Consulate locations will be listed here.",
  },
  {
    id: "airport",
    label: "Airport",
    sources: [],
    hint: "Airport locations will be listed here.",
  },
  {
    id: "bus",
    label: "Bus Station",
    sources: [],
    hint: "Bus Station locations will be listed here.",
  },
  {
    id: "ferry",
    label: "Ferry",
    sources: [],
    hint: "Ferry locations will be listed here.",
  },
  {
    id: "railway",
    label: "Railway",
    sources: [],
    hint: "Railway locations will be listed here.",
  },
];

export const MAIN_CATEGORIES = [
  {
    id: "sports",
    label: "Sports",
    icon: Trophy,
    color: "#3b82f6",
    categories: ["competition"]
  },
  {
    id: "housing",
    icon: House,
    color: "#703bf6",
    label: "Housing",
    categories: ["hotels"]
  },
  {
    id: "food_and_drink",
    icon: Utensils,
    color: "#f65d3b",
    label: "Food & Drink",
    categories: ["restaurants"]
  },
  {
    id: "mobility",
    icon: Car,
    color: "#3b99f6",
    label: "Mobility",
    categories: ["transport", "airport", "bus", "ferry", "railway"]
  },
  {
    id: "shopping_and_crafts",
    icon: ShoppingCart,
    color: "#e63bf6",
    label: "Shopping & Crafts",
    categories: []
  },
  {
    id: "culture_and_heritage",
    icon: Landmark,
    color: "#f6bb3b",
    label: "Culture & Heritage",
    categories: ["artworks", "attraction", "castle", "gallery", "memorial", "monument", "museum", "viewpoints", "zoo"]
  },
  {
    id: "health",
    icon: Cross,
    color: "#f63b3b",
    label: "Health",
    categories: ["hospitals"]
  },
  {
    id: "security",
    icon: Siren,
    color: "#f63b3b",
    label: "Security",
    categories: ["police"]
  },
  {
    id: "services",
    icon: Store,
    color: "#3bf641",
    label: "Services",
    categories: ["bank", "atm", "firestation", "embassy", "consulate"]
  },
  {
    id: "religion",
    icon: Mosque,
    color: "#64f63b",
    label: "Religion",
    categories: ["church", "mosque"]
  },
  {
    id: "other",
    icon: CircleEllipsis,
    color: "#b23bf6",
    label: "Other",
    categories: ["other"]
  },
];

export const getMainCategoryIcon = (
  mainCategory: string | undefined
): LucideIcon => {
  return (
    MAIN_CATEGORIES.find((category) => category.id === mainCategory)?.icon ??
    Circle
  );
}

export const getMainCategoryColor = (
  mainCategory: string | undefined
): string => {
  return (
    MAIN_CATEGORIES.find((category) => category.id === mainCategory)?.color ??
    "#888"
  );
}
