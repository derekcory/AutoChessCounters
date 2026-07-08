# Auto Chess Counters Project History

This file records the meaningful changes made to the site so we can look back later and understand why the project is shaped this way.

## July 8, 2026

### GitHub Pages setup

- Created the Git repository locally on branch `dev`.
- Created the public GitHub repository at `https://github.com/derekcory/AutoChessCounters`.
- Pushed the site to `origin/dev`.
- Set GitHub Pages to publish from branch `dev` and folder `/root`.
- Live site URL: `https://derekcory.github.io/AutoChessCounters/`.

### Reference library expansion

- Added `reference-data.js` as a generated static data file.
- Added a searchable reference section to `index.html` for:
  - Pieces
  - Items
  - Synergies
- Wired the reference section in `app.js` with tabs, filters, cards, source links, and counts.
- Added responsive reference-library styling in `styles.css`.
- Reference data sources:
  - Official Dragonest Chess Wiki: `https://ac.dragonest.com/en/charactor`
  - Official Dragonest Item Effects: `https://ac.dragonest.com/en/equipment`
  - Steam March 2026 patch: `https://store.steampowered.com/news/app/1530300/view/496097685470709756`

### Build and counter content

- Started with a static site for Auto Chess builds and counters.
- Added official-patch-informed builds from the Steam March 25, 2026 / March 26, 2026 UTC+8 maintenance update.
- Added community-tagged builds from recent r/AutoChess posts:
  - Insect Midgame Swarm
  - Knight Cannon Granny
  - Cave Divinity Mountain
  - 6 Beast Shining Assassin
- Added source links for community-sourced builds so they are clearly separated from official patch data.

## Maintenance Notes

- Edit build recommendations in `data.js`.
- Treat `reference-data.js` as generated reference data from official sources plus explicit patch overrides.
- After changes, run:

```powershell
node --check app.js
node --check data.js
node --check reference-data.js
```

- Publish updates with:

```powershell
git add .
git commit -m "Update Auto Chess reference"
git push
```
