# Agent Guidelines for Sibra Site

## Build/Test Commands
- **Build**: `go build ./cmd/main.go` or `go run ./cmd/main.go`
- **Test**: `go test ./...` (run all tests) or `go test ./internal/package` (single package)
- **CSS Build**: `bunx @tailwindcss/cli -i web/style/styles.css -o web/static/styles.css`
- **CSS Watch**: `./scripts/css-watch.sh`
- **Templ Generate**: `templ generate` (for .templ files)

## Code Style
- **Imports**: Group stdlib, external, internal packages with blank lines
- **Naming**: Use camelCase for variables, PascalCase for exported functions/types
- **Error Handling**: Always check errors, use `fmt.Printf("err: %v\n", err)` for logging
- **Database**: Use pgx/v5 with connection pooling, acquire connections via `db.GetPool()`
- **Templates**: Mix of Go html/template and templ files, use `tpl.ToGoHTML()` for templ conversion
- **Middleware**: Use custom `AuthedHandler` pattern for authenticated routes
- **HTTP**: Use Go 1.22+ route patterns like `"GET /{$}"` and `"POST /api/users"`
- **Structs**: Define types close to usage, use pointer receivers for methods
- **Context**: Pass context.Background() for database operations
- **Environment**: Load .env with `godotenv.Overload(".env")`

## Architecture
- **Structure**: cmd/main.go entry, internal/ for business logic, web/ for static/templates
- **Database**: PostgreSQL with pgx driver, connection pooling, transaction support
- **Auth**: JWT tokens in HTTP-only cookies, custom middleware for auth checks
- **Frontend**: HTMX + Tailwind CSS, mix of Go templates and templ components
- **Templates**: V1 routes use Go html/template, V2 routes use templ components
- **Migration**: /v2 endpoints provide templ-based versions of all pages