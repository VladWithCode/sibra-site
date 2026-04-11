# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sibra Site is a full-stack real estate platform. The Go backend serves a REST API, and the React frontend (currently being rebuilt on the `remake` branch) is a separate SPA that proxies API calls to the backend during development.

## Commands

### Backend (Go)
```bash
go run main.go                  # Run server (port 8080)
go build ./cmd/main.go          # Build binary
go test ./...                   # Run all tests
go test ./internal/<package>    # Run single package tests
```

### Frontend (React, in `frontend/`)
```bash
npm run dev     # Dev server on port 3000 (proxies /api and /static to backend)
npm run build   # Vite build + tsc type check
npm test        # Vitest
npm run format  # Prettier
```

### CSS (for Go templates in `web/`)
```bash
bunx @tailwindcss/cli -i web/style/styles.css -o web/static/styles.css
./scripts/css-watch.sh   # Watch mode
```

### Database migrations (Goose)
```bash
goose up    # Apply migrations (uses GOOSE_* env vars from .env)
```

## Architecture

### Backend (`internal/`)

Entry point: `main.go` → connects to PostgreSQL via `internal/db`, then registers routes.

| Package | Role |
|---------|------|
| `internal/routes` | HTTP handlers — `RegisterPropertyRoutes`, `RegisterProjectRoutes`, `RegisterUserRoutes`, `RegisterRequestsRouter`, `RegisterAdminRoutes`, `RegisterPriceMapRoutes` |
| `internal/auth` | JWT in HTTP-only `auth_token` cookie; `ValidateAuthMiddleware` and `WithAuthAccessLevelMiddleware` for role checks (user/editor/admin) |
| `internal/db` | pgxpool connection, all SQL queries |
| `internal/files` / `internal/uploads` | File upload/delete logic |
| `internal/wsp` | WhatsApp Business API notifications |
| `internal/templates` | Go `html/template` + `.templ` rendering (use `tpl.ToGoHTML()` for templ→template conversion) |

Route patterns use Go 1.22+ syntax: `"GET /{$}"`, `"POST /api/users"`. Authenticated handlers use the `AuthedHandler` pattern.

Static assets served from `web/static/`; SQL migrations in `sql/migrations/`.

### Frontend (`frontend/src/`)

File-based routing via TanStack Router (routes auto-generated into `routeTree.gen.ts` — do not edit manually).

```
routes/
├── __root.tsx              # Root layout, QueryClient, theme provider
├── _public/                # Public pages (home, listings, detail, projects, contact)
│   └── propiedades/
│       ├── _listing/       # Property search/browse
│       └── _detail/        # Single property view
├── panel/                  # Auth-gated dashboard (property/project/appointment CRUD)
└── conquistadores_/        # Dedicated landing for a specific project
```

Components live in `frontend/src/components/`:
- `ui/` — shadcn/ui wrappers over Radix UI primitives
- `layout/` — Header, Footer, Sidebar
- `properties/`, `projects/`, `dashboard/` — feature components

Data fetching uses TanStack Query. Global UI state (sidebar open/close, etc.) is in Zustand. Animations use GSAP + ScrollTrigger. Maps use `@vis.gl/react-google-maps`.

### Key conventions

- **Backend errors**: `fmt.Printf("err: %v\n", err)` pattern; always check returned errors.
- **DB access**: Acquire pool via `db.GetPool()`; pass `context.Background()` for DB ops.
- **Environment**: `.env` loaded with `godotenv.Overload(".env")`. Required vars: `DATABASE_URL`, `PORT`, `JWT_SECRET`, WhatsApp (`WSP_*`), Google Maps (`GOOGLE_MAPS_API_KEY`), Gmail (`GOOGLE_MAIL_*`), Goose (`GOOSE_*`).
- **Frontend path alias**: `@/*` maps to `frontend/src/*`.
- **Formatting**: Prettier for frontend (`npm run format`); standard `gofmt` for Go.
