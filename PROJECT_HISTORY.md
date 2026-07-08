# Auto Chess Counters Project History

This file records the meaningful changes made to the site so we can look back later and understand why the project is shaped this way.

## July 8, 2026

### Counter advisor

- Added a top-level `Counter Advisor` tab for in-game enemy synergy selection.
- Added Class and Race checkbox groups sourced from the reference synergy data.
- Added a rule-based counter engine so any combination of selected synergies can produce ranked build recommendations.
- Added threat profile summary tiles, detailed counter explanation cards, and per-synergy breakdown cards.
- Added `Open Build` actions from counter recommendations into the full build detail view.
- Added specific combo handling for common paired threats such as `Knight + Mage`, `Dragon + Mage`, `Hunter + Dwarf`, `Insectoid + Civet`, and `Cave + Divinity`.
- Added per-synergy level selectors so checked synergies can be evaluated at their current breakpoint, such as `Knight 2/4/6` or `Mage 3/6/9`.
- Added a game-stage toggle for `Early`, `Mid`, `Late`, and `Final` so recommendation scoring can favor tempo, stable mid-game counters, late-board tech, or final-opponent positioning.
- Updated counter explanations to include the selected synergy breakpoint text and stage-specific reasoning.
- Added rule-based positioning templates and piece buy plans to Counter Advisor recommendations, using selected enemy synergies, build cores, reference-piece costs, and matchup tech rules.
- Added advisor confidence scoring so recommendations show whether they are strongly supported by direct matchup rules, exact combo rules, trait matches, selected-synergy coverage, and stage fit.
- Added seven more sourced counter builds from recent/community meta signals: `God Thunder Mage`, `Insectoid Doom Arbiter`, `Watcher Sand Doom`, `6 Glacier 4 Warlock`, `Goblin Ancestor Warlock`, `Dragon Witcher Rogue`, and `Marine Assassin`.
- Expanded Counter Advisor direct synergy scores and exact combo rules so the new builds appear for matchups such as `Mage + Divinity`, `Dragon + Mage`, `Insectoid + Civet`, `Goblin + Warlock`, `Glacier + Warlock`, and `Dragon + Witcher`.
- Added another seven sourced counter templates: `9 Feathered Wizard`, `9 Assassin Horn`, `9 Warrior Rogue Guard`, `Divinity Warlock`, `9 Egersis Pact`, `Shaman Mage Horn`, and `Human Knight Marine`.
- Added advisor support for those builds, including exact rules for `Human + Mage`, `Feathered + Wizard`, `Greater + Warrior`, `Shaman + Mage`, and `Warrior + Horn`.

### Patch review dashboard

- Added a top-level `Patch Review` tab.
- Moved the `Latest official patch` notes panel from `Builds & Counters` into the `Patch Review` tab so patch content lives with the review workflow.
- Added dashboard summary tiles for the active patch, section count, patch line count, affected reference records, and high-priority build reviews.
- Added an affected-reference list generated from patch text matched against pieces, items, and synergies.
- Added a build review queue generated from affected references and patch-rule keywords.
- Added `Open Build` and `Open Reference` actions so patch review can jump directly into the existing build and reference views.
- Added section-level checklist cards for Piece, Item, Talent, Battle, Item Alternation, Fixes, and Other patch sections.
- Tightened patch matching to avoid false positives from partial words such as `Mage` inside `damage`.

### Patch update workflow

- Added `package.json` scripts for repeatable updates:
  - `npm.cmd run update:reference`
  - `npm.cmd run update:patch`
  - `npm.cmd run update:all`
  - `npm.cmd run audit:local`
  - `npm.cmd run check`
- Added `scripts/update-reference-data.js` to regenerate the reference library from Dragonest pages plus explicit patch overrides.
- Added `scripts/update-patch-data.js` to regenerate `patch-data.js` from the local Steam game cache, falling back to Steam news.
- Added `scripts/audit-local-game-data.js` to inspect the installed game files at `D:\Program Files\steamapps\common\Auto Chess`.
- Found real local game config in `ACPhoenix_Data\StreamingAssets\Config\battleConfig\ACGameLib.bin`.
- Confirmed the local asset table is useful for verification, but its `version.json` asset date is `2026-05-14` while the newest local patch cache is `2026-06-25`, so hotfix notes should override stale asset data.
- Added `patch-data.js` so the patch panel can update independently from hand-written build notes.
- Added June 25, 2026 overrides for Soul Breaker, Skull Hunter, Dwarf Sniper, Sorcerous Chain, Magic Mirror, Kira Imprint, Bloodbath Skull, Broken Sword, and Crystal Sword.
- Audited Priest and Witcher breakpoints against official sources. Priest stayed `1/2/3` because the current Dragonest wiki payload and the official Priest(3) update support that. Witcher was overridden to `2/4` because the official Dragonest 3.13 maintenance note lists `Witcher[2]` and `Witcher[4]`, while the live wiki payload still shows older `1/2` text.
- Corrected Taboo Witcher from stale wiki `Common / 1` data to `Epic / 4` using the official App Store v2.31.2 release note and local May 2026 asset-table stats.
- Replaced `update:all` with a one-command patch-day workflow that regenerates data, audits local game files, syntax-checks generated scripts, and writes `PATCH_UPDATE_REPORT.md`.

### Top-level navigation

- Moved the reference library out of the bottom of the build page.
- Added top tabs for `Builds & Counters` and `Reference Library`.
- Kept the Pieces / Items / Synergies tabs inside the Reference Library view.

### Reference images

- Added official Dragonest images to reference cards:
  - Piece card art/icons from the Chess Wiki.
  - Item icons from Item Effects.
  - Race and class icons from the Chess Wiki.
- Added fallback badges for patch-only entries that do not yet have official Dragonest image records.

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
- Treat `reference-data.js` and `patch-data.js` as generated files.
- After changes, run:

```powershell
npm.cmd run update:all
```

- Publish updates with:

```powershell
git add .
git commit -m "Update Auto Chess reference"
git push
```
