# React + TypeScript + Vite + TW

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js

## Backend Environment

The Hono API runs in the same repo and expects these variables for MongoDB, auth, Firebase Storage, and route proxies:

- `MONGODB_CONNECTION_STRING` for the `default` MongoDB database
- `FIREBASE_PROJECT_ID`
- `FIREBASE_WEB_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET` if you use image uploads
- `CORS_ORIGIN` if your frontend host is not `http://localhost:5173`
- `ORS_API_KEY` for the OpenRouteService itinerary proxy
- `ORS_BASE_URL` (optional override, defaults to `https://api.openrouteservice.org`)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME` for direct business media uploads
- `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, and `PAYDUNYA_TOKEN` from your PayDunya application
- `PAYDUNYA_PUBLIC_KEY` (optional), `PAYDUNYA_MODE` (`test` or `live`), and `PAYDUNYA_STORE_NAME`
- `APP_BASE_URL` set to the public app URL; PayDunya must be configured to call `${APP_BASE_URL}/api/v2/payments/callback`

The payment flow is a one-time seasonal entitlement: PayDunya hosts the checkout, while this app stores the confirmed payment and subscription state in MongoDB. The user can cancel access from `/pricing`, and admins can manage subscriptions at `/admin/subscriptions`. Configure PayDunya callback delivery before switching `PAYDUNYA_MODE` to `live`.

The R2 bucket must allow browser `PUT` requests from every Vite origin. Configure this in the R2 bucket's **Settings → CORS policy** in Cloudflare; Hono's API CORS middleware cannot configure R2. For local development, use `http://localhost:5173` (include the exact scheme, host, and port). If you use a VS Code Dev Tunnel, add its HTTPS origin too, for example `https://1zq2wjbn-5173.usw3.devtunnels.ms`:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://1zq2wjbn-5173.usw3.devtunnels.ms"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Add the deployed Vite origin(s) to `AllowedOrigins` before production, and set `CORS_ORIGIN` to the same API origins (comma-separated). The presigned URL returned by `/api/v2/uploads/presign` is an upload-only URL: use it once with `fetch(..., { method: "PUT", body: file })`; do not open it with `GET` or use it as an image/video `src`. The API currently persists the returned object path, so a separate public/custom-domain read URL is required when rendering stored media.

Without the MongoDB connection string, data routes return a structured `503 DATABASE_NOT_CONFIGURED` response. Firebase credentials are still required for the current authentication and upload routes.

## Itinerary proxy API

The server exposes a v2 itinerary endpoint that proxies requests to OpenRouteService while enforcing quota-safe behavior:

- `POST /api/v2/itinerary`
- Body follows the ORS routing format, for example:

```json
{
  "coordinates": [
    [2.3488, 48.8534],
    [2.3321, 48.8361]
  ],
  "profile": "driving-car"
}
```

The proxy will:

- validate the request shape and coordinate count
- cache repeated equivalent searches for five minutes
- enforce a local per-minute quota before calling ORS
- return a structured API error when the ORS key is missing, the quota is reached, or the upstream request fails

This endpoint is documented in the generated OpenAPI specs under `/api/v2/docs` and `/docs/v2`.

import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
