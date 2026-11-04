# Patchlingo

Translate multi-effects presets between devices. First pair: **Valeton GP-200 (`.prst`) → Hotone Ampero Mini** setting guide.

Status: M4 (web UI, dark mode, mobile, deploy workflow) — see [DESIGN.md](DESIGN.md).

Drop one or more `.prst` files (or a folder) into the page and get a setting guide per preset,
with a match badge per block (Sama / Mirip / Pengganti / Tidak ada). Export as Markdown or print.
Everything runs in the browser; presets are never uploaded.

## Development

```bash
npm install
npm run dev                             # web app at http://localhost:5173
npm test                                # unit tests (+ private fixtures when present)
npm run decode -- path/to/preset.prst   # print a decoded preset
npm run convert -- path/to/preset.prst  # print the ampero mini setting guide
npm run report:mapping                  # list params each curated mapping can't carry over
npm run build                           # static site in dist/
```

Real presets for regression tests go in `fixtures/private/` (gitignored).

## Deploy

`.github/workflows/deploy.yml` tests, builds and publishes `dist/` to GitHub Pages on every push to `main`.
Once the repo is on GitHub, enable it under **Settings → Pages → Source: GitHub Actions**.
The build uses relative paths, so it also works on any other static host.

## Credits & license

GP-200 file format notes and effect tables (`src/core/vendor/gp200/`) come from
[Preset Forge](https://github.com/phash/gp200editor) by phash, licensed GPL-3.0.
Patchlingo is therefore licensed under the GNU GPL v3 or later — see [LICENSE](LICENSE).
