# Auto Chess Patch Update Workflow

Use this when a new Auto Chess patch drops.

## Quick Update

From this repo folder:

```powershell
npm.cmd run update:all
git status --short
git add .
git commit -m "Update Auto Chess patch data"
git push
```

GitHub Pages publishes from the `dev` branch.

`npm.cmd run update:all` is the main patch-day command. It refreshes generated reference data, refreshes the latest patch panel, audits the local game files when available, syntax-checks the site scripts, and writes `PATCH_UPDATE_REPORT.md`.

## What the Scripts Do

- `update:reference` regenerates `reference-data.js` from official Dragonest piece/item/synergy pages, then applies explicit patch overrides.
- `update:patch` regenerates `patch-data.js` from the local Steam cache at `D:\Program Files\steamapps\common\Auto Chess\Cache\Pb`. If that cache is unavailable, it falls back to Steam news.
- `update:data` runs only the reference and patch data generators.
- `update:all` runs the full patch-day workflow and writes `PATCH_UPDATE_REPORT.md`.
- `audit:local` parses `ACGameLib.bin` from the local install and reports real local game config counts, sample piece records, sample equipment records, local asset version, and newest cached patch date.
- `audit:costs` compares reference-library piece costs against the local normal-mode shop buckets in `normal.json` and writes `LOCAL_COST_AUDIT.md`.
- `check` syntax-checks the static JavaScript files.

## Local Game Data Notes

The install contains real game config at:

```text
D:\Program Files\steamapps\common\Auto Chess\ACPhoenix_Data\StreamingAssets\Config\battleConfig\ACGameLib.bin
```

That file can be parsed into records with piece stats, equipment values, skills, and internal IDs. It is useful for verification, but do not assume it is always the freshest source. On July 8, 2026, the local asset table reported `2026-05-14`, while the local patch cache contained the newer `2026-06-25` update. For hotfixes, patch notes can be newer than the packaged asset table.

For piece costs, prefer the local cached `Cache\GameData\Config\battleConfig\normal.json` when it exists. Its `Common.Chess.ChessList` buckets `0` through `4` map directly to 1 through 5 gold, and matching `ACGameLib.bin` piece rows confirm the same cost through `level` and `rare + 1`.

## When Manual Edits Are Still Needed

The updater can refresh factual reference data and the latest patch panel. Build rankings, counters, tier placement, and meta advice in `data.js` still need human judgment after reading the patch and community discussion.

After `npm.cmd run update:all`, open `PATCH_UPDATE_REPORT.md` first. It summarizes the patch source, reference counts, local data freshness, and manual review checklist for the patch.
