const fs = require("fs");
const path = require("path");

const DEFAULT_INSTALL = "D:/Program Files/steamapps/common/Auto Chess";

function decodePbName(fileName) {
  const baseName = fileName.replace(/\.dat$/, "");
  try {
    return Buffer.from(baseName, "base64").toString("utf8");
  } catch {
    return "";
  }
}

function dateFromKey(key) {
  const match = key.match(/(20\d{6})/);
  if (!match) {
    return "";
  }

  const raw = match[1];
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function latestPatchCache(installPath) {
  const pbDir = path.join(installPath, "Cache", "Pb");
  if (!fs.existsSync(pbDir)) {
    return null;
  }

  const candidates = fs.readdirSync(pbDir)
    .filter((fileName) => fileName.endsWith(".dat"))
    .map((fileName) => ({
      fileName,
      decodedName: decodePbName(fileName)
    }))
    .filter((entry) => /^gm_(?:zx|tz)_ct_?20\d{6}/.test(entry.decodedName))
    .map((entry) => ({
      ...entry,
      date: dateFromKey(entry.decodedName)
    }))
    .filter((entry) => entry.date)
    .sort((a, b) => b.date.localeCompare(a.date));

  return candidates[0] || null;
}

function gameAssetDate(version) {
  const match = String(version?.asset_version || "").match(/(20\d{2})_(\d{2})_(\d{2})/);
  if (!match) {
    return "";
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
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
    const recordStart = offset;
    const idLength = buffer.readUInt16LE(offset);
    offset += 2;
    if (idLength <= 0 || idLength > 64 || offset + idLength + 4 > buffer.length) {
      throw new Error(`Unexpected record id length ${idLength} at byte ${recordStart}.`);
    }

    const id = readString(idLength);
    const fieldCount = buffer.readUInt32LE(offset);
    offset += 4;
    if (fieldCount > 200) {
      throw new Error(`Unexpected field count ${fieldCount} for record ${id}.`);
    }

    const fields = {};
    for (let index = 0; index < fieldCount; index += 1) {
      const keyLength = buffer.readUInt16LE(offset);
      offset += 2;
      const key = readString(keyLength);
      const valueLength = buffer.readUInt16LE(offset);
      offset += 2;
      const value = readString(valueLength);
      const numericValue = buffer.readDoubleLE(offset);
      offset += 8;
      fields[key] = value;
      fields[`${key}__num`] = numericValue;
    }

    records.push({ id, fields });
  }

  return records;
}

function sampleRecord(record) {
  return {
    id: record.id,
    nameKey: record.fields.Entity_Name || record.fields.Equipment_Name || record.fields.Skill_Name || record.fields.Name || "",
    phoneId: record.fields.phone_chsid || record.fields.phone_Equipid || "",
    star: record.fields.star || "",
    quality: record.fields.quality || record.fields.rare || "",
    hp: record.fields.hp_max || "",
    attack: record.fields.atk_min && record.fields.atk_max ? `${record.fields.atk_min}-${record.fields.atk_max}` : "",
    armor: record.fields.physic_defence || "",
    magicResist: record.fields.magic_defence || "",
    attackRange: record.fields.atk_range || "",
    attackSpeedField: record.fields.ias_min || "",
    descValues: record.fields.Equipment_Desc_Value || ""
  };
}

function main() {
  const installPath = process.env.AUTO_CHESS_INSTALL || DEFAULT_INSTALL;
  const battleConfigDir = path.join(installPath, "ACPhoenix_Data", "StreamingAssets", "Config", "battleConfig");
  const acGameLibPath = path.join(battleConfigDir, "ACGameLib.bin");
  const versionPath = path.join(battleConfigDir, "version.json");

  if (!fs.existsSync(acGameLibPath)) {
    throw new Error(`ACGameLib.bin was not found at ${acGameLibPath}`);
  }

  const version = fs.existsSync(versionPath)
    ? JSON.parse(fs.readFileSync(versionPath, "utf8"))
    : null;
  const records = parseAcGameLib(acGameLibPath);
  const pieceRecords = records.filter((record) =>
    record.fields.phone_chsid &&
    record.fields.Entity_Name &&
    record.fields.star &&
    record.fields.hp_max &&
    record.fields.atk_min &&
    record.fields.atk_max
  );
  const equipmentRecords = records.filter((record) =>
    record.fields.Equipment_Name &&
    record.fields.phone_Equipid
  );
  const skillRecords = records.filter((record) =>
    record.fields.Skill_Name ||
    record.fields.Skill_Desc_Id
  );
  const latestPatch = latestPatchCache(installPath);
  const assetDate = gameAssetDate(version);

  const report = {
    installPath,
    version,
    assetDate,
    latestPatchCache: latestPatch,
    counts: {
      totalRecords: records.length,
      pieceRecords: pieceRecords.length,
      oneStarPieceRecords: pieceRecords.filter((record) => record.fields.star === "1").length,
      equipmentRecords: equipmentRecords.length,
      skillRecords: skillRecords.length
    },
    samples: {
      pieces: pieceRecords.slice(0, 10).map(sampleRecord),
      equipment: equipmentRecords.slice(0, 10).map(sampleRecord)
    },
    note: "ACGameLib.bin contains real local game config records, but hotfix patch notes in Cache/Pb can be newer than the asset table. Use this audit to verify whether local tables are fresh enough before making them the source of truth."
  };

  console.log(JSON.stringify(report, null, 2));

  if (assetDate && latestPatch?.date && latestPatch.date > assetDate) {
    console.warn(`Local patch cache ${latestPatch.date} is newer than asset table ${assetDate}; prefer patch notes for hotfix overrides.`);
  }
}

main();
