const QUALITY_BY_COST = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Epic",
  5: "Legendary"
};

const LOCAL_COST_OVERRIDES = [
  { name: "Abyssal Guard", cost: 3, localId: "120091", localPhoneId: "1020100" },
  { name: "Argali Knight", cost: 5, localId: "130031", localPhoneId: "1028100" },
  { name: "Bobo", cost: 1, localId: "130211", localPhoneId: "1095100" },
  { name: "Desperate Doctor", cost: 1, localId: "120021", localPhoneId: "1019100" },
  { name: "Frost Knight", cost: 2, localId: "110101", localPhoneId: "1009100" },
  { name: "God of War", cost: 1, localId: "110131", localPhoneId: "1057100" },
  { name: "Khan", cost: 4, localId: "150161", localPhoneId: "1091100" },
  { name: "Penitent Bishop", cost: 1, localId: "130271", localPhoneId: "1111100" },
  { name: "Phantom Queen", cost: 5, localId: "120071", localPhoneId: "1017100" },
  { name: "Shining Archer", cost: 1, localId: "120141", localPhoneId: "1058100" },
  { name: "Storm Shaman", cost: 5, localId: "140101", localPhoneId: "1047100" },
  { name: "Wind Ranger", cost: 2, localId: "130041", localPhoneId: "1030100" }
];

const LOCAL_NAME_ALIASES = {
  "Flamming Wizard": "Flame Wizard",
  "Lightblade Knight": "Light Blade",
  "獭獭猎手": "Bobo",
  "战神": "God of War",
  "讨罪司教": "Penitent Bishop",
  "光羽弩手": "Shining Archer",
  "烈日可汗": "Khan"
};

function qualityForCost(cost) {
  return QUALITY_BY_COST[Number(cost)] || "";
}

function localCostPatchNote(entry) {
  const quality = qualityForCost(entry.cost);
  return `Local Steam game data cost audit maps this piece to ${entry.cost} gold${quality ? ` (${quality})` : ""} in normal shop config. Local ID: ${entry.localId}; phone_chsid: ${entry.localPhoneId}.`;
}

module.exports = {
  LOCAL_COST_OVERRIDES,
  LOCAL_NAME_ALIASES,
  QUALITY_BY_COST,
  localCostPatchNote,
  qualityForCost
};
