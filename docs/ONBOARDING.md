# Merchant Codebase Onboarding Guide

Welcome to Merchant, a collectibles marketplace and analytics platform. This guide gives new contributors a quick tour of the repository structure, the major moving pieces, and ideas for where to dive deeper next.

## High-Level Architecture

Merchant is a TypeScript monorepo with three main packages:

- `client/` – React + Vite SPA that renders the product experience, using Tailwind CSS, shadcn/ui components, Wouter for routing, and TanStack Query for data fetching.
- `server/` – Express HTTP API with feature-oriented services, scheduled jobs, and database access via Drizzle ORM.
- `shared/` – Data contracts shared by the client and server, primarily the Drizzle schema and associated Zod validators.

Supporting files in the repo root cover build tooling (Vite, Tailwind, TypeScript configs) and seed assets for the datasets highlighted on the marketing pages.

## Frontend Overview (`client/`)

The SPA boots in `client/src/main.tsx`, mounts `App`, and wraps it in providers for TanStack Query, tooltips, and toast notifications. `App` itself wires up the global layout (header/footer) and the route map using Wouter. Key user-facing pages include the home dashboard, markets browser, analytics, watchlist, portfolio, data sources, and item detail views.【F:client/src/App.tsx†L1-L40】

Data fetching is centralized through `lib/queryClient.ts`, which defines a preconfigured `QueryClient` and a helper `getQueryFn` for consistent API access and credential handling. Most hooks and components rely on the query client’s defaults instead of rolling their own fetch logic.【F:client/src/lib/queryClient.ts†L1-L43】【F:client/src/lib/queryClient.ts†L45-L58】

UI components live under `client/src/components/`, split into layout primitives (header, footer), feature widgets (trending items, market stats, price alerts), and shadcn/ui wrappers. Pages in `client/src/pages/` compose these components, fetch data, and manage any local state (e.g., the home page hero, featured sections, and trending carousel).【F:client/src/pages/home.tsx†L1-L98】

## Backend Overview (`server/`)

`server/index.ts` instantiates the Express app, registers JSON middleware, and calls `registerRoutes` before attaching environment-aware Vite middleware (development) or static file serving (production). It also logs API requests with duration and responses to aid debugging. Finally, it listens on the `PORT` env variable (default 5000) and exposes both API and SPA from the same process.【F:server/index.ts†L1-L61】

`server/routes.ts` defines REST endpoints grouped by domain: categories, collectibles, market data, price history, candles, and analytics. Routes parse input with Zod schemas from `shared/`, call storage helpers, and return JSON payloads. The file is also responsible for instantiating long-lived services such as the resampling engine that aggregates raw ticks into OHLC candles.【F:server/routes.ts†L1-L108】【F:server/routes.ts†L110-L190】

Persistence is abstracted behind the `storage` module. `storage.ts` exports a `DatabaseStorage` class that implements high-level read/write operations for users, collectibles, median prices, watchlists, market stats, and analytics queries. These methods leverage Drizzle to compose SQL queries, enforce business rules, and expose focused entry points for other services and the API layer.【F:server/storage.ts†L1-L132】【F:server/storage.ts†L134-L220】

Domain-specific services live under `server/services/`. Notable examples include background scrapers (eBay sold listings), price aggregators, resampling utilities, and analytics helpers that work in tandem with `storage`. These services orchestrate tasks such as scraping marketplace data, deriving medians, and producing high-resolution candles.【F:server/services/marketplace-scraper.ts†L1-L105】【F:server/services/marketplace-scraper.ts†L107-L190】

## Shared Contracts (`shared/`)

`shared/schema.ts` houses the Drizzle ORM table definitions, relations, and Zod insert schemas shared between the client and server. Tables cover users, categories, collectibles, price history, price sources, median prices, watchlists, raw tick data, and OHLC candles. Because both sides import these types, you get end-to-end type safety across API handlers, storage calls, and UI components.【F:shared/schema.ts†L1-L160】【F:shared/schema.ts†L162-L240】

## Development Workflow

The steps below assume you have a computer where you can open a terminal (command-line) window:

- **Windows** – open *PowerShell* or *Windows Terminal*. Both are preinstalled in modern versions of Windows. You can launch them from the Start menu.
- **macOS** – open the built-in *Terminal* app (found via Spotlight search) or use *iTerm2* if you prefer.
- **Linux** – open your desktop environment’s terminal emulator (e.g., GNOME Terminal, Konsole).

All commands that follow are typed into that terminal window. If a command spans multiple lines in this document, type or paste the full block before pressing <kbd>Enter</kbd>.

1. **Install Node.js (which includes npm).**
   - Download the Long-Term Support (LTS) installer for your operating system from [nodejs.org](https://nodejs.org). Running the installer adds both the `node` and `npm` commands to your system.
   - Alternatively, developers often use version managers such as [nvm for macOS/Linux](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to install Node.js 18 or newer.
   - Verify the installation by running `node -v` and `npm -v`. You should see version numbers printed in the terminal.
2. **Install supporting tools.** Make sure Git is available (`git --version`). For database work you will also need PostgreSQL 14+; you can install it directly from [postgresql.org](https://www.postgresql.org/download/) or via package managers such as Homebrew (macOS) or Chocolatey (Windows). If you prefer Docker, a `postgres` container with port `5432` exposed works as well.
3. **Clone the repository and enter it.**
   ```bash
   git clone https://github.com/YOUR_USERNAME/merchant.git
   cd merchant
   ```
   Replace the URL with the location of your fork if you are contributing.
4. **Install project dependencies.** From the repository root (the same folder that contains `package.json`), run `npm install`. This downloads all JavaScript and TypeScript packages the monorepo relies on. If you receive an error about permissions on macOS or Linux, avoid running with `sudo`; instead ensure your Node installation owns the global npm cache or reinstall via a version manager.
5. **Configure environment variables.** Copy the example file to `.env` with `cp .env.example .env` (macOS/Linux) or `copy .env.example .env` (Windows PowerShell). Edit the new `.env` and provide a valid `DATABASE_URL`, e.g. `postgres://username:password@localhost:5432/merchant`.
6. **Create the database schema.** Run `npm run db:push`. This command uses Drizzle to connect to the database referenced by `DATABASE_URL` and create the required tables. If the command fails, double-check that PostgreSQL is running and that the URL matches your local credentials.
7. **Seed sample data (optional but recommended).** Execute one of the provided scripts to load demo collectibles:
   ```bash
   npx tsx server/simple-seed.ts        # general-purpose sample data
   npx tsx server/simple-vinyl-seed.ts  # vinyl-focused data set
   ```
   These scripts populate categories, collectibles, and pricing data so the UI has something to display immediately. `npx tsx` runs the TypeScript files directly without needing to compile them first.
8. **Start the development servers.** Use `npm run dev`. This concurrently starts the Express API (default port 5000) and the Vite dev server with hot module reloading. Keep this terminal window open; both servers will log useful information such as compilation status and API requests.
9. **Visit the app and APIs.** Open a browser to `http://localhost:5000` to see the SPA. API endpoints are available under `http://localhost:5000/api/...`. If you changed the `PORT` environment variable, replace `5000` with that value.
10. **Stop the servers when you are done.** Press <kbd>Ctrl</kbd>+<kbd>C</kbd> in the terminal running `npm run dev` to exit.

## Suggested Next Steps

- **Trace a request**: Start from a page component (e.g., `TrendingItems`) and follow its query key into the API route and down into `storage` to understand the full stack.
- **Review services**: Examine background jobs like the marketplace scraper and resampling service to see how real-time and historical price data enter the system.
- **Inspect schema changes**: When adding new data, update `shared/schema.ts`, run Drizzle migrations, and adjust both client and server typing.
- **Testing strategy**: Investigate existing test utilities (if any) or plan how to introduce unit/integration tests around services and React components.
- **Deployment considerations**: Check how the server decides between development and production Vite modes and ensure static asset builds are included in deployment pipelines.

Keep this guide handy as you orient yourself, and pair it with the inline TypeScript types and comments throughout the repository for more detail.
