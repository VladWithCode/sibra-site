# Sibra Blog — Notas de deploy y prueba

## Flujo recomendado de producción

```
Internet → Nginx → Go backend (puerto 8080)
                ↓
         assets estáticos (Vite dist/) servidos por Nginx directamente
```

- **Nginx** sirve `/assets/`, `/static/`, archivos raíz del dist (`favicon.ico`, etc.)
- **Nginx** pasa `/api/*` y `/blog/:slug` a Go
- **Go** inyecta OG tags + fallback HTML del artículo en `/blog/{slug}`
- **Go** sirve el SPA React para todas las demás rutas

---

## Orden de arranque

1. Construir el frontend **antes** de iniciar Go:

   ```bash
   cd frontend
   npm run build   # o: bun run build
   cd ..
   go run main.go
   ```

   Si Go arranca sin el build, los endpoints SPA responden 503.
   El `index.html` se cachea en memoria tras la primera lectura exitosa.
   Los errores de lectura (build no disponible) **no** se cachean: una vez
   que el build exista, el siguiente request lo leerá automáticamente sin
   reiniciar Go. Para actualizar el build en producción sí es necesario
   reiniciar el proceso Go (el HTML se cachea una vez leído exitosamente).

2. Variables de entorno obligatorias en producción:

   ```env
   # URL pública del sitio. Sin barra final. OBLIGATORIO en producción.
   # Usada en og:url, og:image, canonical y fallback de posts de blog.
   SITE_URL=https://sibrainmobiliaria.com

   # Puerto del servidor (default: 8080)
   PORT=8080

   # Directorio de almacenamiento de archivos Markdown (default: storage/blog)
   BLOG_STORAGE_DIR=storage/blog

   # Directorio del build de React (default: frontend/dist)
   # Solo cambiar si el build se mueve a otra ruta.
   # FRONTEND_DIST_DIR=frontend/dist
   ```

   Si `SITE_URL` no está definido, Go derivará la URL base usando (en orden
   de prioridad): `X-Forwarded-Host`, `Host` header, `localhost:8080`. El
   esquema se determina por `X-Forwarded-Proto` o `r.TLS`. Se loguea una
   advertencia una sola vez. En producción **esto no es fiable** — siempre
   define `SITE_URL`.

---

## Nginx — configuración conceptual recomendada

El siguiente bloque cubre el subdominio del blog. Ajusta rutas y upstream según
tu entorno real.

```nginx
upstream go_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name sibrainmobiliaria.com www.sibrainmobiliaria.com;

    # TLS — ajusta rutas según tu proveedor (certbot, etc.)
    ssl_certificate     /etc/letsencrypt/live/sibrainmobiliaria.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sibrainmobiliaria.com/privkey.pem;

    # ── Vite assets: cache largo, inmutable ────────────────────────────────
    location /assets/ {
        root /srv/sibra/frontend/dist;
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # ── Archivos raíz del build (favicon, manifest, robots.txt, etc.) ──────
    location ~ ^/(favicon\.ico|manifest\.json|robots\.txt|sibra_logo_256\.webp)$ {
        root /srv/sibra/frontend/dist;
        try_files $uri =404;
        expires 7d;
        access_log off;
    }

    # ── Assets estáticos de Go (web/static/) ───────────────────────────────
    location /static/ {
        # Opción A: servir directamente por Nginx
        root /srv/sibra;           # resuelve a /srv/sibra/static/
        try_files $uri =404;
        expires 30d;
        access_log off;

        # Opción B: pasar a Go (más simple pero algo más lento)
        # proxy_pass http://go_backend;
    }

    # ── Uploads de blog: servir directamente por Nginx ─────────────────────
    location /static/uploads/blog/ {
        root /srv/sibra;
        try_files $uri =404;
        expires 30d;
        access_log off;
    }

    # ── API: todo pasa a Go ────────────────────────────────────────────────
    location /api/ {
        proxy_pass         http://go_backend;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Connection        "";
    }

    # ── Blog posts: Go inyecta OG tags + fallback HTML ─────────────────────
    location ~ ^/blog/[^/]+/?$ {
        proxy_pass         http://go_backend;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Connection        "";
        # Sin cache en rutas de blog (contenido puede publicarse en cualquier momento)
        add_header Cache-Control "no-cache";
    }

    # ── SPA fallback: React maneja el resto de rutas ───────────────────────
    location / {
        root /srv/sibra/frontend/dist;
        try_files $uri /index.html;
    }
}

# Redirigir HTTP → HTTPS
server {
    listen 80;
    server_name sibrainmobiliaria.com www.sibrainmobiliaria.com;
    return 301 https://$host$request_uri;
}
```

**Notas importantes:**
- Con esta config, Nginx sirve `/assets/` y `/static/` directamente sin pasar a Go.
  Go sigue sirviendo `/static/` como fallback si Nginx no encuentra el archivo,
  pero en producción se recomienda la ruta directa por rendimiento.
- Si `SITE_URL` está definido (recomendado), Go NO necesita el header
  `X-Forwarded-Proto` para los OG tags. De todas formas es buena práctica enviarlo.
- Los uploads (`storage/blog/`) deben ser accesibles tanto para Go (escritura) como
  para Nginx (lectura). Si ambos corren en el mismo servidor, usa permisos de
  grupo compartido (`www-data:sibra` o similar).

---

## Verificación SEO / Open Graph (curl)

Estas pruebas se ejecutan con Go corriendo y un post publicado.

```bash
BASE=http://localhost:8080
SLUG=mi-slug-publicado

# 1. HTML con contenido: debe tener OG tags + fallback del artículo
curl -s $BASE/blog/$SLUG | grep -E 'og:title|og:image|canonical|data-blog-ssr|id="app"'
# Resultado esperado:
#   <meta property="og:title" content="..." />
#   <meta property="og:image" content="https://..." />
#   <link rel="canonical" href="https://..." />
#   <article data-blog-ssr ...>  ← fallback visible antes de React
#   <div id="app"><article ...>  ← mount point con contenido pre-renderizado

# 2. Bot social: mismos OG + twitter:card
curl -s -A "facebookexternalhit/1.1" $BASE/blog/$SLUG \
  | grep -E 'og:title|og:image|og:url|twitter:card'
# → 4 líneas con los meta tags

# 3. Verificar que og:image es URL absoluta (no /static/...)
curl -s $BASE/blog/$SLUG | grep og:image
# → debe contener https:// (nunca empieza con /)

# 4. Verificar que React sigue cargando (scripts Vite presentes)
curl -s $BASE/blog/$SLUG | grep -E '<script|/assets/'
# → debe mostrar las líneas de <script type="module"> del bundle Vite

# 5. Draft → SPA sin OG ni fallback del artículo
curl -s $BASE/blog/slug-de-borrador | grep 'og:title\|data-blog-ssr'
# → sin salida (plain SPA)

# 6. Post inexistente → SPA plain
curl -s $BASE/blog/no-existe | grep og:title
# → sin salida

# 7. Verificar que React sigue funcionando para otras rutas
curl -s $BASE/propiedades | grep 'id="app"'
# → <div id="app"></div>  (sin fallback — solo posts de blog lo tienen)
```

---

## Prueba de humo en ambiente con DB real

Ejecutar con Go corriendo y la DB inicializada (`goose up`).

### 1. CRUD básico de posts (panel admin)

```bash
BASE=http://localhost:8080

# Login (obtener cookie auth_token)
curl -s -c cookies.txt -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@example.com","password":"password"}'

# Crear draft (como editor)
curl -s -b cookies.txt -X POST $BASE/api/admin/blog/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Post de prueba","content":"## Sección\n\nTexto de prueba.","snippet":"Resumen corto"}' \
  | jq '.post.id'
# → "uuid-del-post"

# Editar draft propio
curl -s -b cookies.txt -X PUT $BASE/api/admin/blog/posts/{id} \
  -H "Content-Type: application/json" \
  -d '{"title":"Post de prueba editado","content":"## Sección\n\nTexto actualizado.","snippet":"Resumen actualizado"}'
# → 200 + post actualizado

# Publicar draft propio (editor)
curl -s -b cookies.txt -X PATCH $BASE/api/admin/blog/posts/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status":"published"}'
# → 200 { "status": "published" }

# Intentar archivar como editor → debe fallar
curl -s -b cookies.txt -X PATCH $BASE/api/admin/blog/posts/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status":"archived"}'
# → 403

# Login como admin
curl -s -c cookies_admin.txt -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Archivar (admin)
curl -s -b cookies_admin.txt -X PATCH $BASE/api/admin/blog/posts/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status":"archived"}'
# → 200 { "status": "archived" }

# Eliminar otro post (admin)
curl -s -b cookies_admin.txt -X DELETE $BASE/api/admin/blog/posts/{otro-id}
# → 200 { "success": true }

# Sin auth → debe fallar
curl -s $BASE/api/admin/blog/posts
# → 401
```

### 2. Upload de imágenes

```bash
# JPG válido (con auth de editor)
curl -s -b cookies.txt -F "image=@/tmp/test.jpg" $BASE/api/admin/blog/uploads
# → 200 { "url": "/static/uploads/blog/uuid.jpg", "markdown": "![imagen](...)" }

# PNG válido
curl -s -b cookies.txt -F "image=@/tmp/test.png" $BASE/api/admin/blog/uploads
# → 200

# WebP válido
curl -s -b cookies.txt -F "image=@/tmp/test.webp" $BASE/api/admin/blog/uploads
# → 200

# TXT → rechazado por MIME
curl -s -b cookies.txt -F "image=@/tmp/test.txt" $BASE/api/admin/blog/uploads
# → 415 "Tipo de archivo no permitido"

# SVG → rechazado por MIME
curl -s -b cookies.txt -F "image=@/tmp/test.svg" $BASE/api/admin/blog/uploads
# → 415

# Sin auth
curl -s -F "image=@/tmp/test.jpg" $BASE/api/admin/blog/uploads
# → 401
```

### 3. SEO / Open Graph

```bash
# Post publicado — debe devolver OG tags completos
curl -s -A "facebookexternalhit/1.1" $BASE/blog/mi-slug-publicado \
  | grep -E 'og:title|og:description|og:image|canonical|twitter:card'
# Resultado esperado (5 líneas):
#   <meta property="og:title" content="..." />
#   <meta property="og:description" content="..." />
#   <meta property="og:image" content="https://sibrainmobiliaria.com/..." />
#   <link rel="canonical" href="https://sibrainmobiliaria.com/blog/..." />
#   <meta name="twitter:card" content="summary_large_image" />

# og:image debe ser absoluta
curl -s $BASE/blog/mi-slug-publicado | grep og:image
# → debe contener https:// (no /static/...)

# Draft → SPA plain, sin OG del post
curl -s $BASE/blog/slug-de-borrador | grep og:title
# → sin salida

# Post inexistente → SPA plain
curl -s $BASE/blog/no-existe | grep og:title
# → sin salida

# SPA funciona para otras rutas
curl -s $BASE/propiedades | grep 'id="app"'
# → <div id="app"></div>

# Assets del bundle se sirven correctamente
curl -I $BASE/assets/index-$(ls frontend/dist/assets/ | grep "^index-" | grep ".js" | head -1)
# → 200 Content-Type: text/javascript
```

### 4. API pública (sin auth)

```bash
# Lista posts publicados
curl -s $BASE/api/blog/posts | jq '.posts | length'
# → número ≥ 0

# Post por slug (publicado)
curl -s $BASE/api/blog/posts/mi-slug-publicado | jq '.post.status'
# → "published"

# Draft por slug → 404
curl -s $BASE/api/blog/posts/slug-de-borrador | jq '.error'
# → "Post no encontrado"
```

---

## Comandos de verificación CI

```bash
# Backend
go build ./...
go test ./...
go vet ./...

# Frontend (filtrando errores preexistentes fuera del módulo blog)
cd frontend
npm run build
npx tsc --noEmit 2>&1 | grep "blog\|BlogMarkdown\|BlogToC\|BlogShare\|BlogCta\|panel/blog"
# → sin salida (0 errores en archivos blog)
```

---

## Límites y restricciones de tamaño

| Endpoint | Límite | Cómo se aplica |
|----------|--------|----------------|
| POST/PUT `/api/admin/blog/posts` | 2 MB | `http.MaxBytesReader` antes del JSON decode |
| PATCH `/api/admin/blog/posts/{id}/status` | 2 MB | ídem |
| POST `/api/admin/blog/tags` | 2 MB | ídem |
| POST `/api/admin/blog/uploads` | 8 MB (imagen) + 1 MB overhead | `http.MaxBytesReader` en el handler de upload |

Si se supera el límite JSON, el servidor responde **413 Payload Too Large**.

---

## Runbook: inconsistencia DB / FS después de fallo en archive

Si el proceso Go muere o la DB falla **después** de que `blogfs.Move` renombró el archivo
pero **antes** de que `db.ArchiveBlogPost` confirmó, el sistema queda con:

- **FS**: archivo en `storage/blog/{year}/{month}/old-{ts}-{slug}.md`
- **DB**: post con slug y `content_path` originales, status aún no archivado

El log registra `CRITICAL archive revert failed` con todos los detalles necesarios.

**Pasos de recuperación manual:**

1. Localizar el log `CRITICAL` para obtener `post_id`, `oldPath`, `newPath`.
2. Si el archivo está en `newPath` y la DB no se actualizó:
   ```bash
   mv storage/blog/{newPath} storage/blog/{oldPath}
   ```
3. Verificar que la DB tiene el `content_path` y `slug` original para ese `post_id`:
   ```sql
   SELECT id, slug, content_path, status FROM blog_posts WHERE id = '{post_id}';
   ```
4. Volver a intentar archivar desde el panel admin.

Si el revert de FS también falló (log tiene dos errores), el archivo puede existir
en `newPath` (o en ninguno). Restaurar el `.md` desde backup si existe, luego
ejecutar `UPDATE blog_posts SET status='draft' WHERE id='{post_id}'` para
que el post vuelva a ser editable.

---

## Rate limiting

El proyecto no implementa rate limiting a nivel de aplicación. Se evaluó agregar
un limiter localizado para los endpoints de blog, pero se descartó porque:

1. Todos los endpoints de escritura (`POST`, `PUT`, `PATCH`, `DELETE`, uploads)
   requieren autenticación de editor o admin — el vector de abuso anónimo no existe.
2. Agregar `golang.org/x/time/rate` solo al blog crearía inconsistencia: los demás
   módulos (properties, projects, users) seguirían sin protección.
3. La solución correcta es rate limiting a nivel de infraestructura (Nginx
   `limit_req_zone`, Cloudflare Rate Limiting, o un middleware global en Go).

**Deuda técnica de infraestructura**: implementar rate limiting como middleware
global en `NewRouter()` o a nivel de Nginx/CDN. Prioridad:
- **Alta** para endpoints públicos sin auth (`/api/blog/posts`, `/api/blog/tags`).
- **Media** para endpoints admin (ya protegidos por auth).
- **Alta** para uploads (`POST /api/admin/blog/uploads`) — aunque requiere auth,
  un token comprometido permite subir archivos ilimitados de 8MB.

Ejemplo Nginx (añadir al bloque `server`):
```nginx
limit_req_zone $binary_remote_addr zone=blog_api:10m rate=30r/m;

location /api/admin/blog/uploads {
    limit_req zone=blog_api burst=5 nodelay;
    proxy_pass http://go_backend;
    # ... demás proxy headers
}
```

---

## Limpieza de imágenes huérfanas

### Qué son imágenes huérfanas

Cuando un editor cambia o elimina la imagen de portada de un post, o inserta una
imagen en el Markdown y luego la remueve, el archivo físico en
`web/static/uploads/blog/` permanece en disco. Esto es **intencional**: evita
race conditions con caches de CDN, simplifica la lógica de compensación
FS↔DB, y previene borrar imágenes que podrían estar referenciadas por otro post.

Con el tiempo estos archivos huérfanos se acumulan. La herramienta
`cmd/blog-cleanup` permite detectarlos y eliminarlos de forma segura.

### Cómo funciona

El comando:

1. Escanea todos los archivos `.jpg`, `.jpeg`, `.png`, `.webp` en el directorio
   de uploads del blog.
2. Consulta la DB para obtener todos los `cover_image` y `content_path` de
   **todos** los posts (draft, publicados y archivados).
3. Lee el Markdown de cada post y extrae referencias a imágenes
   (`![alt](/static/uploads/blog/...)` y URLs absolutas).
4. Compara archivos físicos contra el set de referencias.
5. Archivos no referenciados **y** con más de 48h de antigüedad son huérfanos.
6. En modo dry-run (default) solo reporta; con `--delete` borra.

### Dry-run (default, seguro)

```bash
go run cmd/blog-cleanup/main.go
```

Muestra qué archivos borraría, su tamaño y antigüedad. **No borra nada.**

Ejemplo de salida:
```
Scanned 42 image files in web/static/uploads/blog (12.3 MB)
Found 28 unique referenced image filenames across 15 posts

── Results ──────────────────────────────────────────
  Total files scanned:     42
  Referenced (keep):       28
  Orphaned:                12 (3.4 MB)
  Skipped (too recent):    2 (min-age: 48h0m0s)

Orphan files:
  abc123.jpg                                  245.0 KB  age: 168h30m
  def456.png                                  1.2 MB    age: 720h0m
  ...

DRY RUN — no files were deleted.
To delete, run again with: --delete
```

### Borrado con --delete

```bash
# ⚠️ RECOMENDACIÓN: hacer backup antes de borrar
cp -r web/static/uploads/blog/ /tmp/blog-uploads-backup/

# Ejecutar borrado
go run cmd/blog-cleanup/main.go --delete
```

### Opciones

| Flag | Default | Descripción |
|------|---------|-------------|
| `--delete` | `false` | Borrar archivos huérfanos (sin flag = dry-run) |
| `--min-age` | `48h` | Antigüedad mínima para considerar huérfano |
| `--uploads-dir` | `web/static/uploads/blog` | Directorio de uploads |

Ejemplo con antigüedad mínima de 7 días:
```bash
go run cmd/blog-cleanup/main.go --min-age=168h --delete
```

### Protecciones de seguridad

- **Dry-run por defecto**: sin `--delete` no se borra nada.
- **Antigüedad mínima (48h)**: protege imágenes recién subidas que podrían estar
  en un draft en progreso o pendientes de guardar.
- **Path traversal protection**: rechaza nombres con `/`, `\`, `..`.
- **Solo archivos**: nunca borra directorios ni sigue symlinks.
- **Solo extensiones permitidas**: `.jpg`, `.jpeg`, `.png`, `.webp`.
- **Todos los posts**: escanea draft, published y archived (no solo publicados).

### Recomendaciones de operación

- **Siempre ejecutar dry-run primero** antes de usar `--delete`.
- **Hacer backup** del directorio de uploads antes de borrar.
- **Frecuencia recomendada**: mensual, manual o como cron:
  ```bash
  # Cron mensual (primer domingo del mes a las 3AM)
  0 3 1-7 * 0 cd /srv/sibra && go run cmd/blog-cleanup/main.go --delete >> /var/log/blog-cleanup.log 2>&1
  ```
- Si usas CDN con cache, purgar cache de las URLs eliminadas después del cleanup.

---

## Módulos completados (Fases 1–9 + Auditoría)

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | `blogfs` — File System Markdown (atomic write, path traversal protection) | ✅ |
| 2 | DB + migración + repositorio (pgx, UUID v7, scanBlogPost) | ✅ |
| 3 | API backend (CRUD, permisos editor/admin, flujos de compensación FS↔DB) | ✅ |
| 4 | Panel admin React (lista, crear, editar, publicar, archivar, eliminar) | ✅ |
| 5 | Upload de imágenes (MIME sniff, UUID filename, MaxBytesReader) | ✅ |
| 6 | Frontend público (`/blog`, `/blog/$slug`, paginación, filtros por tag) | ✅ |
| 7 | Markdown render, ToC con deduplicación, shortcode `[[cta-contacto]]`, share buttons | ✅ |
| 8 | SEO / Open Graph (Go inyecta meta tags en SPA, SPA fallback, `SITE_URL`) | ✅ |
| 9 | QA, hardening y corrección de bugs | ✅ |
| 10 | Auditoría final: B1,B2,D1,D2/G1,D3,F1,F2,I1,J1–J7,K1 corregidos | ✅ |

---

## Pendientes no bloqueantes

- **TS preexistentes fuera de blog**: `ConqsQuoteForm.tsx`, `PropertyCard.tsx`, `footer.tsx`, `$project.tsx`, `index.tsx` (home) — deuda acumulada antes del módulo blog.
- **Rate limiting**: ver sección arriba. Deuda de infraestructura, no específica del blog.
- **Limpieza de imágenes huérfanas**: implementada como `cmd/blog-cleanup`. Ver sección arriba para uso.
- **Test de integración end-to-end**: los tests unitarios HTTP (`blog_handlers_test.go`, `blog_seo_test.go`, `spa_test.go`) cubren helpers, OG, SPA cache y `siteBaseURL`. Un test HTTP con servidor real + DB de prueba sería el siguiente paso (requiere decisión de infraestructura CI).
- **Brand colors en BlogShareButtons**: los colores `#25D366` (WhatsApp), `#1877F2` (Facebook), `bg-black` (X) se mantienen intencionalmente como colores de marca de plataforma externa. No son del design system del proyecto.
