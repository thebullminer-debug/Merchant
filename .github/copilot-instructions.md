## Repository overview

This repo implements a full-stack collectables market app (frontend + backend + DB). Key boundaries:
- client/: React + TypeScript + Vite SPA (entry: `client/src/main.tsx`, routes in `client/src/App.tsx`). Uses TanStack Query (`client/src/lib/queryClient.ts`) and shadcn UI components.
- server/: Express + TypeScript API and dev-server wrapper for Vite (entry: `server/index.ts`). Routes registered in `server/routes.ts`.
- shared/: Drizzle ORM schema and Zod insert schemas (`shared/schema.ts`) used by server and service layers.
- server/storage.ts: single DatabaseStorage implementing data access using Drizzle; prefer using its methods when adding or modifying data access logic.

## High-level architecture notes for code changes
- The Node process serves both API and client on the same port. In development Vite is mounted as middleware via `server/vite.ts` (see `setupVite`). In production static files are served from the build output directory (`serveStatic`).
- Database layer is centralized in `server/storage.ts` (class `DatabaseStorage` implementing `IStorage`). Many routes call storage methods directly — when adding new endpoints, extend `IStorage` and `DatabaseStorage` rather than scattering raw SQL.
- Schema and validation are defined in `shared/schema.ts` (Drizzle table definitions + Zod insert schemas). Use the Zod insert schemas (e.g., `insertCollectibleSchema`) for validating incoming request bodies — server routes already use them in `server/routes.ts`.
- Time-series and chart data flow: price ticks -> ticks table -> candles/median_prices via aggregation services. Look at `server/services/*` (e.g., `resamplingService`, `daily-price-service`, `candle-aggregator`) when touching price logic.

## Developer workflows (commands and expectations)
- Install and dev: npm install
- Run dev server (mounts Vite middleware and API together): npm run dev (runs `tsx server/index.ts`).
- Build: npm run build (builds client with Vite and bundles the server entry with esbuild). After build, run with: NODE_ENV=production node dist/index.js or npm run start.
- Typecheck: npm run check (runs tsc). Keep types clean; project uses ESM and "type": "module" in package.json.
- Database migrations/push: npm run db:push (uses drizzle-kit). Ensure DATABASE_URL is set in env.

## Patterns & conventions to follow
- Validation: use Zod insert schemas from `shared/schema.ts` inside routes (example: `insertCollectibleSchema.parse(req.body)` in `server/routes.ts`). Return 400 for Zod errors.
- DB access: use methods on `server/storage.ts` (IStorage). Avoid raw db queries in routes; add new storage methods if needed.
- Dates and timezones: server normalizes to UTC for time-range queries (see `/api/collectibles/:id/prices/resampled` logic). Be explicit about UTC when producing or comparing timestamps.
- API shape: most endpoints return JSON objects or arrays and use status codes consistently (400, 404, 500). Follow existing error handling pattern (routes use try/catch and return { message } on 500).
- Pagination: endpoints use limit/offset query params (e.g., `getCollectibles`). Use same pattern for new list endpoints.

## Integration points & external deps
- Database: PostgreSQL + Drizzle ORM; connection in `server/db.ts`. Use `drizzle-zod` schemas in `shared/schema.ts` for runtime validation.
- Scrapers and headless browsing: `server/services/*` include scrapers that use `puppeteer`. These are heavy; avoid running them in CI. When testing scraper changes, run locally with enough memory and disable HMR if needed.
- Sessions/auth: passport-local + express-session present in dependencies. Auth routes are not fully wired in current code; be cautious when adding auth-related logic — search for `passport` or `express-session` usage before changing session behavior.

## Files to inspect for common tasks (examples)
- Add a new API route: modify `server/routes.ts` and call a storage method from `server/storage.ts`. Validate body with Zod from `shared/schema.ts`.
- Add a DB table or column: update `shared/schema.ts`, create migration/push with `npm run db:push`, then update `server/storage.ts` to expose new methods.
- Frontend data fetching: use `queryClient` and `getQueryFn` in `client/src/lib/queryClient.ts`; supply endpoints that match `/api/...` paths used by the client (see pages in `client/src/pages/*`).

## Examples (copyable snippets)
- Server route validating body with Zod (existing pattern):

  const collectible = insertCollectibleSchema.parse(req.body);
  const newCollectible = await storage.createCollectible(collectible);

- Query client pattern (client side):

  const { data } = useQuery(["/api/collectibles", id], { /* uses getQueryFn */ });

## Quick diagnostics when things fail
- If server fails to start in dev: ensure PORT is set or default 5000, and that no other process is listening on that port. Check console logs — server prints API logs for /api routes in `server/index.ts`.
- If client build missing after production build: `server/vite.ts` expects `public` in server/dist; ensure `npm run build` completed without errors.
- DB connection errors: check `DATABASE_URL` and run `npm run db:push` to ensure schema is applied.

## What to avoid / gotchas
- Don't mount Vite middleware before registering routes — `server/index.ts` deliberately registers routes then calls setupVite. If you change server startup order you may accidentally shadow API routes.
- Heavy scraper or Puppeteer code can exhaust CI runners. Keep those tests and runs local or behind env flags.

If anything here is unclear or you'd like more examples (e.g., adding a new migration, or a sample new API + storage method), tell me which area and I'll expand or iterate.
