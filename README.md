# Auto Chess Builds and Counters

A free, static reference site for Auto Chess builds, counters, item notes, positioning, and pivots.

This is set up for GitHub Pages: no backend, no build step, and no monthly hosting bill. GitHub Pages hosts static HTML, CSS, and JavaScript straight from a repository.

## Edit the Data

Build and counter content lives in `data.js`.

Pieces, items, and synergies live in `reference-data.js`. That file is generated from the official Dragonest Chess Wiki and Item Effects pages, with explicit patch overrides for entries changed by recent patches.

The latest patch panel lives in `patch-data.js`. It is generated from the local Steam game cache when available, then falls back to Steam news.

For the full update checklist, see `UPDATE_WORKFLOW.md`.

Each build has:

- `tier`
- `style`
- `difficulty`
- `tags`
- `core`
- `items`
- `positioning`
- `strongInto`
- `weakInto`
- `counterPlan`
- `punishWith`
- `pivots`

The included entries are patch-informed interpretations of official patch notes, not an official tier list. Entries tagged `Reddit` or `Community Meta` are recent community signals added from r/AutoChess posts and should be verified against your own lobby experience.

For a running record of major project changes, see `PROJECT_HISTORY.md`.

## Update for a New Patch

Run this from the repo folder:

```powershell
npm.cmd run update:all
```

Use `npm.cmd` in PowerShell because this Windows setup blocks `npm.ps1` by policy.

That command refreshes generated reference data, refreshes the latest patch panel, audits local game files when available, syntax-checks the site scripts, and writes `PATCH_UPDATE_REPORT.md`.

To specifically compare piece costs against the installed game files:

```powershell
npm.cmd run audit:costs
```

That writes `LOCAL_COST_AUDIT.md` with the local IDs, shop buckets, and confidence level for each matched cost.

The local Auto Chess install is expected at:

```text
D:\Program Files\steamapps\common\Auto Chess
```

To point the updater at a different install:

```powershell
$env:AUTO_CHESS_INSTALL="D:\Program Files\steamapps\common\Auto Chess"
npm.cmd run update:all
```

## Preview Locally

Open `index.html` in your browser.

If you prefer a local web server:

```powershell
python -m http.server 5173
```

Then visit:

```text
http://localhost:5173
```

## Publish Free With GitHub Pages

1. Create a new public GitHub repository, for example `AutoChessCounters`.
2. Push these files to the repository.
3. On GitHub, open the repo settings.
4. Go to **Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select the `dev` branch and `/root`.
7. Save.

Your site will publish at:

```text
https://YOUR-USERNAME.github.io/AutoChessCounters/
```

## First Git Push

Run these from this folder after creating the GitHub repository:

```powershell
git init
git add .
git commit -m "Initial Auto Chess reference site"
git branch -M dev
git remote add origin https://github.com/YOUR-USERNAME/AutoChessCounters.git
git push -u origin dev
```

## Notes

This is an unofficial fan-made reference.
