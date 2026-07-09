# Local Piece Cost Audit

Generated: 2026-07-09T03:47:58.527Z

## Sources

- Local install: `D:/Program Files/steamapps/common/Auto Chess`
- Battle config: `D:\Program Files\steamapps\common\Auto Chess\Cache\GameData\Config\battleConfig`
- Shop roster: `D:\Program Files\steamapps\common\Auto Chess\Cache\GameData\Config\battleConfig\normal.json`
- Piece table: `D:\Program Files\steamapps\common\Auto Chess\Cache\GameData\Config\battleConfig\ACGameLib.bin`
- Localized names: `D:\Program Files\steamapps\common\Auto Chess\ACPhoenix_Data\StreamingAssets\Config\resbin\languageinfo.bin`

## Summary

- Active local shop rows: 96
- Reference pieces: 85
- Matched rows: 45
- Cost mismatches found: 1
- Strong name-based mismatches: 0
- Applied local cost overrides: 12
- Rows still needing manual review: 51

## Applied Overrides

| Piece | Site cost | Local cost | Local ID | Match |
| --- | ---: | ---: | --- | --- |
| Abyssal Guard | 3 | 3 | `120091` / `1020100` | localized-name |
| Argali Knight | 5 | 5 | `130031` / `1028100` | localized-name |
| Bobo | 1 | 1 | `130211` / `1095100` | curated-local-name |
| Desperate Doctor | 1 | 1 | `120021` / `1019100` | localized-name |
| Frost Knight | 2 | 2 | `110101` / `1009100` | localized-name |
| God of War | 1 | 1 | `110131` / `1057100` | curated-local-name |
| Khan | 4 | 4 | `150161` / `1091100` | curated-local-name |
| Penitent Bishop | 1 | 1 | `130271` / `1111100` | curated-local-name |
| Phantom Queen | 5 | 5 | `120071` / `1017100` | localized-name |
| Shining Archer | 1 | 1 | `120141` / `1058100` | curated-local-name |
| Storm Shaman | 5 | 5 | `140101` / `1047100` | localized-name |
| Wind Ranger | 2 | 2 | `130041` / `1030100` | localized-name |

## Strong Mismatches

_None._

## Review-Only Mismatches

| Piece | Site cost | Local cost | Local ID | Match |
| --- | ---: | ---: | --- | --- |
| Rogue Guard | 5 | 4 | `140051` / `1040100` | synergy-stats |

## Notes

- Cost buckets come from `normal.json` `Common.Chess.ChessList`, where buckets `0` through `4` map to 1 through 5 gold.
- `ACGameLib.bin` confirms the same cost through each piece row's `level` field and `rare + 1`.
- Name-based matches are safest. Synergy/stat matches are review-only when the local English name is missing.
- This audit updates cost and rarity only; stat drift is intentionally left for a separate pass.
