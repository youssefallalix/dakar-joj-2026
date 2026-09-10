// src/components/Sidebar.tsx
import { AnimatedButton } from "./buttons/AnimatedButton";
import { PlacesList } from "./place-list/PlacesList";
import { SearchPlaces } from "./search/SearchPlacesModal";
import { BaseMapSwitcher } from "../core/BasemapSwitcherModal";
import { ZoomPill } from "../core/ZoomPill";
import { LocateMeButton } from "../core/LocateMeButton";
import { toast } from "sonner";
import { House, RouteOff, Share2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

type SidebarProps = {
  longitude: number;
  latitude: number;
  zoom: number;
  onReset: () => void;
  onClearRoute: () => void;
};

export function Sidebar({
  onReset,
  longitude,
  latitude,
  zoom,
  onClearRoute,
}: SidebarProps) {
  const { t } = useTranslation();

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("lng", longitude.toFixed(6));
      url.searchParams.set("lat", latitude.toFixed(6));
      url.searchParams.set("z", zoom.toFixed(2));

      const shareData: ShareData = {
        title: document.title || "Map",
        text: "Check out this map view",
        url: url.toString(),
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard?.writeText(shareData.url || url.toString());
        toast.success("Link copied to clipboard");
      }
    } catch (err) {
      console.error("Share failed:", err);
      try {
        await navigator.clipboard?.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      } catch {
        prompt("Copy this link:", window.location.href);
      }
    }
  };

  return (
    // Position: right side; centered on desktop, bottom-right on mobile
    <div
      className="
      pointer-events-none
      absolute right-3 top-1/2 -translate-y-1/2
      md:right-4 md:top-1/2 md:-translate-y-1/2
      sm:bottom-3 sm:top-auto sm:-translate-y-0
      z-50
    "
    >
      {/* Glass Dock */}
      <div
        className="
        pointer-events-auto
        flex flex-col items-center gap-1
      "
      >
        {/* Top group */}
        <BaseMapSwitcher />
        {/* Utility group */}
        <PlacesList /> {/* keeps its own popover; button fits the dock */}
        {/* thin divider */}
        <Separator className="h-px w-9 bg-gradient-to-r from-transparent via-black/10 to-transparent my-1" />
        <SearchPlaces />
        {/* Zoom */}
        <ZoomPill />
        <LocateMeButton />
        <AnimatedButton
          icon={House}
          title={t("actions.resetview", "Reset View")}
          tooltip={t("actions.resetview", "Reset View")}
          onClick={onReset}
        />
        {/* thin divider */}
        <Separator className="h-px w-9 bg-gradient-to-r from-transparent via-black/10 to-transparent my-1" />
        {/* Bottom group */}
        <AnimatedButton
          icon={RouteOff}
          title={t("actions.clearroute", "Clear Route")}
          tooltip={t("actions.clearroute", "Clear Route")}
          onClick={onClearRoute}
        />
        <AnimatedButton
          icon={Share2}
          title={t("actions.share", "Share Map")}
          tooltip={t("actions.share", "Share Map")}
          onClick={handleShare}
        />
      </div>
    </div>
  );
}
