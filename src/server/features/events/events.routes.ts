import { Hono } from "hono";
import { ok, fail } from "../../http/response.js";
import {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  trackCalendarAddition,
  hasCalendarAddition,
} from "./events.service.js";
import { requireAdmin } from "../../middleware/auth.js";
import { eventSchema } from "../../../shared/contracts.js";

export const eventRoutes = new Hono();

eventRoutes.get("/", async (c) => {
  const user = c.get("user");
  const requestedStatus = c.req.query("status");

  const isAdmin = user?.role === "admin";

  const status = isAdmin
    ? requestedStatus === "all"
      ? undefined
      : requestedStatus
    : "published";

  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : undefined;

  const events = await listEvents({
    status,
    limit: Number.isFinite(limit) ? Math.max(1, Math.min(limit as number, 250)) : 100,
  });

  return ok(c, events);
});

eventRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const event = await getEventById(id);

  if (!event) {
    return fail(c, 404, "NOT_FOUND", "Event not found");
  }

  return ok(c, event);
});

eventRoutes.post("/", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const body = eventSchema.parse(await c.req.json());


  const event = await createEvent(body);

  return ok(c, event, 201);
});

eventRoutes.patch("/:id", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  const body = eventSchema.partial().parse(await c.req.json());
  const event = await updateEvent(c.req.param("id"), body);
  return ok(c, event);
});

eventRoutes.delete("/:id", async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  await deleteEvent(c.req.param("id"));
  return ok(c, { deleted: true });
});

eventRoutes.get("/:id/calendar", async (c) => {
  const user = c.get("user");

  if (!user) {
    return fail(c, 401, "UNAUTHORIZED", "Authentication required");
  }

  const eventId = c.req.param("id");

  const tracked = await hasCalendarAddition({
    userId: user.uid,
    eventId,
    provider: "google",
  });

  return ok(c, {
    tracked,
  });
});

eventRoutes.post("/:id/calendar", async (c) => {
  const user = c.get("user");

  if (!user) {
    return fail(c, 401, "UNAUTHORIZED", "Authentication required");
  }

  const eventId = c.req.param("id");

  const event = await getEventById(eventId);

  if (!event) {
    return fail(c, 404, "NOT_FOUND", "Event not found");
  }

  await trackCalendarAddition({
    userId: user.uid,
    eventId,
    provider: "google",
  });

  return ok(c, {
    tracked: true,
  });
});
