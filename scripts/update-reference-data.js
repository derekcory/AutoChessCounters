const fs = require("fs");
const vm = require("vm");

const SOURCES = {
  pieces: "https://ac.dragonest.com/en/charactor",
  items: "https://ac.dragonest.com/en/equipment",
  patch: "https://store.steampowered.com/news/app/1530300/view/496097685470709756",
  latestPatch: "https://store.steampowered.com/news/app/1530300"
};

function clean(value) {
  if (Array.isArray(value)) {
    return value.map(clean).filter(Boolean);
  }

  if (value == null) {
    return "";
  }

  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .replace(/^0$/, "");
}

function fullUrl(value) {
  const url = clean(value);
  if (!url) {
    return "";
  }
  if (url.startsWith("//")) {
    return `https:${url}`;
  }
  if (url.startsWith("/")) {
    return `https://ac.dragonest.com${url}`;
  }
  return url;
}

function slug(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return value ? [value] : [];
}

async function getNuxtData(url) {
  const html = await (await fetch(url)).text();
  const match = html.match(/__NUXT__=(.*?);<\/script>/s);
  if (!match) {
    throw new Error(`No Nuxt payload found for ${url}`);
  }

  const context = {};
  vm.createContext(context);
  vm.runInContext(`var __NUXT__ = ${match[1]}`, context, { timeout: 5000 });
  return context.__NUXT__.data[0].prop;
}

function normalizePiece(record) {
  const fields = record.fields_data;
  const name = clean(fields.name);
  return {
    id: slug(name),
    name,
    title: clean(fields.chessTitle),
    cost: Number(clean(fields.cardExpend)) || clean(fields.cardExpend),
    quality: clean(fields.cardQuality)[0] || "",
    races: clean(fields.category),
    classes: clean(fields.cardType),
    hp: clean(fields.lifeValue),
    attack: clean(fields.attackPower),
    armor: clean(fields.armor),
    attackSpeed: clean(fields.attackSpeed),
    range: clean(fields.attackDistance),
    magicResist: clean(fields.magicResistance),
    abilityName: clean(fields.skillName),
    ability: clean(fields.onestarChessSkill),
    sourceUrl: `${SOURCES.pieces}/detail/${record.resource_code}`,
    source: "Official Dragonest Chess Wiki",
    imageUrl: fullUrl(fields.cardImg || fields.icon),
    thumbnailUrl: fullUrl(fields.icon || fields.cardImg)
  };
}

function applyPieceOverride(pieces, name, patch, source = { url: SOURCES.patch, label: "Steam March 2026 patch override" }) {
  const piece = pieces.find((entry) => entry.name === name);
  if (!piece) {
    return;
  }

  Object.assign(piece, patch, {
    patchSourceUrl: source.url,
    source: `${piece.source}; ${source.label}`
  });
}

function normalizeItem(record) {
  const fields = record.fields_data;
  const name = clean(fields.name);
  return {
    id: slug(name),
    name,
    quality: clean(fields.equipmentQuality)[0] || "Unlisted",
    categories: clean(fields.ItemsSort),
    attributes: clean(fields.equipmentAttribute),
    effect: clean(fields.equipmentEffect),
    recipe: clean(fields.syntheticMethod),
    sourceUrl: SOURCES.items,
    source: "Official Dragonest Item Effects",
    imageUrl: fullUrl(fields.equipmentIcon)
  };
}

function normalizeSynergy(record, type) {
  const fields = record.fields_data;
  const name = clean(fields.name);
  return {
    id: slug(`${type}-${name}`),
    name,
    type,
    abilityName: clean(fields.skillName),
    pieces: clean(fields.chessList),
    effect: clean(type === "Race" ? fields.racialSkills : fields.careerEffect),
    sourceUrl: SOURCES.pieces,
    source: "Official Dragonest Chess Wiki",
    imageUrl: fullUrl(type === "Race" ? fields.ethnicIcon : fields.careerIcon)
  };
}

async function main() {
  const characterProp = await getNuxtData(SOURCES.pieces);
  const equipmentProp = await getNuxtData(SOURCES.items);
  const characterData = characterProp.charactorData;
  const equipmentData = equipmentProp.equipmentData;

  const pieces = characterData.chessInformation.list.map(normalizePiece);
  applyPieceOverride(pieces, "Unknown Horror", {
    races: Array.from(new Set([...(pieces.find((entry) => entry.name === "Unknown Horror")?.races || []), "Greater"])),
    patchNote: "March 2026 patch added the Greater synergy to Unknown Horror."
  });
  applyPieceOverride(pieces, "Khan", {
    cost: 3,
    quality: "Rare",
    hp: "900 / 1800 / 3100",
    attackSpeed: "1.5",
    patchNote: "March 2026 patch changed Khan from Legendary to Rare and reduced its damage profile."
  });
  applyPieceOverride(pieces, "Ogre Mage", {
    cost: 3,
    quality: "Rare",
    hp: "950 / 1900 / 3800",
    attack: "55-75 / 110-150 / 220-300",
    magicResist: "20%",
    ability: "Grants nearby allies a chance to cast abilities an additional time and gain Rage, increasing ATK Speed. Trigger chance: 30% / 35% / 40%. ATK Speed increase: 20% / 30% / 40%. Rage duration: 10 seconds.",
    patchNote: "March 2026 patch reworked Ogre Mage from Common filler into a Rare aura piece."
  });
  applyPieceOverride(pieces, "Strange Egg", {
    hp: "700 / 1400 / 2800",
    armor: "5",
    magicResist: "30%",
    ability: "Battlecry: links with nearby allies, granting damage reduction. Linked units periodically share a percentage of their current HP. A new 3-star form was added in the March 2026 patch.",
    patchNote: "March 2026 patch added a 3-star form and damage-sharing Battlecry behavior."
  });
  for (const name of ["Dragon Knight", "Rogue Guard", "Shining Assassin"]) {
    applyPieceOverride(pieces, name, {
      patchNote: "March 2026 patch makes this piece's splash damage count as skill damage."
    });
  }
  const latestPatchSource = { url: SOURCES.latestPatch, label: "Local Steam cache June 2026 patch override" };
  applyPieceOverride(pieces, "Soul Breaker", {
    ability: "Hurls a shuriken at the enemy unit with the lowest HP, dealing magical damage and stunning them. Damage scales by star level: 300 / 500 / 700.",
    patchNote: "June 25, 2026 patch retargeted Paralysis Shuriken from a random enemy to the enemy with the lowest HP."
  }, latestPatchSource);
  applyPieceOverride(pieces, "Skull Hunter", {
    attack: "65-75 / 130-150 / 260-300",
    patchNote: "June 25, 2026 patch increased Skull Hunter ATK from 60-70 / 120-140 / 240-280."
  }, latestPatchSource);
  applyPieceOverride(pieces, "Dwarf Sniper", {
    attack: "60-70 / 120-140 / 240-280",
    patchNote: "June 25, 2026 patch reduced Dwarf Sniper ATK from 65-75 / 130-150 / 260-300."
  }, latestPatchSource);
  if (!pieces.some((piece) => piece.name === "Ronin-Nue")) {
    pieces.push({
      id: "ronin-nue",
      name: "Ronin-Nue",
      title: "",
      cost: 3,
      quality: "Rare",
      races: ["Watcher"],
      classes: ["Assassin"],
      hp: "650 / 1300 / 2600",
      attack: "60-100 / 120-200 / 240-400",
      armor: "6",
      attackSpeed: "1.1",
      range: "160",
      magicResist: "10%",
      abilityName: "Ronin",
      ability: "Attacks the target, stunning it and dealing base physical damage plus physical damage based on the target's max HP. Damage happens in two stages and applies a base attack each time.",
      sourceUrl: SOURCES.patch,
      source: "Steam March 2026 patch",
      patchNote: "New Rare Watcher/Assassin piece added in the March 2026 patch.",
      imageUrl: "",
      thumbnailUrl: ""
    });
  }
  pieces.sort((a, b) => Number(a.cost) - Number(b.cost) || a.name.localeCompare(b.name));

  const officialItems = equipmentData.recommendedEquipment.list.map(normalizeItem);
  const patchItems = [
    {
      id: "magicka-pendant",
      name: "Magicka Pendant",
      quality: "Uncommon",
      categories: ["Magic"],
      attributes: "",
      effect: "Unique Passive: damage dealt by the equipped piece is converted to Magic damage.",
      recipe: "",
      sourceUrl: SOURCES.patch,
      source: "Steam March 2026 patch",
      imageUrl: ""
    },
    {
      id: "divine-gift",
      name: "Divine Gift",
      quality: "Treasure",
      categories: ["Consumables"],
      attributes: "",
      effect: "Gain all Talents in the game. For selected Talent tiers, all other Talents of the same tier are automatically unlocked; for future tiers, choosing either Talent unlocks both.",
      recipe: "",
      sourceUrl: SOURCES.patch,
      source: "Steam March 2026 patch",
      imageUrl: ""
    },
    {
      id: "four-leaf-clover",
      name: "Four-Leaf Clover",
      quality: "Common",
      categories: ["Utility"],
      attributes: "",
      effect: "After the March 2026 adjustment, Feathered and Assassin synergy effects can benefit from item bonuses.",
      recipe: "",
      sourceUrl: SOURCES.patch,
      source: "Steam March 2026 patch",
      imageUrl: ""
    },
    {
      id: "mithril-armor",
      name: "Mithril Armor",
      quality: "Patch item",
      categories: ["Defense"],
      attributes: "",
      effect: "Improved block logic: now correctly negates all effects of targeted skills.",
      recipe: "",
      sourceUrl: SOURCES.patch,
      source: "Steam March 2026 patch",
      imageUrl: ""
    },
    {
      id: "antique-longsword",
      name: "Antique Longsword",
      quality: "Patch item",
      categories: ["Physic"],
      attributes: "",
      effect: "Drop condition adjusted: only drops randomly to other players when the wearer is defeated on their home field and takes player damage.",
      recipe: "",
      sourceUrl: SOURCES.patch,
      source: "Steam March 2026 patch",
      imageUrl: ""
    },
    {
      id: "twin-fangs",
      name: "Twin Fangs",
      quality: "Rare",
      categories: ["Physic"],
      attributes: "ATK +50",
      effect: "Fang: when the carrier deals damage, it also damages up to 2 other enemies with the same name as the target.",
      recipe: "",
      sourceUrl: "https://ac.dragonest.com/en/announcement/detail/1971f3f0799",
      source: "Official Dragonest May 2025 patch",
      imageUrl: ""
    }
  ];
  const itemNames = new Set(officialItems.map((item) => item.name));
  let items = [...officialItems, ...patchItems.filter((item) => !itemNames.has(item.name))];
  function upsertLatestPatchItem(item) {
    const existing = items.find((entry) => entry.name === item.name);
    const patchSource = "Local Steam cache June 2026 patch";
    if (existing) {
      const mergedCategories = item.categories
        ? Array.from(new Set([...asArray(existing.categories), ...asArray(item.categories)]))
        : existing.categories;
      Object.assign(existing, item, {
        categories: mergedCategories,
        source: `${existing.source}; ${patchSource} override`,
        patchSourceUrl: SOURCES.latestPatch
      });
      return;
    }

    items.push({
      id: slug(item.name),
      quality: "Patch item",
      categories: ["Patch"],
      attributes: "",
      effect: "",
      recipe: "",
      sourceUrl: SOURCES.latestPatch,
      source: patchSource,
      imageUrl: "",
      ...item
    });
  }
  [
    {
      name: "Sorcerous Chain",
      quality: "Patch item",
      categories: ["Attack Speed", "Magic"],
      attributes: "Attack Speed +30%",
      effect: "June 25, 2026 patch removed Magic Damage +30% and added Attack Speed +30%.",
      patchNote: "Added from the June 25, 2026 local Steam cache patch notes."
    },
    {
      name: "Magic Mirror",
      quality: "Patch item",
      categories: ["Utility"],
      effect: "Inner Demon cooldown increased from 15s to 30s.",
      patchNote: "Added from the June 25, 2026 local Steam cache patch notes."
    },
    {
      name: "Kira Imprint",
      quality: "Patch item",
      categories: ["Defense", "Kira"],
      attributes: "Magic Resistance +25%",
      effect: "June 25, 2026 patch added Magic Resistance +25%.",
      patchNote: "Added from the June 25, 2026 local Steam cache patch notes."
    },
    {
      name: "Bloodbath Skull",
      quality: "Patch item",
      categories: ["Lifesteal"],
      effect: "Bloodbath attack lifesteal reduced from +150% to +100%.",
      patchNote: "Added from the June 25, 2026 local Steam cache patch notes."
    },
    {
      name: "Broken Sword",
      categories: ["Temporarily removed"],
      patchNote: "June 25, 2026 patch temporarily removed Broken Sword from item alternation."
    },
    {
      name: "Crystal Sword",
      categories: ["Returned"],
      effect: "Unique Passive - Furious Attack: the wearer's basic attacks have a 20% chance to deal 200% damage.",
      patchNote: "June 25, 2026 patch returned Crystal Sword and updated Furious Attack."
    }
  ].forEach(upsertLatestPatchItem);
  items = items.sort((a, b) => a.name.localeCompare(b.name));

  const synergies = [
    ...characterData.race.list.map((record) => normalizeSynergy(record, "Race")),
    ...characterData.Career.list.map((record) => normalizeSynergy(record, "Class"))
  ];
  const greater = synergies.find((synergy) => synergy.name === "Greater");
  if (greater && !greater.pieces.includes("Unknown Horror")) {
    greater.pieces.push("Unknown Horror");
    greater.patchNote = "March 2026 patch added Greater to Unknown Horror.";
    greater.source = `${greater.source}; Steam March 2026 patch override`;
    greater.patchSourceUrl = SOURCES.patch;
  }
  const druid = synergies.find((synergy) => synergy.name === "Druid");
  if (druid) {
    druid.patchNote = "March 2026 patch adds Druid: two identical 3-star Druids on the board upgrade into a Super Strange Egg.";
    druid.patchSourceUrl = SOURCES.patch;
    druid.source = `${druid.source}; Steam March 2026 patch override`;
  }
  const watcher = synergies.find((synergy) => synergy.name === "Watcher");
  if (watcher && !watcher.pieces.includes("Ronin-Nue")) {
    watcher.pieces.push("Ronin-Nue");
    watcher.patchNote = "March 2026 patch added Ronin-Nue as a Rare Watcher/Assassin.";
    watcher.source = `${watcher.source}; Steam March 2026 patch override`;
    watcher.patchSourceUrl = SOURCES.patch;
  }
  synergies.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));

  const output = {
    meta: {
      updatedLabel: new Date().toISOString().slice(0, 10),
      sources: SOURCES,
      sourceNote: "Reference data is generated from the official Dragonest Chess Wiki and Item Effects pages, including official images where available, with explicit Steam/local patch overrides for newly changed entries."
    },
    pieces,
    items,
    synergies
  };

  fs.writeFileSync("reference-data.js", `window.AUTO_CHESS_REFERENCE = ${JSON.stringify(output, null, 2)};\n`, "utf8");
  console.log(`Updated reference-data.js: ${pieces.length} pieces, ${items.length} items, ${synergies.length} synergies.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
