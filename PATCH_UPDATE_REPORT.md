# Auto Chess Patch Update Report

Generated: 2026-07-09T03:47:58.778Z

## Summary

- Latest patch: 6.25 ONLINE UPDATE (2026-06-25 (Local Steam game cache))
- Patch source: [Local Steam game cache](https://store.steampowered.com/news/app/1530300)
- Reference records: 85 pieces, 66 items, 34 synergies
- Local install checked: `D:/Program Files/steamapps/common/Auto Chess`
- Local asset table date: 2026-05-14
- Newest local patch cache date: 2026-06-25
- Freshness read: Local patch cache is newer than the asset table; keep hotfix patch notes as overrides.
- Piece cost audit: 12 local overrides applied, 0 strong name-based mismatches, 51 rows still needing manual review.

## Command Results

| Step | Command | Result |
| --- | --- | --- |
| Update reference data | `C:\Program Files\nodejs\node.exe scripts/update-reference-data.js` | Passed |
| Update patch data | `C:\Program Files\nodejs\node.exe scripts/update-patch-data.js` | Passed |
| Audit local game data | `C:\Program Files\nodejs\node.exe scripts/audit-local-game-data.js` | Passed |
| Audit piece costs | `C:\Program Files\nodejs\node.exe scripts/audit-piece-costs.js` | Passed |
| Syntax check update workflow | `C:\Program Files\nodejs\node.exe --check scripts/update-site.js` | Passed |
| Syntax check static scripts | `C:\Program Files\nodejs\node.exe --check app.js` | Passed |
| Syntax check build data | `C:\Program Files\nodejs\node.exe --check data.js` | Passed |
| Syntax check reference data | `C:\Program Files\nodejs\node.exe --check reference-data.js` | Passed |
| Syntax check patch data | `C:\Program Files\nodejs\node.exe --check patch-data.js` | Passed |

## Local Audit

- Parsed 10835 local config records, including 685 piece records, 925 equipment records, and 1593 skill records.
- Audit warning: Local patch cache 2026-06-25 is newer than asset table 2026-05-14; prefer patch notes for hotfix overrides.

## Piece Cost Audit

- Matched 45 local rows against 85 reference pieces.
- Applied overrides: Abyssal Guard -> 3, Argali Knight -> 5, Bobo -> 1, Desperate Doctor -> 1, Frost Knight -> 2, God of War -> 1, Khan -> 4, Penitent Bishop -> 1, Phantom Queen -> 5, Shining Archer -> 1, Storm Shaman -> 5, Wind Ranger -> 2.
- Cost audit note: None.
- See `LOCAL_COST_AUDIT.md` for the full local-ID comparison.

## Manual Review Checklist

- Open the site and check the Patch Review tab.
- Review affected pieces, items, and synergies for stale Dragonest data.
- Update `data.js` if the patch changes build strength, counter plans, or item priorities.
- Run the Counter Advisor against common ladder comps and adjust confidence/counter rules if the recommendations feel off.
- Commit and push the regenerated files to publish through GitHub Pages.
