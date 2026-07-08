# Auto Chess Builds and Counters

A free, static reference site for Auto Chess builds, counters, item notes, positioning, and pivots.

This is set up for GitHub Pages: no backend, no build step, and no monthly hosting bill. GitHub Pages hosts static HTML, CSS, and JavaScript straight from a repository.

## Edit the Data

Build and counter content lives in `data.js`.

Pieces, items, and synergies live in `reference-data.js`. That file is generated from the official Dragonest Chess Wiki and Item Effects pages, with explicit patch overrides from the March 2026 Steam update.

The current patch data is based on the official Auto Chess Steam news post **MAINTENANCE on 26th March**, shown on Steam as the March 25, 2026 update:

```text
https://store.steampowered.com/news/app/1530300/view/496097685470709756
```

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
6. Select the `main` branch and `/root`.
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
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/AutoChessCounters.git
git push -u origin main
```

## Notes

This is an unofficial fan-made reference. It does not use official game art or logos.
