# Patchlingo

Translate multi-effects presets between devices. First pair: **Valeton GP-200 (`.prst`) → Hotone Ampero Mini** setting guide.

Status: M2 (mapping) — see [DESIGN.md](DESIGN.md).

## Development

```bash
npm install
npm test                                # unit tests (+ private fixtures when present)
npm run decode -- path/to/preset.prst   # print a decoded preset
npm run convert -- path/to/preset.prst  # print the ampero mini setting guide
npm run report:mapping                  # list params each curated mapping can't carry over
npm run dev                            # web ui (placeholder until M3)
```

Real presets for regression tests go in `fixtures/private/` (gitignored).

## Credits & license

GP-200 file format notes and effect tables (`src/core/vendor/gp200/`) come from
[Preset Forge](https://github.com/phash/gp200editor) by phash, licensed GPL-3.0.
Patchlingo is therefore licensed under the GNU GPL v3 or later — see [LICENSE](LICENSE).
