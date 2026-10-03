import "dotenv/config";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono, z } from "@hono/zod-openapi";
import { env } from "./config/env.js";
import { authRoutes } from "./features/auth/auth.routes.js";
import { zonesRoutes } from "./features/zones/zones.routes.js";
import { placesRoutes } from "./features/places/places.routes.js";
import { newsRoutes } from "./features/news/news.routes.js";
import { torchRoutes } from "./features/torch/torch.routes.js";
import { listingRoutes } from "./features/business_listings/listings.routes.js";
import { metadataRoutes } from "./features/metadata/metadata.routes.js";
import { uploadRoutes } from "./features/uploads/upload.routes.js";
import { itineraryRoutes } from "./features/itinerary/itinerary.routes.js";
import { eventRoutes } from "./features/events/events.routes.js";
import { paymentsRoutes } from "./features/payments/payments.routes.js";
import { attachSessionUser } from "./middleware/auth.js";
import { fail } from "./http/response.js";
import { HttpError } from "./http/errors.js";
import {
  placeSchema,
  placeImportSchema,
  placeInputSchema,
  newsSchema,
  eventSchema,
  torchStopSchema,
  sessionUserSchema,
  zoneSchema,
  businessListingSchema,
} from "../shared/contracts.js";

const app = new OpenAPIHono();

const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

const importResultsSchema = z.object({
  results: z.array(
    z.object({
      status: z.string(),
      id: z.string().optional(),
      reason: z.string().optional(),
    }),
  ),
});

const v2Routes = new OpenAPIHono();
v2Routes.use("*", attachSessionUser);
v2Routes.route("/zones", zonesRoutes);
v2Routes.route("/places", placesRoutes);
v2Routes.route("/torch", torchRoutes);
v2Routes.route("/events", eventRoutes);
v2Routes.route("/business/listings", listingRoutes);
v2Routes.route("/metadata", metadataRoutes);
v2Routes.route("/news", newsRoutes);
v2Routes.route("/uploads", uploadRoutes);
v2Routes.route("/payments", paymentsRoutes);

const itineraryCoordinateSchema = z
  .tuple([z.number(), z.number()])
  .openapi({
    example: [2.3488, 48.8534],
    description: "Longitude and latitude pair.",
  });

const itineraryRequestBodySchema = z
  .object({
    coordinates: z
      .array(itineraryCoordinateSchema)
      .min(2)
      .max(60)
      .openapi({
        description: "Pairs of [longitude, latitude] coordinates from origin to destination.",
        example: [
          [2.3488, 48.8534],
          [2.3321, 48.8361],
        ],
      }),
    profile: z
      .enum([
        "driving-car",
        "driving-hgv",
        "cycling-regular",
        "cycling-mountain",
        "cycling-road",
        "cycling-electric",
        "foot-walking",
        "foot-hiking",
        "wheelchair",
      ])
      .default("driving-car")
      .openapi({
        description: "ORS routing profile to use.",
        example: "driving-car",
      }),
    format: z.enum(["json", "geojson"]).default("json").openapi({
      description: "Response format expected from ORS.",
      example: "json",
    }),
  })
  .passthrough();

const loginSchema = z.object({
  email: z.string().email().openapi({
    example: "user@example.com",
    description: "User email address",
  }),
  password: z.string().min(1).openapi({
    example: "********",
    description: "User password",
  }),
});

const registerSchema = z.object({
  displayName: z.string().min(1).openapi({
    example: "John Doe",
  }),
  email: z.string().email().openapi({
    example: "user@example.com",
  }),
  password: z.string().min(8).openapi({
    example: "********",
  }),
});

const resetPasswordSchema = z.object({
  email: z.string().email().openapi({
    example: "user@example.com",
    description: "Email address associated with the account",
  }),
});

const scopeSchema = z.enum(["all", "zone", "root"]);

const zoneIdSchema = z.string().openapi({
  description: "Zone ID",
  example: "xxxxxxxxxxxxxxxxxxxx",
});

const categoryIdSchema = z.enum([
  "competition",
  "training",
  "hotels",
  "restaurants",
  "artworks",
  "hospitals",
  "transport",
  "police",
  "attraction",
  "castle",
  "church",
  "gallery",
  "memorial",
  "monument",
  "mosque",
  "museum",
  "viewpoints",
  "zoo",
  "bank",
  "atm",
  "firestation",
  "embassy",
  "consulate",
  "airport",
  "bus",
  "ferry",
  "railway",
]);

const mainCategoryIdSchema = z.enum([
  "housing",
  "food_and_drink",
  "mobility",
  "shopping_and_crafts",
  "culture_and_heritage",
  "health",
  "security",
  "services",
  "religion",
  "other",
]);

const clientDistDir = resolve(process.cwd(), "dist/client");
const shouldServeClient =
  env.NODE_ENV === "production" && existsSync(clientDistDir);

const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : ["http://localhost:5173"],
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  }),
);

app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  await next();
});

app.onError((err, c) => {
  if (err instanceof HttpError) {
    return fail(c, err.status, err.code, err.message, err.details);
  }

  console.error(err);
  return fail(c, 500, "INTERNAL_SERVER_ERROR", "Unexpected server error");
});

app.get("/api/v1/health", (c) => c.json({ success: true, data: { ok: true } }));

if (shouldServeClient) {
  app.get("*", async (c, next) => {
    if (c.req.path.startsWith("/api/")) {
      return next();
    }

    return serveStatic({ root: clientDistDir })(c, next);
  });

  app.notFound((c) => {
    if (c.req.path.startsWith("/api/")) {
      return fail(c, 404, "NOT_FOUND", "Route not found");
    }

    if (c.req.path.includes(".")) {
      return c.text("Not Found", 404);
    }

    return readFile(resolve(clientDistDir, "index.html"), "utf8").then((html) =>
      c.html(html),
    );
  });
} else {
  app.notFound((c) => fail(c, 404, "NOT_FOUND", "Route not found"));
}

app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v1/health",
  summary: "Health check",
  responses: {
    200: {
      description: "API health response",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.object({ ok: z.literal(true) })),
        },
      },
    },
  },
});

app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/zones", zonesRoutes);
app.route("/api/v1/places", placesRoutes);
app.route("/api/v1/uploads", uploadRoutes);
app.route("/api/v2", v2Routes);
app.route("/api/v2/itinerary", itineraryRoutes);

app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v2/itinerary",
  summary: "Get an itinerary proxied to OpenRouteService",
  security: [],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: itineraryRequestBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Route result returned by ORS",
      content: {
        "application/json": {
          schema: z.any(),
        },
      },
    },
    400: {
      description: "Invalid itinerary payload",
      content: { "application/json": { schema: apiErrorSchema } },
    },
    429: {
      description: "ORS quota exceeded for the current window",
      content: { "application/json": { schema: apiErrorSchema } },
    },
    500: {
      description: "ORS proxy error",
      content: { "application/json": { schema: apiErrorSchema } },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v2/news",
  summary: "List published news (v2)",
  security: [],
  request: {
    query: z.object({
      status: z.string().optional().openapi({
        description: "Optional status filter, for example published",
        example: "published",
      }),
      limit: z.coerce.number().int().min(1).max(250).optional().openapi({
        description: "Maximum number of items to return",
        example: 20,
      }),
    }),
  },
  responses: {
    200: {
      description: "News list",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.array(newsSchema)),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v2/news/{id}",
  summary: "Get a news item (v2)",
  security: [],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: { description: "News item", content: { "application/json": { schema: apiSuccessSchema(newsSchema) } } },
    404: { description: "News item not found", content: { "application/json": { schema: apiErrorSchema } } },
  },
});

app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v2/events",
  summary: "List events (v2)",
  security: [],
  request: {
    query: z.object({
      status: z.string().optional().openapi({
        description: "Optional status filter, for example published",
        example: "published",
      }),
      limit: z.coerce.number().int().min(1).max(250).optional().openapi({
        description: "Maximum number of items to return",
        example: 20,
      }),
    }),
  },
  responses: {
    200: {
      description: "Events list",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.array(eventSchema)),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v2/events/{id}",
  summary: "Get an event (v2)",
  security: [],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: { description: "Event", content: { "application/json": { schema: apiSuccessSchema(eventSchema) } } },
    404: { description: "Event not found", content: { "application/json": { schema: apiErrorSchema } } },
  },
});

// Create Event
app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v2/events",
  summary: "Create event",
  security: [{ apiKeyAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: eventSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Created event",
      content: {
        "application/json": {
          schema: apiSuccessSchema(eventSchema),
        },
      },
    },
  },
});

// Update Event
app.openAPIRegistry.registerPath({
  method: "patch",
  path: "/api/v2/events/{id}",
  summary: "Update event",
  security: [{ apiKeyAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        description: "Event ID",
        example: "xxxxxxxxxxxxxxxxxxxx",
      }),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: eventSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated event",
      content: {
        "application/json": {
          schema: apiSuccessSchema(eventSchema),
        },
      },
    },
  },
});

// Delete Event
app.openAPIRegistry.registerPath({
  method: "delete",
  path: "/api/v2/events/{id}",
  summary: "Delete event",
  security: [{ apiKeyAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Deletion confirmation",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.object({ deleted: z.literal(true) })),
        },
      },
    },
  },
});


app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v2/torch",
  summary: "List all torch stops",
  responses: {
    200: {
      description: "Array of torch stops",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.array(torchStopSchema)),
        },
      },
    },
  },
});

// Get Torch Stop
app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v2/torch/{id}",
  summary: "Get a torch stop by ID",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: { description: "Torch stop", content: { "application/json": { schema: apiSuccessSchema(torchStopSchema) } } },
    404: { description: "Torch stop not found", content: { "application/json": { schema: apiErrorSchema } } },
  },
});

// Create Torch Stop
app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v2/torch",
  summary: "Create torch stop",
  security: [{ apiKeyAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: torchStopSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Created torch stop",
      content: {
        "application/json": {
          schema: apiSuccessSchema(torchStopSchema),
        },
      },
    },
  },
});

// Update Torch Stop
app.openAPIRegistry.registerPath({
  method: "patch",
  path: "/api/v2/torch/{id}",
  summary: "Update torch stop",
  security: [{ apiKeyAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        description: "Torch stop ID",
        example: "xxxxxxxxxxxxxxxxxxxx",
      }),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: torchStopSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated torch stop",
      content: {
        "application/json": {
          schema: apiSuccessSchema(torchStopSchema),
        },
      },
    },
  },
});

// Delete Torch Stop
app.openAPIRegistry.registerPath({
  method: "delete",
  path: "/api/v2/torch/{id}",
  summary: "Delete torch stop",
  security: [{ apiKeyAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Deletion confirmation",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.object({ deleted: z.literal(true) })),
        },
      },
    },
  },
});

// Get All listings
app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v2/business/listings",
  summary: "List all business listings",
  security: [{ apiKeyAuth: [] }],
  responses: {
    200: {
      description: "Array of business listings",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.array(businessListingSchema)),
        },
      },
    },
  },
});

// Get Business Listing
app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v2/business/listings/{id}",
  summary: "Get a business listing by ID",
  security: [{ apiKeyAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: { description: "Business listing", content: { "application/json": { schema: apiSuccessSchema(businessListingSchema) } } },
    404: { description: "Business listing not found", content: { "application/json": { schema: apiErrorSchema } } },
  },
});

// Create Business Listing
app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v2/business/listings",
  summary: "Create business listing",
  security: [{ apiKeyAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: businessListingSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Created business listing",
      content: {
        "application/json": {
          schema: apiSuccessSchema(businessListingSchema),
        },
      },
    },
  },
});

// Update Business Listing
app.openAPIRegistry.registerPath({
  method: "patch",
  path: "/api/v2/business/listings/{id}",
  summary: "Update business listing",
  security: [{ apiKeyAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        description: "Business listing ID",
        example: "xxxxxxxxxxxxxxxxxxxx",
      }),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: businessListingSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated business listing",
      content: {
        "application/json": {
          schema: apiSuccessSchema(businessListingSchema),
        },
      },
    },
  },
});

// Delete Business Listing
app.openAPIRegistry.registerPath({
  method: "delete",
  path: "/api/v2/business/listings/{id}",
  summary: "Delete business listing",
  security: [{ apiKeyAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Deletion confirmation",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.object({ deleted: z.literal(true) })),
        },
      },
    },
  },
});

// Verify Business Listing
app.openAPIRegistry.registerPath({
  method: "patch",
  path: "/api/v2/business/listings/{id}/verify",
  summary: "Set business listing verified status",
  security: [{ apiKeyAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({
        description: "Business listing ID",
        example: "xxxxxxxxxxxxxxxxxxxx",
      }),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            verified: z.boolean().openapi({
              description: "Verified status to set for the business listing",
              example: true,
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated business listing verification status",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.object({ verified: z.boolean() })),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v1/auth/me",
  summary: "Current session",
  responses: {
    200: {
      description: "Current authenticated session or null",
      content: {
        "application/json": {
          schema: apiSuccessSchema(sessionUserSchema.nullable()),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v1/auth/login",
  summary: "Login",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Authenticated user",
      content: {
        "application/json": {
          schema: apiSuccessSchema(sessionUserSchema),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v1/auth/register",
  summary: "Register",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Created user",
      content: {
        "application/json": {
          schema: apiSuccessSchema(sessionUserSchema),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v1/auth/logout",
  summary: "Logout",
  responses: {
    200: {
      description: "Logout confirmation",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.object({ success: z.literal(true) })),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v1/auth/reset-password",
  summary: "Reset password",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: resetPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password reset confirmation",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.object({ sent: z.literal(true) })),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v1/auth/verify",
  summary: "Verify session",
  responses: {
    200: {
      description: "Current authenticated session or null",
      content: {
        "application/json": {
          schema: apiSuccessSchema(sessionUserSchema.nullable()),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v1/zones",
  summary: "List zones",
  request: {
    query: z.object({
      categoryId: categoryIdSchema.nullable().optional().openapi({
        description: "Category ID",
        example: "competition",
      }),
    }),
  },
  responses: {
    200: {
      description: "Zones list",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.array(zoneSchema)),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v1/places",
  summary: "List places",
  request: {
    query: z.object({
      scope: scopeSchema.nullable().optional().openapi({
        description: "Place scope",
        example: "zone",
      }),
      zoneId: zoneIdSchema.nullable().optional().openapi({
        description: "Zone ID",
        example: "xxxxxxxxxxxxxxxxxxxx",
      }),
      categoryId: categoryIdSchema.optional().openapi({
        description: "Category ID",
        example: "competition",
      }),
      mainCategoryId: mainCategoryIdSchema.optional().openapi({
        description: "Main category ID filter",
        example: "housing",
      }),
    }),
  },
  responses: {
    200: {
      description: "Places list",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.array(placeSchema)),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v1/places/{id}",
  summary: "Get place",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Place details",
      content: {
        "application/json": {
          schema: apiSuccessSchema(placeSchema),
        },
      },
    },
    404: {
      description: "Place not found",
      content: {
        "application/json": {
          schema: apiErrorSchema,
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v1/places",
  summary: "Create place",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: placeInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Created place",
      content: {
        "application/json": {
          schema: apiSuccessSchema(placeSchema),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "patch",
  path: "/api/v1/places/{id}",
  summary: "Update place",
  request: {
    params: z.object({
      id: z.string().openapi({
        description: "Place ID",
        example: "xxxxxxxxxxxxxxxxxxxx",
      }),
    }),
    query: z.object({
      zoneId: z.string().nullable().optional().openapi({
        description: "Zone to associate with the place",
      }),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: placeInputSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated place",
      content: {
        "application/json": {
          schema: apiSuccessSchema(placeSchema),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "delete",
  path: "/api/v1/places/{id}",
  summary: "Delete place",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Deletion confirmation",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.object({ deleted: z.literal(true) })),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v1/places/{id}/duplicate",
  summary: "Duplicate place",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    201: {
      description: "Duplicated place",
      content: {
        "application/json": {
          schema: apiSuccessSchema(placeSchema),
        },
      },
    },
    404: {
      description: "Place not found",
      content: {
        "application/json": {
          schema: apiErrorSchema,
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v1/places/import",
  summary: "Import places",
  request: {
    body: {
      required: true,
      description: "Bulk import places",
      content: {
        "application/json": {
          schema: placeImportSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Import results",
      content: {
        "application/json": {
          schema: apiSuccessSchema(importResultsSchema),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v1/uploads/image",
  summary: "Upload image",
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z
              .instanceof(File)
              .openapi({
                type: "string",
                format: "binary",
                description: "Image file to upload",
              }),
            folder: z.string().describe("Destination folder"),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Uploaded image metadata",
      content: {
        "application/json": {
          schema: apiSuccessSchema(
            z.object({
              url: z.string().url(),
              path: z.string(),
              bucket: z.string(),
              production: z.boolean(),
            }),
          ),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "get",
  path: "/api/v2/places",
  summary: "List places (v2)",
  security: [],
  request: {
    query: z.object({
      categoryId: categoryIdSchema.optional(),
      mainCategoryId: mainCategoryIdSchema.optional(),
      zoneId: zoneIdSchema.nullable().optional(),
      scope: scopeSchema.nullable().optional(),
    }),
  },
  responses: {
    200: {
      description: "Places list",
      content: {
        "application/json": {
          schema: apiSuccessSchema(z.array(placeSchema)),
        },
      },
    },
  },
});

app.openAPIRegistry.registerPath({
  method: "post",
  path: "/api/v2/places",
  summary: "Create place (v2)",
  security: [{ apiKeyAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: placeInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Created place",
      content: {
        "application/json": {
          schema: apiSuccessSchema(placeSchema),
        },
      },
    },
    401: {
      description: "Authentication required",
      content: { "application/json": { schema: apiErrorSchema } },
    },
  },
});

app.openAPIRegistry.registerComponent("securitySchemes", "apiKeyAuth", {
  type: "apiKey",
  in: "header",
  name: "x-api-key",
});

const generateVersionedOpenApiDocument = (
  fullDocument: ReturnType<typeof app.getOpenAPIDocument>,
  prefix: string,
  version: string,
  title: string,
) => {
  const document = structuredClone(fullDocument ?? {});
  document.info = { ...(document.info ?? {}), title, version };
  const filteredPaths = Object.fromEntries(
    Object.entries(document.paths ?? {}).filter(([path]) => path.startsWith(prefix)),
  );
  document.paths = filteredPaths;

  const usedSecuritySchemes = new Set<string>();
  for (const route of Object.values(document.paths ?? {})) {
    for (const operation of Object.values(route as Record<string, unknown>)) {
      const security = (operation as { security?: Array<Record<string, string[]>> } | null)?.security;
      if (!Array.isArray(security)) continue;
      for (const requirement of security) {
        for (const schemeName of Object.keys(requirement ?? {})) {
          usedSecuritySchemes.add(schemeName);
        }
      }
    }
  }

  const securitySchemes = document.components?.securitySchemes ?? {};
  document.components = {
    ...(document.components ?? {}),
    securitySchemes: Object.fromEntries(
      Object.entries(securitySchemes).filter(([schemeName]) =>
        usedSecuritySchemes.has(schemeName),
      ),
    ),
  };

  if (Object.keys(document.components.securitySchemes ?? {}).length === 0) {
    delete document.components.securitySchemes;
  }
  if (document.components && Object.keys(document.components).length === 0) {
    delete document.components;
  }

  return document;
};

const fullOpenApiDocument = app.getOpenAPIDocument({
  openapi: "3.0.3",
  info: { title: "API Docs", version: "1.0.0" },
});

const v1OpenApiDocument = generateVersionedOpenApiDocument(
  fullOpenApiDocument,
  "/api/v1",
  "1.0.0",
  "API v1 Docs",
);
const v2OpenApiDocument = generateVersionedOpenApiDocument(
  fullOpenApiDocument,
  "/api/v2",
  "2.0.0",
  "API v2 Docs",
);

app.get("/api/v1/openapi.json", (c) => c.json(v1OpenApiDocument));
app.get("/api/v2/openapi.json", (c) => c.json(v2OpenApiDocument));
app.get("/docs/v1/openapi.json", (c) => c.json(v1OpenApiDocument));
app.get("/docs/v2/openapi.json", (c) => c.json(v2OpenApiDocument));

app.get("/api/v1/docs", swaggerUI({ url: "/api/v1/openapi.json" }));
app.get("/api/v2/docs", swaggerUI({ url: "/api/v2/openapi.json" }));
app.get("/docs/v1", swaggerUI({ url: "/docs/v1/openapi.json" }));
app.get("/docs/v2", swaggerUI({ url: "/docs/v2/openapi.json" }));

serve({ fetch: app.fetch, port: env.PORT });

console.log(`Hono API listening on http://localhost:${env.PORT}`);
