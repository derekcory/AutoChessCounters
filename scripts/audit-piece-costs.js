const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {
  LOCAL_COST_OVERRIDES,
  LOCAL_NAME_ALIASES,
  qualityForCost
} = require("./local-cost-overrides");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_INSTALL = "D:/Program Files/steamapps/common/Auto Chess";
const REPORT_PATH = path.join(ROOT, "LOCAL_COST_AUDIT.md");

const LOCAL_TYPE_MAP = {
  "341025": "Watcher",
  Ancestors: "Ancestor",
  Beast: "Beast",
  Cats: "Civet",
  Chong: "Insectoid",
  Craftsman: "Mech",
  DemonHunter: "Witcher",
  Devil: "Demon",
  Dragon: "Dragon",
  Druids: "Druid",
  Dwarf: "Dwarf",
  Element: "Spirits",
  Elves: "Feathered",
  Goblin: "Goblin",
  God: "Divinity",
  Horn: "Horn",
  Human: "Human",
  Hunter: "Hunter",
  Knight: "Knight",
  Mage: "Mage",
  MuShi: "Priest",
  Naga: "Marine",
  Noface: "Greater",
  Ogre: "Kira",
  Orcs: "Cave",
  Sartre: "Night Demon",
  Shaman: "Shaman",
  Troll: "Glacier",
  Warlock: "Warlock",
  Warrior: "Warrior",
  WuShi: "Wizard"
};

const IGNORED_LOCAL_TYPES = new Set(["0", "Orcish", "Panda", "342015"]);
const STRONG_METHODS = new Set(["localized-name", "curated-local-name"]);

function readVarint(buffer, offset) {
  let result = 0n;
  let shift = 0n;
  let position = offset;

  while (position < buffer.length) {
    const byte = buffer[position];
    position += 1;
    result |= BigInt(byte & 0x7f) << shift;
    if (!(byte & 0x80)) {
      return { value: Number(result), offset: position };
    }
    shift += 7n;
  }

  throw new Error("Unexpected EOF while reading protobuf varint.");
}

function decodeLengthDelimitedRecords(filePath) {
  const buffer = fs.readFileSync(filePath);
  const records = [];
  let offset = 0;

  while (offset < buffer.length) {
    const key = readVarint(buffer, offset);
    offset = key.offset;
    const wire = key.value & 7;
    if (wire !== 2) {
      break;
    }

    const length = readVarint(buffer, offset);
    offset = length.offset;
    const end = offset + length.value;
    const fields = [];
    let position = offset;

    while (position < end) {
      const fieldKey = readVarint(buffer, position);
      position = fieldKey.offset;
      const field = fieldKey.value >> 3;
      const fieldWire = fieldKey.value & 7;

      if (fieldWire === 0) {
        const value = readVarint(buffer, position);
        position = value.offset;
        fields.push({ field, value: value.value });
      } else if (fieldWire === 2) {
        const fieldLength = readVarint(buffer, position);
        position = fieldLength.offset;
        fields.push({
          field,
          string: buffer.subarray(position, position + fieldLength.value).toString("utf8")
        });
        position += fieldLength.value;
      } else if (fieldWire === 1) {
        position += 8;
      } else if (fieldWire === 5) {
        position += 4;
      } else {
        break;
      }
    }

    records.push(fields);
    offset = end;
  }

  return records;
}

function parseAcGameLib(filePath) {
  const buffer = fs.readFileSync(filePath);
  const records = [];
  let offset = 4;

  function readString(length) {
    const value = buffer.subarray(offset, offset + length).toString("utf8");
    offset += length;
    return value;
  }

  while (offset < buffer.length - 8) {
    const idLength = buffer.readUInt16LE(offset);
    offset += 2;
    if (idLength <= 0 || idLength > 64 || offset + idLength + 4 > buffer.length) {
      break;
    }

    const id = readString(idLength);
    const fieldCount = buffer.readUInt32LE(offset);
    offset += 4;
    if (fieldCount > 200) {
      break;
    }

    const fields = {};
    for (let index = 0; index < fieldCount; index += 1) {
      const keyLength = buffer.readUInt16LE(offset);
      offset += 2;
      const key = readString(keyLength);
      const valueLength = buffer.readUInt16LE(offset);
      offset += 2;
      const value = readString(valueLength);
      offset += 8;
      fields[key] = value;
    }

    records.push({ id, fields });
  }

  return records;
}

function loadWindowData(fileName, key) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, fileName), "utf8"), context, { timeout: 5000 });
  return context.window[key];
}

function battleConfigDir(installPath) {
  const cached = path.join(installPath, "Cache", "GameData", "Config", "battleConfig");
  if (fs.existsSync(path.join(cached, "ACGameLib.bin")) && fs.existsSync(path.join(cached, "normal.json"))) {
    return cached;
  }

  return path.join(installPath, "ACPhoenix_Data", "StreamingAssets", "Config", "battleConfig");
}

function languageInfoPath(installPath) {
  const packaged = path.join(installPath, "ACPhoenix_Data", "StreamingAssets", "Config", "resbin", "languageinfo.bin");
  if (fs.existsSync(packaged)) {
    return packaged;
  }

  return path.join(installPath, "Cache", "GameData", "Config", "resbin", "languageinfo.bin");
}

function numberList(value) {
  return String(value ?? "").match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
}

function firstNumber(value) {
  const values = numberList(value);
  return values.length ? values[0] : null;
}

function attackRange(value) {
  const values = numberList(value);
  if (!values.length) {
    return [null, null];
  }
  return [values[0], values[1] ?? values[0]];
}

function referenceStats(piece) {
  const [attackMin, attackMax] = attackRange(piece.attack);
  let range = firstNumber(piece.range);
  if (range != null && range <= 10) {
    range *= 160;
  }

  return {
    hp: firstNumber(piece.hp),
    attackMin,
    attackMax,
    armor: firstNumber(piece.armor) || 0,
    magicResist: firstNumber(piece.magicResist) || 0,
    range
  };
}

function localStats(fields) {
  return {
    hp: firstNumber(fields.hp_max),
    attackMin: firstNumber(fields.atk_min),
    attackMax: firstNumber(fields.atk_max),
    armor: firstNumber(fields.physic_defence) || 0,
    magicResist: firstNumber(fields.magic_defence) || 0,
    range: firstNumber(fields.atk_range)
  };
}

function statScore(reference, local) {
  let score = 0;
  let compared = 0;

  for (const key of ["hp", "attackMin", "attackMax", "armor", "magicResist", "range"]) {
    if (reference[key] == null || local[key] == null) {
      continue;
    }

    compared += 1;
    const diff = Math.abs(reference[key] - local[key]);
    if (diff < 0.0001) {
      score += 2;
    } else if (key === "range" && diff <= 185) {
      score += 1;
    } else if (key === "hp" && diff <= 50) {
      score += 1;
    }
  }

  return { score, compared };
}

function normalizedName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizedType(value) {
  return LOCAL_TYPE_MAP[value] || value;
}

function setKey(values) {
  return [...new Set(values
    .filter(Boolean)
    .map(normalizedType)
    .filter((value) => value && !IGNORED_LOCAL_TYPES.has(value)))]
    .sort()
    .join("|");
}

function buildChineseNameMap(installPath) {
  const filePath = languageInfoPath(installPath);
  if (!fs.existsSync(filePath)) {
    return { filePath, map: new Map() };
  }

  const map = new Map();
  for (const record of decodeLengthDelimitedRecords(filePath)) {
    const key = record.find((field) => field.field === 1)?.string;
    if (!key?.startsWith("GM_item_headicon_")) {
      continue;
    }

    const values = record.filter((field) => field.field === 2).map((field) => field.string);
    const chinese = values[0];
    const english = values[1];
    if (chinese && english && english !== "0") {
      map.set(chinese, english);
    }
  }

  return { filePath, map };
}

function buildLocalRows({ records, normal }) {
  const costById = new Map();
  for (const [bucket, ids] of Object.entries(normal.Common.Chess.ChessList)) {
    for (const id of ids) {
      costById.set(String(id), Number(bucket) + 1);
    }
  }

  const skillTypeById = new Map(records
    .filter((record) => record.fields.race_or_pro_type)
    .map((record) => [record.id, record.fields.race_or_pro_type]));

  const rows = records
    .filter((record) => costById.has(record.id) && record.fields.star === "1")
    .map((record) => {
      const races = [record.fields.raceskill1_id, record.fields.raceskill2_id]
        .filter((id) => id && id !== "0")
        .map((id) => skillTypeById.get(id) || id);
      const classes = [record.fields.proskill_id]
        .filter((id) => id && id !== "0")
        .map((id) => skillTypeById.get(id) || id);

      return {
        id: record.id,
        phoneId: record.fields.phone_chsid || "",
        entityName: record.fields.Entity_Name || "",
        chineseName: record.fields.Name || "",
        cost: costById.get(record.id),
        level: Number(record.fields.level),
        rare: Number(record.fields.rare),
        races,
        classes,
        raceKey: setKey(races),
        classKey: setKey(classes),
        stats: localStats(record.fields)
      };
    });

  return { costById, rows };
}

function matchRows({ reference, rows, chineseNameMap }) {
  const referenceRows = reference.pieces.map((piece) => ({
    ...piece,
    stats: referenceStats(piece),
    raceKey: setKey(piece.races || []),
    classKey: setKey(Array.isArray(piece.classes) ? piece.classes : [piece.classes])
  }));
  const referenceByName = new Map(referenceRows.map((piece) => [normalizedName(piece.name), piece]));
  const overrideByName = new Map(LOCAL_COST_OVERRIDES.map((entry) => [entry.name, entry]));
  const matches = [];
  const uncertain = [];

  for (const local of rows) {
    const translatedName = local.chineseName ? chineseNameMap.get(local.chineseName) : "";
    const aliasedTranslatedName = LOCAL_NAME_ALIASES[translatedName] || translatedName;
    const curatedAlias = LOCAL_NAME_ALIASES[local.chineseName] || "";
    let method = "";
    let piece = null;

    if (aliasedTranslatedName) {
      piece = referenceByName.get(normalizedName(aliasedTranslatedName));
      method = "localized-name";
    }

    if (!piece && curatedAlias) {
      piece = referenceByName.get(normalizedName(curatedAlias));
      method = "curated-local-name";
    }

    if (!piece) {
      const candidates = referenceRows
        .filter((candidate) => candidate.raceKey === local.raceKey && candidate.classKey === local.classKey)
        .map((candidate) => ({ ...candidate, ...statScore(candidate.stats, local.stats) }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      const top = candidates[0];
      const second = candidates[1];

      if (top && top.score >= 6 && (!second || top.score - second.score >= 2)) {
        piece = top;
        method = "synergy-stats";
      } else {
        uncertain.push({
          local,
          candidates: candidates.slice(0, 5).map((candidate) => ({
            name: candidate.name,
            cost: Number(candidate.cost),
            score: candidate.score,
            raceKey: candidate.raceKey,
            classKey: candidate.classKey
          }))
        });
        continue;
      }
    }

    const score = statScore(piece.stats, local.stats);
    matches.push({
      name: piece.name,
      refCost: Number(piece.cost),
      localCost: local.cost,
      local,
      method,
      score: score.score,
      compared: score.compared,
      appliedOverride: overrideByName.has(piece.name)
    });
  }

  const mismatches = matches
    .filter((match) => match.refCost !== match.localCost)
    .sort((a, b) => a.name.localeCompare(b.name));
  const strongMismatches = mismatches.filter((match) => STRONG_METHODS.has(match.method));
  const appliedOverrides = matches
    .filter((match) => match.appliedOverride)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { appliedOverrides, matches, mismatches, strongMismatches, uncertain };
}

function markdownTable(rows) {
  if (!rows.length) {
    return "_None._";
  }

  return [
    "| Piece | Site cost | Local cost | Local ID | Match |",
    "| --- | ---: | ---: | --- | --- |",
    ...rows.map((row) => `| ${row.name} | ${row.refCost} | ${row.localCost} | \`${row.local.id}\` / \`${row.local.phoneId}\` | ${row.method} |`)
  ].join("\n");
}

function writeReport({ installPath, battleDir, acGameLibPath, normalPath, languagePath, result, generatedAt }) {
  const lines = [
    "# Local Piece Cost Audit",
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Sources",
    "",
    `- Local install: \`${installPath}\``,
    `- Battle config: \`${battleDir}\``,
    `- Shop roster: \`${normalPath}\``,
    `- Piece table: \`${acGameLibPath}\``,
    `- Localized names: \`${languagePath}\``,
    "",
    "## Summary",
    "",
    `- Active local shop rows: ${result.counts.localActive}`,
    `- Reference pieces: ${result.counts.referencePieces}`,
    `- Matched rows: ${result.counts.matched}`,
    `- Cost mismatches found: ${result.counts.mismatches}`,
    `- Strong name-based mismatches: ${result.counts.strongMismatches}`,
    `- Applied local cost overrides: ${result.counts.appliedOverrides}`,
    `- Rows still needing manual review: ${result.counts.uncertain}`,
    "",
    "## Applied Overrides",
    "",
    markdownTable(result.appliedOverrides),
    "",
    "## Strong Mismatches",
    "",
    markdownTable(result.strongMismatches),
    "",
    "## Review-Only Mismatches",
    "",
    markdownTable(result.mismatches.filter((match) => !STRONG_METHODS.has(match.method))),
    "",
    "## Notes",
    "",
    "- Cost buckets come from `normal.json` `Common.Chess.ChessList`, where buckets `0` through `4` map to 1 through 5 gold.",
    "- `ACGameLib.bin` confirms the same cost through each piece row's `level` field and `rare + 1`.",
    "- Name-based matches are safest. Synergy/stat matches are review-only when the local English name is missing.",
    "- This audit updates cost and rarity only; stat drift is intentionally left for a separate pass.",
    ""
  ];

  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
}

function main() {
  const installPath = process.env.AUTO_CHESS_INSTALL || DEFAULT_INSTALL;
  const battleDir = battleConfigDir(installPath);
  const acGameLibPath = path.join(battleDir, "ACGameLib.bin");
  const normalPath = path.join(battleDir, "normal.json");

  if (!fs.existsSync(acGameLibPath)) {
    throw new Error(`ACGameLib.bin was not found at ${acGameLibPath}`);
  }
  if (!fs.existsSync(normalPath)) {
    throw new Error(`normal.json was not found at ${normalPath}`);
  }

  const records = parseAcGameLib(acGameLibPath);
  const normal = JSON.parse(fs.readFileSync(normalPath, "utf8"));
  const reference = loadWindowData("reference-data.js", "AUTO_CHESS_REFERENCE");
  const { filePath: languagePath, map: chineseNameMap } = buildChineseNameMap(installPath);
  const { costById, rows } = buildLocalRows({ records, normal });
  const matchResult = matchRows({ reference, rows, chineseNameMap });
  const generatedAt = new Date().toISOString();
  const result = {
    generatedAt,
    installPath,
    source: {
      battleDir,
      acGameLibPath,
      normalPath,
      languagePath,
      normalLastWrite: fs.statSync(normalPath).mtime.toISOString(),
      acGameLibLastWrite: fs.statSync(acGameLibPath).mtime.toISOString()
    },
    counts: {
      localActive: costById.size,
      referencePieces: reference.pieces.length,
      matched: matchResult.matches.length,
      mismatches: matchResult.mismatches.length,
      strongMismatches: matchResult.strongMismatches.length,
      appliedOverrides: matchResult.appliedOverrides.length,
      uncertain: matchResult.uncertain.length
    },
    appliedOverrides: matchResult.appliedOverrides.map((match) => ({
      name: match.name,
      refCost: match.refCost,
      localCost: match.localCost,
      quality: qualityForCost(match.localCost),
      localId: match.local.id,
      localPhoneId: match.local.phoneId,
      method: match.method
    })),
    strongMismatches: matchResult.strongMismatches.map((match) => ({
      name: match.name,
      refCost: match.refCost,
      localCost: match.localCost,
      quality: qualityForCost(match.localCost),
      localId: match.local.id,
      localPhoneId: match.local.phoneId,
      method: match.method
    })),
    reviewOnlyMismatches: matchResult.mismatches
      .filter((match) => !STRONG_METHODS.has(match.method))
      .map((match) => ({
        name: match.name,
        refCost: match.refCost,
        localCost: match.localCost,
        localId: match.local.id,
        localPhoneId: match.local.phoneId,
        method: match.method,
        score: match.score
      })),
    uncertainSample: matchResult.uncertain.slice(0, 15).map((entry) => ({
      localId: entry.local.id,
      localPhoneId: entry.local.phoneId,
      localCost: entry.local.cost,
      chineseName: entry.local.chineseName,
      raceKey: entry.local.raceKey,
      classKey: entry.local.classKey,
      candidates: entry.candidates
    }))
  };

  writeReport({
    installPath,
    battleDir,
    acGameLibPath,
    normalPath,
    languagePath,
    result: {
      ...matchResult,
      counts: result.counts
    },
    generatedAt
  });

  console.log(JSON.stringify(result, null, 2));
}

main();
