import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { createColumnHelper } from "@tanstack/react-table";
import { PRICING_PLANS, type PricingPlan } from "@/components/pricing/pricingplans.config";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";
import { Breadcrumbs, type BreadcrumbConfig } from "@/components/BreadCrumbs";
import { DataTable } from "@/components/DataTable";
import { listSubscriptions, updateSubscription, type Subscription } from "@/lib/api/payments";
import type { DataTableFeatures } from "@/utils/data-table-features";
import { getPricingPlanInfo } from "@/utils/helpers";

const columnHelper = createColumnHelper<DataTableFeatures, Subscription>()

export function SubscriptionsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Subscription[]>([]);
  const breadcrumbConfig: BreadcrumbConfig = {
    "/admin": {
      label: t("admin.admin", "Administration"),
    },
    "/admin/subscriptions": {
      label: t("admin.subscriptions", "Subscriptions"),
    },
  }

  async function load() {
    try { setItems(await listSubscriptions()); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load subscriptions"); }
  }
  useEffect(() => { void load(); }, []);

  async function save(item: Subscription, plan: string, status: "active" | "canceled") {
    try { await updateSubscription(item.userId, plan, status); await load(); toast.success(t("admin.saved", "Subscription updated")); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update subscription"); }
  }

  const columns = columnHelper.columns([
    columnHelper.accessor("plan", {
      header: "Plan",
      cell: ({ row }) => {
        const { label, icon: Icon } = getPricingPlanInfo(row.original.plan);

        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {label}
          </div>
        )
      }
    }),
    columnHelper.accessor("userId", {
      header: "User",
      // cell: ({ row }) => {
      //   const userName = row.original.userId?.name;
      //   const userPhoto = row.original.userId?.imageUrl;
      //   return (
      //     <div className="flex items-center justify-start gap-1">
      //       <Avatar size="sm">
      //         <AvatarImage
      //           src={userPhoto || undefined}
      //           alt={userName || "Owner"}
      //         />

      //         <AvatarFallback
      //           className="text-xs"
      //         >
      //           {userName ? userName[0].toUpperCase() : "?"}
      //         </AvatarFallback>
      //       </Avatar>
      //       <span className="text-muted-foreground text-sm">
      //         {userName ? userName : t("admin.unknown_owner", "Unknown")}
      //       </span>
      //     </div>
      //   )
      // }
    }),
    columnHelper.accessor("email", {
      header: "Email",
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => {
        const item = row.original

        return (
          <div className="flex items-center justify-end gap-2">
            {item.status === "active" ? (
              <div className="flex items-center justify-center">
                <CheckIcon className="w-4 h-4" />

                <span className="text-sm text-sm px-2 py-1 text-muted-foreground">{t("subscriptions.active_subscription", "Active")}</span>
              </div>
            ) : item.status === "pending" ? (
              <Button
                variant="default"
                size="default"
                className="flex items-center justify-center"
                onClick={() => {
                  void save(
                    item,
                    item.plan,
                    "active"
                  )
                }}
              >
                <span>
                  {t("subscription.approve", "Approve")}
                </span>
              </Button>
            ) : item.status === "canceled" ? (
              <Button
                variant="default"
                size="default"
                className="flex items-center justify-center"
                onClick={() => {
                  void save(
                    item,
                    item.plan,
                    "active"
                  )
                }}
              >
                <span>
                  {t("subscription.reactivate", "Reactivate")}
                </span>
              </Button>
            ) : null
            }

            <select className="h-9 rounded-md border bg-background px-3 text-sm" defaultValue={item.plan} onChange={(event) => void save(item, event.target.value, item.status === "canceled" ? "active" : "active")} aria-label="Plan">
              {Object.keys(PRICING_PLANS).map((plan) => <option key={plan} value={plan}>{PRICING_PLANS[plan as PricingPlan].label}</option>)}
            </select>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost" size="icon-sm"
                    aria-label={t("more_actions", "More actions")}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <MoreVertical />
                    <span className="sr-only">Open actions</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant={
                    item.status === "canceled" ?
                      "default" : "destructive"
                  }
                  onClick={() => {
                    void save(
                      item,
                      item.status === "canceled" ? item.plan : "discover",
                      item.status === "canceled" ? "active" : "canceled"
                    )
                  }}
                >
                  {item.status === "canceled" ?
                    t("subscription.reactivate", "Reactivate") :
                    t("subscription.cancel", "Cancel")
                  }
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    }),
  ])

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <Breadcrumbs
        config={breadcrumbConfig}
      />
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-2xl md:text-xl font-semibold tracking-tight text-foreground/90">
          {t("admin.subscriptions", "Subscriptions")}
        </h1>

        <p className="text-sm text-muted-foreground">{t("admin.subscriptions_description", "Review and manage user plan access.")}</p>
      </div>

      {items.length === 0 ? (
        <Empty className="col-span-full border border-foreground/30 p-8 text-foreground/50 shadow-sm">
          <EmptyHeader>
            <EmptyDescription className="text-center text-sm text-foreground/50">
              {t("admin.no_subscriptions", "No paid subscriptions yet.")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="container mx-auto">
          <DataTable
            columns={columns}
            data={items}
            filterBy={"name"}
          />
        </div>
      )}
    </main>
  );
}
