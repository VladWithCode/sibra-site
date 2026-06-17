# Analíticas — Ingesta desde páginas externas

Permite que páginas **fuera de este repo/app** (landings, micrositios, campañas)
registren sus visitas en la misma base de datos de Sibra.

## Endpoint

```
POST /api/analytics/visit
Content-Type: application/json
```

Respuesta: `{ "ok": true }` (siempre rápido; el guardado es asíncrono).

### Payload

Todos los campos son opcionales salvo que se requiere **al menos** `url` o `path`.

| Campo       | Tipo   | Notas                                            |
|-------------|--------|--------------------------------------------------|
| `url`       | string | URL completa (`location.href`). Máx 2048.        |
| `path`      | string | Ruta (`location.pathname`). Se deriva de `url` si falta. Máx 1024. |
| `title`     | string | Título de la página. Máx 512.                    |
| `referrer`  | string | `document.referrer`. Si va vacío se usa header `Referer`. Máx 2048. |
| `source`    | string | Etiqueta de campaña/origen (ej. `landing-externa`). Máx 128. |
| `site`      | string | Identificador del sitio (ej. `sibra-landing`). Máx 128. |
| `sessionId` | string | Opcional. Máx 128.                               |
| `visitorId` | string | Opcional. Máx 128.                               |

El backend completa automáticamente: `user_agent`, `ip_hash` (SHA-256, no se
guarda la IP cruda), `origin` (header `Origin`), `created_at`. Los bots conocidos
se ignoran por `User-Agent`.

## Snippet para una página externa

No requiere secretos (corre en el navegador):

```html
<script>
fetch("https://api.sibra.mx/api/analytics/visit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: location.href,
    path: location.pathname,
    title: document.title,
    referrer: document.referrer,
    source: "landing-externa",
    site: "sibra-landing"
  })
}).catch(() => {});
</script>
```

## CORS / configuración

El endpoint público sólo responde con headers CORS a orígenes en la allowlist.
Se configura por variable de entorno (separar varios con coma):

```env
# Orígenes permitidos para POST /api/analytics/visit
ANALYTICS_ALLOWED_ORIGINS=https://landing.sibra.mx,https://promo.sibra.mx
```

- Sin la variable (o vacía) → ningún origen externo recibe CORS (sólo same-origin
  como la propia SPA, que no necesita CORS).
- Valor especial `*` → permite cualquier origen. Es seguro **sólo porque nunca se
  envían credenciales** (no se usa `Access-Control-Allow-Credentials`); aún así se
  recomienda listar orígenes explícitos en producción.
- Nunca se combina `*` con credenciales.

### Notas de producción

- Detrás de Nginx, asegurar que se pase `X-Forwarded-For` / `X-Real-IP` para que
  el `ip_hash` sea útil.
- No hay rate-limit a nivel app todavía: si se abusa, limitar en Nginx por IP en
  `location = /api/analytics/visit`.
- El preflight `OPTIONS /api/analytics/visit` está implementado y responde `204`.
