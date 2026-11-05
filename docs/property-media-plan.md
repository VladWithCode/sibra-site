# Property Media (Video + Optimized Images) — Implementation Plan

Status: phases 1–6 implemented on branch `feat/property-media` (2026-11-04). Phase 7 (cleanup) pending.

## Goal

Admins can add videos to properties. Videos appear in the property detail gallery,
mixed with photos in an admin-defined order. A property can mark one video as its
**cover video**. The home featured card for that property plays the cover video
when scrolled into view: muted by default, with an audio toggle at the top right.

All uploaded media (property videos, property images, selling page hero media) is
compressed and converted on the server. Existing property images are backfilled.

The home page must not get slower: no video bytes load before the user scrolls a
video card into view.

## Decisions (agreed)

| Topic | Decision |
|---|---|
| Videos per property | Multiple, mixed with images in one ordered gallery |
| Featured video | Admin flags one property video as cover video; card falls back to main image |
| Processing | Async background worker, status `pending → processing → ready / failed` |
| Images | New uploads converted + one-off backfill of existing property images |
| Video format | H.264 MP4 only (`+faststart`), AAC audio |
| Renditions | 1080p (gallery) + 720p (featured card, mobile hero) |
| Upload limits | 500 MB, 3 min per video |
| Image format | WebP at widths 480 / 960 / 1600 / 2400 (never upscaled), served via `srcset` |
| Encoder | `ffmpeg` / `ffprobe` installed on the VPS; Go calls them with `exec.CommandContext` |
| Upload transport | One streamed multipart request with an XHR progress bar; no chunking |
| Originals | Deleted after successful encode (backfill keeps a backup until verified) |
| Poster | Auto-extracted frame at ~1 s, encoded like any image |
| Featured autoplay | Autoplay on mobile too; poster only for `prefers-reduced-motion` and Save-Data / slow connection; only one card plays at a time |
| Featured play order | **Priority, not visibility ratio.** Among cards ≥ 50% visible, the lowest featured position plays. The big main card (position 0) always wins on desktop; side cards play only if it has no video or scrolls out |
| Detail gallery | Video slide has native controls, starts muted when selected, pauses when left; hero stays the main image |
| Selling pages | Hero media also goes through the pipeline |

## Implementation notes (what changed from the plan)

- **Encoder lanes:** one lane for images and one for videos, each encoding one asset at a time. Images
  never wait behind a 10-minute video encode. There is no `MEDIA_WORKERS` setting.
- **Validation:** `http.DetectContentType` is not used. It does not recognize iPhone `.mov` files. ffprobe
  (probing by content, format allowlist) is the only authority. HEIC/AVIF stills are rejected by
  their MP4 `major_brand`.
- **EXIF orientation:** ffmpeg applies JPEG EXIF orientation to stills only in recent builds. The
  pipeline decodes images with `-noautorotate`, reads the orientation in Go (`internal/media/exif.go`)
  and applies `transpose`/`flip` itself. Output is the same on any ffmpeg version.
- **Encoding cost:** the 720 rendition is encoded from the 1080 output, so a 4K source is decoded once.
  All image widths come from one decode (`split` filter). Widths within 15% of the largest are dropped.
- **Uploads:** the panel sends one file per request with XHR progress, so every request stays under
  the 510m nginx limit. The endpoint still accepts up to 16 files per request.
- **Schema additions:** `media_assets.legacy_file` makes the backfill incrementally re-runnable.
  `selling_pages.hero_pending_asset_id` keeps the current hero live while a replacement encodes. The
  worker promotes the replacement in the same transaction that marks it ready, and clears the legacy
  `hero_media` columns.
- **Deleted while encoding:** `CompleteMediaAsset` updates zero rows, and the worker removes the
  output. No separate owner check is needed.
- **New property page:** files are staged in the form. After the property is created, they are uploaded
  one per request with a progress toast, and the edit page shows their encoding status.
- **Audio:** the rule "unmuting one card mutes the others" was dropped. Only one card plays at a time, so
  paused cards are silent anyway.
- **Selling page featured cards** use the encoded hero image when the hero is an image.

## Current state before the change (relevant findings)

- `properties.imgs VARCHAR(256)[]` + `properties.main_img` hold bare filenames; files live in
  `web/static/properties/{id}/`. Nothing is compressed.
- `property_named_images.image` references a gallery filename (validated against `imgs`).
- `UploadPropertyPictures` (`internal/routes/properties.go`) uses `ParseMultipartForm(90 << 20)`.
  Its `delPics` branch writes `newPics[i]` into a zero-length slice, which panics. It also
  creates the directory with mode `0644` (no execute bit). Both go away with the rewrite.
- 9 frontend sites build `/static/properties/{id}/{file}` URLs by hand (PropertyCard,
  PropertyImageCarousel, propertyForm, PropertyRow, PropertyRowCard, panel/index, detail page).
- `internal/db/featured.go` resolves a property card image from `main_img`.
- Selling page hero (`selling_pages.hero_media`, `hero_media_type`) accepts raw mp4/webm up to
  50 MB. `HeroSection.tsx` has a typo: `preload="metamedia"`.
- `main.go` uses `http.ListenAndServe` with no graceful shutdown.

## Architecture

### 1. Data model (Goose migration `add_media_assets`)

```sql
CREATE TABLE media_assets (
    id          UUID PRIMARY KEY,
    kind        VARCHAR(8)  NOT NULL CHECK (kind IN ('image', 'video')),
    status      VARCHAR(12) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    attempts    INT  NOT NULL DEFAULT 0,
    error       TEXT NOT NULL DEFAULT '',
    width       INT  NOT NULL DEFAULT 0,      -- of largest output
    height      INT  NOT NULL DEFAULT 0,
    duration_ms INT  NOT NULL DEFAULT 0,      -- video only
    has_audio   BOOLEAN NOT NULL DEFAULT false,
    variants    JSONB NOT NULL DEFAULT '{}',  -- see below
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX media_assets_pending_idx ON media_assets (created_at) WHERE status = 'pending';

CREATE TABLE property_media (
    id          UUID PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    asset_id    UUID NOT NULL REFERENCES media_assets(id),
    position    INT  NOT NULL DEFAULT 0,
    is_cover    BOOLEAN NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX property_media_one_cover ON property_media (property_id) WHERE is_cover;

ALTER TABLE properties ADD COLUMN main_asset_id UUID REFERENCES media_assets(id);
ALTER TABLE property_named_images ADD COLUMN media_id UUID REFERENCES property_media(id) ON DELETE CASCADE;
ALTER TABLE selling_pages ADD COLUMN hero_asset_id UUID REFERENCES media_assets(id);
```

- `media_assets` is generic and owned by the pipeline. Owners (`property_media`,
  `properties.main_asset_id`, `selling_pages.hero_asset_id`) only reference it.
- `is_cover` must point at a video. The application validates this (a CHECK cannot see `kind`).
- `variants` example:
  ```json
  { "images": [480, 960, 1600], "videos": [1080, 720], "poster": [480, 960, 1600] }
  ```
  File names are derived from `variants`, so they are not stored twice.
- Legacy columns (`imgs`, `main_img`, `property_named_images.image`, `hero_media`,
  `hero_media_type`) stay until the cleanup migration (phase 7).
- The Down migration drops only the new objects. Legacy data is untouched, so rollback is safe.

### 2. File layout and caching

```
web/static/media/{asset_id}/w480.webp  w960.webp  w1600.webp  w2400.webp     (image)
web/static/media/{asset_id}/1080.mp4  720.mp4  poster-w480.webp ...          (video)
tmp/media-incoming/{asset_id}.src                                            (private original)
```

- One directory per asset. Files never change: a new upload creates a new asset id. nginx
  serves `/static/media/` with `Cache-Control: public, max-age=31536000, immutable`.
- Originals are written outside `web/static` (`MEDIA_INCOMING_PATH`, default `tmp/media-incoming`).
  They are never public and are deleted after success.
- The worker writes into `tmp/media-work/{asset_id}/` (`MEDIA_WORK_PATH`) and moves it to
  `web/static/media/{asset_id}/` with one `os.Rename`. Then it marks the row `ready`. Readers never
  see half-written output, and partial folders are never under the public `/static/media/` URL.
  Both paths must be on the same filesystem (both are under the app dir on `/dev/sda1`) for the
  rename to be atomic.
- The worker creates folders with mode `0755` and files with mode `0644`, set explicitly rather than
  through umask, so the nginx worker user can read them (see section 7).

### 3. Pipeline package `internal/media`

Responsibilities: probe, validate, encode, run the worker. One package, no interfaces with only
one implementation.

**Startup check.** `media.CheckTools()` runs `ffmpeg -version` / `ffprobe -version` and verifies that
`libx264` and `libwebp` encoders exist. `main.go` panics if a tool is missing, as it does for the DB.

**Validation (trust boundary).**
1. Store the original without an extension. Ignore the client filename and extension.
2. `ffprobe -v error -print_format json -show_format -show_streams`. Reject when
   `format_name` is not in the allowlist (`mov,mp4,m4a,3gp,3g2,mj2`, `matroska,webm`,
   `image2`, `png_pipe`, `jpeg_pipe`, `webp_pipe`). This blocks playlist/concat formats
   (`hls`, `concat`) that can make ffmpeg read other files or URLs.
3. Video: duration ≤ 180 s, at least one video stream. Image: ≤ 50 megapixels.
4. Pass `-protocol_whitelist file` to every ffmpeg/ffprobe call as defense in depth.
5. Every call uses an argument slice (no shell). Paths come only from asset ids.

**Video encode** (renditions run one after another, never in parallel; `nice -n 19`,
`-threads 2`; see "Server constraints" for why):

```
ffmpeg -protocol_whitelist file -i SRC -map 0:v:0 -map 0:a:0? -map_metadata -1 \
  -vf "fps=30,scale=SHORT_SIDE_EXPR" \        # fps only when the source is > 30 fps
  -c:v libx264 -preset veryfast -profile:v high -pix_fmt yuv420p \
  -crf 23 -maxrate 5M -bufsize 10M            # 1080 rendition
  -crf 27 -maxrate 1.8M -bufsize 3.6M         # 720 rendition
  -c:a aac -b:a 128k -ac 2 -movflags +faststart OUT.mp4
```

- Resolution limits the **short side** (1080 / 720), so portrait phone video is handled
  correctly. Never upscale. Skip the 1080 rendition when the source short side is ≤ 720.
- `-map_metadata -1` strips GPS and device metadata. ffmpeg auto-rotates from the rotation side data.
- `has_audio` is set from ffprobe. The UI hides the audio toggle when the video has no audio.
- Starting values: tune CRF on 3–4 real sample clips before shipping. Target: a 30 s 720p
  clip ≈ 4–6 MB.

**Poster:** `-ss min(1, duration/2) -frames:v 1` to PNG in the partial dir. Then the image encode runs on it.

**Image encode:** for each width in `[480, 960, 1600, 2400]` that is ≤ source width (always at
least the smallest width, at source size if the source is narrower):
`ffmpeg -i SRC -map_metadata -1 -vf scale=W:-2 -c:v libwebp -quality 80 wW.webp`.

> EXIF orientation is applied by the pipeline itself (see "Implementation notes"), and an
> integration test with an orientation=6 JPEG covers it.
> HEIC (iPhone default) is **not** accepted in v1. The panel shows a clear message. iOS Safari
> converts to JPEG on upload in most cases.

**Worker:**
- Runs in-process, started from `main.go`: one lane for images and one for videos, each
  encoding one asset at a time, so encodes never starve the web server.
- Claim: `UPDATE media_assets SET status='processing', attempts=attempts+1, updated_at=now()
  WHERE id = (SELECT id FROM media_assets WHERE status='pending' ORDER BY created_at
  FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING ...`.
- Wake-up: a buffered channel signalled by upload handlers, plus a 30 s poll as a fallback.
- Per-job timeout: 20 min (`context.WithTimeout`). ffmpeg is killed on cancel.
- On error: `attempts < 3` sets the job back to `pending`; otherwise `failed` with `error` text (shown in panel).
- Crash recovery: at startup, reset `processing` back to `pending`.
- Orphan safety: deleting an item deletes its asset row. If that happens mid-encode, completing it
  updates zero rows, and the worker removes the output.
- Add graceful shutdown to `main.go`: on SIGINT/SIGTERM, `http.Server.Shutdown`, cancel the worker
  context, and wait for it. An interrupted job goes back to `pending`.

### 4. Backend API (properties)

All routes use `WithAuthAccessLevelMiddleware(..., AccessLevelEditor)` unless public.

| Route | Purpose |
|---|---|
| `POST /api/property/{id}/media` | Upload 1..16 files (images and/or videos). Streams parts with `r.MultipartReader()` to `MEDIA_INCOMING_PATH`. Limits: `http.MaxBytesReader` (510 MB request), per-part 500 MB video / 25 MB image. Validates, creates `media_assets` (`pending`) + `property_media` (appended position), signals the worker. Returns `202` with the new items. |
| `POST /api/property/{id}/main-image` | Single image upload; sets `main_asset_id`. Deletes the previous asset after commit. |
| `GET /api/property/{id}/media` | Panel list including non-ready items with status/error (used for polling). |
| `PUT /api/property/{id}/media/order` | Body `{ids: [...]}`. Must be exactly the property's media set. Rewrites `position` in one transaction. |
| `PATCH /api/property/{id}/media/{mediaId}` | `{isCover: bool}`. Rejects non-video. Clears the other cover in the same transaction. |
| `DELETE /api/property/{id}/media/{mediaId}` | Deletes the row (named image rows cascade), then the asset directory after commit. |

- Remove `POST/DELETE /api/property/pictures/{id}` once the panel switches over (phase 5).
- Validation errors are Spanish user messages, as in existing handlers.
- **Public property JSON** gains:
  ```ts
  media: Array<{ id; kind: "image" | "video"; base: "/static/media/{asset}"; width; height;
                 widths: number[];            // image widths, or poster widths for videos
                 videos?: number[]; hasAudio?: boolean; durationMs?: number; isCover: boolean }>
  mainImage: { base; width; height; widths } | null
  ```
  Public endpoints return only `ready` media. `namedImages` reference `mediaId`.
- **Featured resolver** (`internal/db/featured.go`, property kind): `Image` comes from `main_asset_id`.
  Add an optional `Video { base, widths (poster), hasAudio }` from the ready cover video.
  The 720 rendition is implied. External/other kinds are unchanged.

### 5. Frontend

**Shared helpers (`frontend/src/lib/media.ts` + `components/media/`):**
- `ResponsiveImage`: `<img src={w960} srcSet="… 480w, … 960w, …" sizes={props.sizes}
  width height loading="lazy" decoding="async">`. `priority` prop sets `loading="eager"` +
  `fetchpriority="high"` for the LCP image (detail hero, first home hero card).
- Replace all 9 hand-built `/static/properties/...` URLs with it. A transitional
  `legacyPropertyImageSrc()` is not needed if cutover happens after backfill (see phase 5).

**Home featured card — `FeaturedVideo`** (inside `FeaturedCard` when `item.video` exists):
- The poster always renders as a `ResponsiveImage`, so first paint equals today's cost.
- `<video muted playsInline loop preload="none" poster>` with **no `src`** until
  needed. No `<link rel=preload>` for video anywhere on home.
- Each `FeaturedVideo` registers with a small **playback coordinator** (module-level store,
  not React context) using its **priority** = index in the resolved featured list
  (`FeaturedListings` passes it down; the main card is 0).
- One shared `IntersectionObserver` (thresholds `[0, 0.5]`) reports whether each card is
  **eligible**. A card is eligible when `intersectionRatio ≥ 0.5`, or when the visible part covers
  ≥ 50% of the viewport height. The second rule covers cards taller than the viewport (the main
  card is 600 px on desktop).
- Rule: **the eligible card with the lowest priority plays; all others pause.** This is
  deliberately not "most visible wins". On desktop the main card (`md:col-span-7`, 600 px) and the
  two side cards (284 px) are visible together. A ratio rule could let a side card win, but the main
  featured property must always play first. The same rule works on mobile: the layout is one
  column, so cards take over in scroll order once the previous one drops below 50%.
- Cards without a ready cover video never register, so the next priority plays instead.
- Lazy loading follows the same rule: `src` (`720.mp4`) is attached **only when a card first
  becomes the winner**, not when it nears the viewport. Side cards next to a playing main card never
  download video. The poster covers the short startup gap (faststart MP4 begins playing after the
  first bytes). Once attached, `src` stays, so returning to a card resumes without re-fetching.
- Leaving eligibility pauses the card. Tab hidden (`visibilitychange`) pauses all. The coordinator
  recomputes on every observer callback and on register/unregister. This handles the
  "Ver más destacados" grid expanding and collapsing.
- A manual tap on a poster-only card (gated users, or a lower-priority card) makes it the winner
  until it stops being eligible. This **user override** beats priority.
- Gating, evaluated once at mount: `prefers-reduced-motion: reduce`, `navigator.connection.saveData`,
  or `effectiveType` in `slow-2g|2g|3g`. In those cases never auto-load and show a play button
  overlay. A tap loads and plays that card.
- Audio toggle: top-right round button (`Volume2`/`VolumeX`), rendered only when `hasAudio`.
  Uses `preventDefault()` + `stopPropagation()` because the card is wrapped in a `<Link>`.
  `aria-label` "Activar sonido" / "Silenciar", `aria-pressed`. Unmuting one card mutes any
  other unmuted card.
- `play()` promise rejections (autoplay blocked) are caught. The card falls back to the play button overlay.

**Detail page gallery (`$contract.$slug.tsx` `HeroSection`):**
- Hero stays the main image (`ResponsiveImage priority`).
- Gallery slides iterate `property.media` in order. Image slides use `ResponsiveImage` with
  `object-contain` (replaces the CSS `background-image`, which had no lazy loading or srcset).
- Video slide: `<video controls muted playsInline preload="none" poster>`. `src` (1080, or 720
  under 1024 px viewport) is set only for the active slide and its neighbours. On Embla `select`,
  the active video plays and all others pause. Closing the dialog pauses all.
- Counter: `3 / 12 · 9 fotos, 3 videos`. Video slides show a play-icon badge in any thumbnail.

**Panel (`components/dashboard/property/GallerySection.tsx` → `MediaManager`):**
- Upload via `XMLHttpRequest` (fetch has no upload progress) with a per-batch progress bar.
- Pre-checks on the client for fast feedback (the server stays authoritative): accepted types, size
  limits, duration ≤ 180 s via a hidden `<video>` `loadedmetadata`.
- Grid of items with status chips (Procesando / Error + message + retry by re-upload),
  drag reorder (reuse the existing dnd lib if the repo has one, otherwise `@dnd-kit/sortable`),
  "Video de portada" star toggle on video items, delete with confirmation.
- Poll `GET /api/property/{id}/media` every 3 s while any item is `pending|processing`
  (TanStack Query `refetchInterval` as a function).
- Named images picker (DetailsSection) selects from `media` image items by `mediaId`.

### 6. Selling pages

- The hero upload handler creates a `media_assets` row and sets `hero_asset_id`. Image and video are
  both accepted, with the same limits as properties.
- `HeroSection.tsx`: video uses poster + `src` = 720 below 1024 px, 1080 otherwise (chosen with
  `matchMedia` at mount). It keeps autoplay (above the fold) but with `preload="metadata"`
  (fixes the `metamedia` typo). The `terrenos/$slug.tsx` head preload switches to the **poster**
  image instead of the video.
- Other selling page images (availability plan, etc.) are out of scope. They are a follow-up.

### 7. Infrastructure

#### Server constraints (measured 2026-11-04)

| Resource | Value | Consequence |
|---|---|---|
| CPU | 2 cores (`nproc`) | 1 worker, renditions encoded one after another, `-preset veryfast`, `nice -n 19` so web requests keep priority. A 3 min 4K60 clip takes ~15–20 min for both renditions (see the measurements below). This is fine because processing is async. |
| RAM | 1.9 Gi total, **886 Mi available**, **no swap** | Decoding a 4K HEVC phone source and encoding x264 1080p can reach several hundred MB. Without swap, a peak could get Go or Postgres OOM-killed. See "Memory protection" below. `MEDIA_WORKERS` stays 1. Do not raise it on this server. |
| Disk | 20 G, **6.4 G free**; legacy media = 101 M (`properties/`) + 148 M (`uploads/`) | The backfill is small: WebP variants of ~250 M of sources fit with a large margin. 500 MB video uploads are the real pressure. See the disk guard below. |

**Memory protection** (all three, cheap):
1. **1 GB swap file** (one-time server setup, run as root):
   ```bash
   sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   sudo sysctl vm.swappiness=10   # also persist in /etc/sysctl.d/99-swap.conf
   ```
   1 GB instead of 2 GB keeps disk headroom for uploads. Swap is a safety net for peaks, not working memory.
2. **The OOM killer targets ffmpeg first.** Right after `cmd.Start()`, the worker writes `1000` to
   `/proc/<ffmpeg pid>/oom_score_adj`. Raising a child's score needs no root. Under memory
   pressure the kernel kills ffmpeg, never Go or Postgres. The worker sees the signal-killed
   exit and counts a failed attempt. After 3 attempts the asset is `failed` with the panel message
   "El video es demasiado pesado para procesarse; súbelo en menor resolución (1080p)".
3. **Bounded threads:** `-threads 2` on the decoder (before `-i`) and the encoder, `-filter_threads 1`.

**Measuring peak memory:** `/usr/bin/time` is not installed on the VPS. Use ffmpeg's own
`-benchmark` flag instead. It prints `bench: maxrss=...KiB` at exit and needs no extra package.

**VPS measurements (2026-11-04, ffmpeg 5.1.9 Debian 12):** source is a 29 s 4K60 H.264 HLG clip
at 49 Mb/s. Each row is the 1080 rendition (`-threads 2`, `nice -n 19`):

| Run | Speed (s of work per s of video) | maxrss |
|---|---|---|
| `-preset medium` (full clip) | 22.5 | 647 MB |
| Decode + `fps=30,scale` only (10 s) | 2.9 | 217 MB |
| `-preset veryfast` (10 s) | 4.3 | 418 MB |

`medium` spent ~85% of its time in x264 and ran a 3 min clip to ~70 min for the 1080 rendition
alone, plus ~25 min for the 720 rendition. `veryfast` is ~5× faster and uses ~230 MB less memory, so
both renditions use it. The output bitrate sits at the `-maxrate` cap on this footage
(~5.1–5.4 Mb/s), so quality per MB is what changes between presets, not file size. Re-check quality
on real property footage before tuning CRF. Decoding 4K60 alone is ~3 s per second of video;
no preset reduces that.

**Disk guard:** before accepting an upload, the handler calls `syscall.Statfs` on
`MEDIA_INCOMING_PATH`. It rejects with `507` and a Spanish message when free space would drop below
**1.5 GB** after the declared `Content-Length`. The worker runs the same check before each encode and
leaves the job `pending` (no attempt counted) while space is low. The backfill command prints the
estimated space it needs and refuses to `--apply` when the estimate exceeds free space minus 1.5 GB.

- VPS: `dnf/apt install ffmpeg` (must include `libx264`, `libwebp`).
- Optional env vars (read by `media.Init` after `.env` is loaded): `MEDIA_OUTPUT_PATH` (default
  `web/static/media`), `MEDIA_INCOMING_PATH` (default `tmp/media-incoming`), `MEDIA_WORK_PATH`
  (default `tmp/media-work`). The defaults fit the VPS. The work and output paths must share a
  filesystem.

#### nginx (`nginx.conf` in the repo root, deployed on the VPS)

Current state that matters:

| Current config | Problem for this task |
|---|---|
| `client_max_body_size 90M` at server level | 500 MB videos are rejected with `413` before they reach Go |
| `location /api/` proxies with default request buffering | nginx writes the whole 500 MB body to its temp dir, then sends it to Go: two full disk copies on a 6.4 G disk, and Go sees nothing until the upload ends |
| `location /static/` proxies **everything** to Go (`localhost:8484`) | Every video byte, including Range requests while seeking, passes through the 2-core Go process. No `Cache-Control` is set, so browsers re-validate media on each visit |
| Security headers use `add_header` at server level | nginx drops **all** inherited `add_header` lines in any location that declares its own `add_header`. A new location that only adds `Cache-Control` would silently lose `X-Frame-Options`, CSP, `nosniff`, etc. |

Already fine: the CSP (`default-src 'self' http: https: data: blob:`) covers `<video>` from the same
origin, and `gzip_types` does not include `video/*` or `image/webp` (compressing them again would
waste CPU).

**Step 1: move the security headers into a snippet** so they can be repeated without copy-paste drift.

`/etc/nginx/snippets/sibra-security-headers.conf`:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```
In the `server` block, replace the five `add_header` lines (lines 5–9) with:
```nginx
include snippets/sibra-security-headers.conf;
```

**Step 2: add two locations** inside the `server` block, above `location /api/`:
```nginx
# Media uploads: large bodies streamed straight to Go (no nginx temp copy).
# Regex locations win over the plain `/api/` prefix, so these routes get the
# raised limit while every other API route keeps the 90M server default.
location ~ ^/api/(property/[^/]+/(media|main-image)|terrenos/[^/]+/medios/hero_media)$ {
    client_max_body_size 510m;
    proxy_request_buffering off;
    proxy_http_version 1.1;          # required for unbuffered chunked request bodies
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;         # Go probes the file before answering
    proxy_pass http://localhost:8484;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Encoded media: served by nginx from disk, immutable (new upload = new asset id).
# `^~` stops regex locations from being checked for these URLs.
location ^~ /static/media/ {
    alias /home/vladwb/www/sibra-remake/web/static/media/;
    try_files $uri =404;
    access_log off;
    include snippets/sibra-security-headers.conf;   # see step 1: add_header here drops inherited ones
    add_header Cache-Control "public, max-age=31536000, immutable" always;
}
```
- `location /static/` stays as it is. Legacy `/static/properties/` and `/static/uploads/` keep
  going through Go until the phase 7 cleanup.
- nginx serves `Range` requests (`206 Partial Content`) natively, which video seeking needs.
- Keep `client_max_body_size 90M` at server level. Only the upload routes get the larger limit.
  The Go handler still enforces the exact limits (500 MB video, 25 MB image).
- The route paths must match the Go routes in section 4 and the selling page route
  `PUT /api/terrenos/{id}/medios/{field}`. If a route is renamed during implementation, update this
  regex in the same PR.

**Step 3: permissions.** nginx already reads `/home/vladwb/www/sibra-remake/frontend/dist`, so the
worker user can traverse the parent folders. Check the new folder once it exists:
```bash
sudo -u www-data test -r /home/vladwb/www/sibra-remake/web/static/media && echo ok
grep -E 'video/mp4|image/webp' /etc/nginx/mime.types   # both must be present
```

**Step 4: apply and verify:**
```bash
sudo cp /etc/nginx/sites-available/sibra /etc/nginx/sites-available/sibra.bak-$(date +%F)
sudo nginx -t && sudo systemctl reload nginx

# Headers: expect 200, Cache-Control immutable, Accept-Ranges, and X-Frame-Options still present
curl -sI https://sibra.mx/static/media/<asset_id>/720.mp4
# Range: expect 206
curl -s -o /dev/null -w '%{http_code}\n' -r 0-1023 https://sibra.mx/static/media/<asset_id>/720.mp4
# Other API routes keep the 90M limit: expect 413
head -c 100M /dev/zero | curl -s -o /dev/null -w '%{http_code}\n' -X POST --data-binary @- https://sibra.mx/api/property
```
Order: deploy the nginx change together with phase 2 (upload API). The `/static/media/` location is
harmless before any asset exists. Rollback: restore the `.bak` file and reload.

## Phases (implemented as one commit each)

1. Pipeline core: migration, `internal/media`, encoder lanes, graceful shutdown.
2. Property media API.
3. Backfill command `cmd/media-backfill`.
4. Public frontend: responsive images, gallery video, featured card playback.
5. Panel: `PropertyMediaManager`, named images by media id, legacy picture endpoints removed.
6. Selling page hero on the pipeline, plus its backfill.
7. **Pending, after ~2 weeks stable:** a migration drops `imgs`, `main_img`,
   `property_named_images.image`, `hero_media`, `hero_media_type` and `media_assets.legacy_file`.
   Archive, then remove `web/static/properties/` and the old hero uploads.

## Deployment runbook

The new server binary **panics at startup if ffmpeg/ffprobe are missing**, so install them first.

1. **VPS prerequisites:** `sudo apt install ffmpeg` (check `ffmpeg -hide_banner -encoders | grep -E
   'libx264|libwebp'`), then create the 1 GB swap file (section 7).
2. **Migrate:** the change is additive, and the running old binary ignores the new columns. The
   server has no git checkout, so run goose from the dev machine through an SSH tunnel:
   ```bash
   ssh -N -L 5433:localhost:5432 vladwb@sibvm      # terminal 1: keep open
   export GOOSE_DRIVER=postgres GOOSE_DBSTRING="postgres://USER:PASS@localhost:5433/DBNAME?sslmode=disable"
   goose -env=none -dir sql/migrations status
   goose -env=none -dir sql/migrations up
   ```
   Pass the connection through `GOOSE_*` variables, not as arguments: goose otherwise loads the
   local `.env`, sees `GOOSE_DRIVER`, and fails with `"postgres": no such command`. `-env=none`
   makes sure the local `.env` is never used, so the commands cannot hit the local database.
   Take USER, PASS and DBNAME from the server's `.env`. `status` must show only
   `20261104000000_add_media_assets.sql` as pending before you run `up`. Alternative: `scp -r
   sql/migrations` to the server and run goose there, if goose is installed on it.
3. **Backfill while the old site still runs:** it needs the server's legacy files and ffmpeg, so it
   runs on the server. Build it on the dev machine and copy it next to the server binary:
   ```bash
   CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o media-backfill ./cmd/media-backfill
   scp media-backfill vladwb@sibvm:~/www/sibra-remake/
   ```
   On the server, run it from `~/www/sibra-remake` (it reads `.env` and the relative
   `web/static/...` paths from the working directory): `./media-backfill` (dry run: check counts and
   missing files), then `./media-backfill --apply`. Expect roughly 20 s for ~30 images. A legacy
   hero video takes minutes.
4. **nginx:** apply section 7 (headers snippet, upload location, `/static/media/` location), then
   `nginx -t` and reload.
5. **Cutover:** ask editors to pause gallery edits. Re-run `./media-backfill --apply` on the server
   (it only syncs what changed), build the frontend, then build and restart the Go server.
6. **Verify:** home and detail pages render images from `/static/media/`. Upload a real phone video
   in the panel and watch it go from "Procesando" to ready. Measure the encode's peak memory with
   `ffmpeg -benchmark` on a similar clip.

Rollback: restore the previous binary and frontend build. The legacy columns and files are untouched,
so the old code works as before. `goose down` removes the new tables if needed.

## Acceptance criteria

- Home: with cover videos in the featured section, the network panel shows **zero** `.mp4`
  requests before a card becomes the playing card. Initial transfer is not larger than before
  the change (Lighthouse mobile run before/after; LCP not worse).
- Desktop: when the main card and both side cards have videos and are all visible, only the main
  card plays and only `main/720.mp4` is fetched. Scrolling until the main card is < 50% visible
  hands playback to the first side card. When the main card has no video, the first side card plays.
- Mobile: cards play in scroll order. Only one plays at a time. Scrolling away pauses it.
- The audio toggle works and does not navigate. There is no toggle on videos without audio.
- Reduced-motion and Save-Data users see a poster with a play button. No video bytes load until they tap.
- Detail gallery: photos and videos appear in admin order. Only the active and neighbouring video slides
  fetch media. Leaving a slide pauses its video.
- Upload of a 500 MB / 3 min phone video succeeds behind nginx. The panel shows progress, then
  "Procesando", then a ready item without a page reload. A 4 min video and a renamed `.txt` file are rejected
  with Spanish messages.
- Output: MP4 H.264/AAC with `faststart`, no GPS metadata, portrait orientation preserved,
  short side ≤ 1080 / 720. Images are WebP, never upscaled, and EXIF orientation is correct.
- Killing the server mid-encode, then restarting, completes the job. Deleting an item mid-encode
  leaves no files behind.
- The backfill dry-run reports counts. `--apply` is idempotent. Every existing property renders the
  same photos in the same order after cutover.

## Risks and open items

- **VPS capacity:** the server has 2 cores, 886 Mi available RAM, no swap and 6.4 G free disk.
  Encoding competes with the site for CPU (mitigated by `nice -n 19`, sequential renditions,
  1 worker). Memory is the tightest resource (mitigated by swap, `oom_score_adj` and bounded
  threads). ffmpeg 5.1.9 is installed and measured (418 MB peak with `veryfast`). Still to do:
  create the swap file.
- **Disk:** at 6.4 G, a few large videos plus the backfill can fill the disk. The disk guard
  prevents a full disk but not "can't upload". Plan for a disk upgrade, or move media to object
  storage, if the catalog grows.
- **iPhone HDR video:** HLG/Dolby Vision sources are converted to 8-bit `yuv420p` without tone
  mapping and can look washed out. Add a `zscale`/`tonemap` step if editors upload HDR clips (it needs
  ffmpeg built with libzimg).
- **Not verified yet:** CRF values on real property footage (one real 4K clip hit the `-maxrate`
  cap, so the 1080 quality is bitrate-limited), and the mobile-width layout of the featured cards
  in a real phone browser.
- **HEIC images:** rejected in v1. Revisit if editors upload from iPhone desktop sync.
- **Disk growth:** variants roughly double image storage per photo vs one raw file, but the total is
  far smaller than raw JPEGs. Videos are about 5–15 MB each after encode.
- **Re-encoding later:** originals are deleted, so new encoder settings only apply to new uploads.
