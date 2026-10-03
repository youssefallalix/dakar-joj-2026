import { OpenAPIHono, z } from "@hono/zod-openapi";
import { attachSessionUser, requireAdmin, requireAuth } from "../../middleware/auth.js";
import { fail } from "../../http/response.js";
import { cancelSubscription, confirmCheckout, createCheckout, getSubscription, listSubscriptions, updateSubscription } from "./payments.service.js";

export const paymentsRoutes = new OpenAPIHono();
paymentsRoutes.use("*", attachSessionUser);

paymentsRoutes.post("/callback", async (c) => {
  const queryToken = c.req.query("token");
  const body = await c.req.parseBody().catch(() => ({}));
  const bodyToken = (body as Record<string, unknown>).token;
  const token = queryToken ?? (typeof bodyToken === "string" ? bodyToken : null);
  if (!token) return fail(c, 400, "INVALID_CALLBACK", "A PayDunya invoice token is required");
  await confirmCheckout(token);
  return c.json({ success: true, data: { received: true } });
});

paymentsRoutes.get("/me", async (c) => {
  const denied = requireAuth(c);
  if (denied) return denied;
  const user = c.get("user");
  return c.json({ success: true, data: await getSubscription(user!.uid) });
});

paymentsRoutes.post("/confirm", async (c) => {
  const denied = requireAuth(c);
  if (denied) return denied;
  const parsed = z.object({ token: z.string().min(1) }).safeParse(await c.req.json());
  if (!parsed.success) return fail(c, 400, "INVALID_REQUEST", "A payment token is required");
  const user = c.get("user");
  return c.json({ success: true, data: await confirmCheckout(parsed.data.token, user!.uid) });
});

paymentsRoutes.post("/checkout", async (c) => {
  const denied = requireAuth(c);
  if (denied) return denied;
  const parsed = z.object({ plan: z.string() }).safeParse(await c.req.json());
  if (!parsed.success) return fail(c, 400, "INVALID_REQUEST", "A plan is required");
  const user = c.get("user");
  return c.json({ success: true, data: await createCheckout(user!, parsed.data.plan) }, 201);
});

paymentsRoutes.post("/cancel", async (c) => {
  const denied = requireAuth(c);
  if (denied) return denied;
  const user = c.get("user");
  return c.json({ success: true, data: await cancelSubscription(user!.uid) });
});

paymentsRoutes.get("/admin", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  return c.json({ success: true, data: await listSubscriptions() });
});

paymentsRoutes.patch("/admin/:userId", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const parsed = z.object({ plan: z.string(), status: z.enum(["active", "canceled"]) }).safeParse(await c.req.json());
  if (!parsed.success) return fail(c, 400, "INVALID_REQUEST", "Plan and status are required");
  return c.json({ success: true, data: await updateSubscription(c.req.param("userId"), parsed.data.plan, parsed.data.status) });
});