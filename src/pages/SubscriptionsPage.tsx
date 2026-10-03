import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PRICING_PLANS, type PricingPlan } from "@/components/pricing/pricingplans.config";
import { listSubscriptions, updateSubscription, type Subscription } from "@/lib/api/payments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SubscriptionsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Subscription[]>([]);

  async function load() {
    try { setItems(await listSubscriptions()); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load subscriptions"); }
  }
  useEffect(() => { void load(); }, []);

  async function save(item: Subscription, plan: string, status: "active" | "canceled") {
    try { await updateSubscription(item.userId, plan, status); await load(); toast.success(t("admin.saved", "Subscription updated")); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update subscription"); }
  }

  return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
    <div><h1 className="text-2xl font-semibold">{t("admin.subscriptions", "Subscriptions")}</h1><p className="text-sm text-muted-foreground">{t("admin.subscriptions_description", "Review and manage user plan access.")}</p></div>
    {items.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{t("admin.no_subscriptions", "No paid subscriptions yet.")}</CardContent></Card> : <div className="grid gap-3">
      {items.map((item) => <Card key={item.userId}><CardHeader className="pb-3"><CardTitle className="text-base">{item.email ?? item.userId}</CardTitle><CardDescription>{item.userId}</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center gap-3">
        <select className="h-9 rounded-md border bg-background px-3 text-sm" defaultValue={item.plan} onChange={(event) => void save(item, event.target.value, item.status === "canceled" ? "active" : "active")} aria-label="Plan">
          {Object.keys(PRICING_PLANS).map((plan) => <option key={plan} value={plan}>{PRICING_PLANS[plan as PricingPlan].label}</option>)}
        </select>
        <span className="text-sm text-muted-foreground">{item.status}</span>
        <Button variant={item.status === "canceled" ? "default" : "destructive"} onClick={() => void save(item, item.status === "canceled" ? item.plan : "discover", item.status === "canceled" ? "active" : "canceled")}>
          {item.status === "canceled" ? t("admin.reactivate", "Reactivate") : t("admin.cancel", "Cancel")}
        </Button>
      </CardContent></Card>)}
    </div>}
  </main>;
}