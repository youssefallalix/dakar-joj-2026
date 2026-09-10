import { useState } from "react";
import { GlobalPlacesTab } from "./GlobalPlacesTab";
import { LocalPlacesTab } from "./LocalPlacesTab";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AnimatedButton } from "../buttons/AnimatedButton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import { SidePanel } from "../side-panel/core";
import { usePanelContext } from "@/components/panel-provider";
import { useModalContext } from "@/components/modal-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStateContext } from "@/components/state-provider";
import { CATEGORIES } from "../place-list/place-list-utils";

export const SearchPlaces = () => {
  const { t } = useTranslation();

  const {
    activeTab,
    setActiveTab,
  } = useStateContext();

  const {
    isOpen: panelOpen,
    setIsOpen: setPanelOpen,
    setPanelContent: setPanelContent,
  } = usePanelContext();

  const isMobile = useIsMobile();
  const {
    isOpen: modalOpen,
    setIsOpen: setModalOpen,
    setModalContent,
  } = useModalContext();

  const openPanel = () => {
    if (!isMobile && panelOpen && activeTab === "search") {
      setPanelOpen(false);
      return;
    }
    if (isMobile && modalOpen && activeTab === "search") {
      setModalOpen(false);
      return;
    }

    setActiveTab("search");
    setActiveTab("search");
    if (isMobile) {
      setModalContent({
        title: null,
        onClose: () => setModalOpen(false),
        size: "lg",
        children: <SidePanel />,
      });
      setModalOpen(true);
    } else {
      setPanelContent({
        title: null,
        onClose: () => setPanelOpen(false),
        size: "lg",
        children: <SidePanel />,
      });
      setPanelOpen(true);
    }
  }

  return (
    <AnimatedButton
      icon={Search}
      title={t("actions.search", "Search Places")}
      tooltip={t("actions.search", "Search Places")}
      isOpen={panelOpen && activeTab === "search"}
      onClick={openPanel}
    />
  )
}

export const SearchPlacesModal = () => {
  // default = "Search Anywhere"
  const { t } = useTranslation();
  const categories = CATEGORIES;

  // keep per-tab state here so it survives open/close
  const [globalQuery, setGlobalQuery] = useState("");
  const [localQuery, setLocalQuery] = useState("");

  return (
    <Tabs defaultValue="global">
      <TabsList variant="default">
        <TabsTrigger value="global">{t("search.tab.global")}</TabsTrigger>
        <TabsTrigger value="local">{t("search.tab.local")}</TabsTrigger>
      </TabsList>
      {/* Body */}
      <TabsContent value="global">
        <GlobalPlacesTab
          query={globalQuery}
          onQueryChange={setGlobalQuery}
        />
      </TabsContent>
      <TabsContent value="local">
        <LocalPlacesTab
          categories={categories}
          query={localQuery}
          onQueryChange={setLocalQuery}
        />
      </TabsContent>
    </Tabs>
  );
}
