# Sibra Blog — Notas de deploy y prueba

## Orden de arranque

1. Construir el frontend **antes** de iniciar Go:

   ```bash
   cd frontend
   npm run build
   cd ..
   go run main.go
   ```

   Si Go arranca sin el build, todos los endpoints de la SPA responden 503.
   El `index.html` se cachea en memoria en el primer request — para actualizar
   el build en producción reiniciar el proceso Go.

2. Variables de entorno obligatorias en producción:

   ```env
   # URL pública del sitio. Sin barra final.
   # Usada en og:url, og:image y canonical de posts de blog.
   SITE_URL=https://sibrainmobiliaria.com

   # Puerto del servidor (default: 8080)
   PORT=8080

   # Directorio de almacenamiento de archivos Markdown (default: storage/blog)
   BLOG_STORAGE_DIR=storage/blog

   # Directorio del build de React (default: frontend/dist)
   # Solo cambiar si el build se mueve a otra ruta.
   # FRONTEND_DIST_DIR=frontend/dist
   ```

   Si `SITE_URL` no está definido, el servidor logueará una advertencia al primer
   request de blog y usará `http://localhost:8080` como base para los meta tags.

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

El proyecto no implementa rate limiting a nivel de aplicación en ningún endpoint.
Este es un gap de seguridad general (no específico del blog) a resolver con un
middleware global o a nivel de infraestructura (nginx, Cloudflare, etc.).

**Deuda técnica pendiente**: agregar `golang.org/x/time/rate` o similar como
middleware en `NewRouter()`. Prioridad media para endpoints públicos del blog
(`/api/blog/posts`, `/api/blog/posts/{slug}`).

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
- **`spaOnce` cachea error en primer arranque sin build**: si Go inicia sin `frontend/dist/index.html`, el error queda cacheado hasta reiniciar el proceso. Mitigación: correr `npm run build` antes de `go run main.go` (documentado arriba).
- **Rate limiting**: ver sección arriba. Deuda de seguridad general pendiente.
- **Test de integración end-to-end**: los tests unitarios HTTP (`blog_handlers_test.go`) cubren helpers de tamaño y OG. Un test HTTP con servidor real + DB de prueba sería el siguiente paso.
- **Brand colors en BlogShareButtons**: los colores `#25D366` (WhatsApp), `#1877F2` (Facebook), `bg-black` (X) se mantienen intencionalmente como colores de marca de plataforma externa. No son del design system del proyecto.
