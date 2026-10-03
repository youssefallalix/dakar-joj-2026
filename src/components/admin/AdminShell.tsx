import { Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import { HeaderBar } from "@/components/header/HeaderBar";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"

export function AdminShell() {
  const { t } = useTranslation();
  return (
    <>
      <HeaderBar
        showLogo={false}
        backButton={
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  // className={navigationMenuTriggerStyle()}
                  render={<Link
                    to="/"
                    className="inline-flex items-center gap-2 py-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t("back_to_map", "Back to Map")}
                  </Link>}
                >
                  Places
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        }
        title={t("admin_panel", "Admin Panel")}
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link
                  to="/admin/subscriptions"
                  className="inline-flex items-center gap-2 py-2"
                />}
              >
                {t("admin.subscriptions", "Subscriptions")}
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                // className={navigationMenuTriggerStyle()}
                render={<Link
                  to="/admin/listings"
                  className="inline-flex items-center gap-2 py-2"
                />}
              >
                {t("business_listings", "Business Listongs")}
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                // className={navigationMenuTriggerStyle()}
                render={<Link
                  to="/admin/torch"
                  className="inline-flex items-center gap-2 py-2"
                />}
              >
                {t("torch_stops", "Torch Stops")}
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                // className={navigationMenuTriggerStyle()}
                render={<Link
                  to="/admin/events"
                  className="inline-flex items-center gap-2 py-2"
                />}
              >
                {t("events.events", "Events")}
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                // className={navigationMenuTriggerStyle()}
                render={<Link
                  to="/admin/places"
                  className="inline-flex items-center gap-2 py-2"
                />}
              >
                {t("places", "Places")}
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </HeaderBar>
      <div className="pt-12">
        <Outlet />
      </div>
    </>
  );
}
