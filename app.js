(function () {
  const data = window.AUTO_CHESS_DATA;
  const builds = data.builds;
  const reference = window.AUTO_CHESS_REFERENCE || { pieces: [], items: [], synergies: [], meta: {} };
  const patchData = window.AUTO_CHESS_PATCH_DATA || null;
  const state = {
    activeView: "builds",
    query: "",
    tier: "All",
    style: "All",
    difficulty: "All",
    selectedId: builds[0]?.id || "",
    enemyId: builds[0]?.id || "",
    counterSynergies: [],
    counterLevels: {},
    counterStage: "Mid",
    referenceType: "pieces",
    referenceQuery: "",
    referencePrimary: "All",
    referenceSecondary: "All"
  };

  const elements = {
    searchInput: document.getElementById("searchInput"),
    viewTabs: document.querySelectorAll(".view-tab"),
    buildsView: document.getElementById("buildsView"),
    counterAdvisorView: document.getElementById("counterAdvisorView"),
    patchDashboardView: document.getElementById("patchDashboardView"),
    referenceView: document.getElementById("referenceView"),
    tierFilters: document.getElementById("tierFilters"),
    styleFilter: document.getElementById("styleFilter"),
    difficultyFilter: document.getElementById("difficultyFilter"),
    buildList: document.getElementById("buildList"),
    detailPanel: document.getElementById("detailPanel"),
    resultCount: document.getElementById("resultCount"),
    enemySelect: document.getElementById("enemySelect"),
    counterResults: document.getElementById("counterResults"),
    counterClassList: document.getElementById("counterClassList"),
    counterRaceList: document.getElementById("counterRaceList"),
    counterStageControl: document.getElementById("counterStageControl"),
    counterSelectedCount: document.getElementById("counterSelectedCount"),
    counterClearButton: document.getElementById("counterClearButton"),
    counterThreatProfile: document.getElementById("counterThreatProfile"),
    counterRecommendationResults: document.getElementById("counterRecommendationResults"),
    counterSynergyBreakdown: document.getElementById("counterSynergyBreakdown"),
    patchTitle: document.getElementById("patchTitle"),
    patchSourceLink: document.getElementById("patchSourceLink"),
    patchHighlights: document.getElementById("patchHighlights"),
    dashboardPatchTitle: document.getElementById("dashboardPatchTitle"),
    dashboardPatchSourceLink: document.getElementById("dashboardPatchSourceLink"),
    patchDashboardSummary: document.getElementById("patchDashboardSummary"),
    patchReviewCount: document.getElementById("patchReviewCount"),
    patchReviewQueue: document.getElementById("patchReviewQueue"),
    patchAffectedCount: document.getElementById("patchAffectedCount"),
    patchAffectedList: document.getElementById("patchAffectedList"),
    patchSectionList: document.getElementById("patchSectionList"),
    footerSourceNote: document.getElementById("footerSourceNote"),
    statBuilds: document.getElementById("stat-builds"),
    statPieces: document.getElementById("stat-pieces"),
    statItems: document.getElementById("stat-items"),
    statSynergies: document.getElementById("stat-synergies"),
    statUpdated: document.getElementById("stat-updated"),
    referenceSearchInput: document.getElementById("referenceSearchInput"),
    referenceTabs: document.getElementById("referenceTabs"),
    referencePrimaryLabel: document.getElementById("referencePrimaryLabel"),
    referencePrimaryFilter: document.getElementById("referencePrimaryFilter"),
    referenceSecondaryLabel: document.getElementById("referenceSecondaryLabel"),
    referenceSecondaryFilter: document.getElementById("referenceSecondaryFilter"),
    referenceSummary: document.getElementById("referenceSummary"),
    referenceList: document.getElementById("referenceList"),
    referenceSourceNote: document.getElementById("referenceSourceNote")
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  function asArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function displayValue(value, fallback) {
    const text = String(value || "").trim();
    return text || fallback || "None";
  }

  function tierClass(tier) {
    return tier === "A" ? "tier-a" : tier === "B" ? "tier-b" : "";
  }

  function chip(label, tone) {
    const className = tone ? `chip ${tone}` : "chip";
    return `<span class="${className}">${escapeHtml(label)}</span>`;
  }

  function chipRow(items, tone) {
    const values = asArray(items);
    return `<div class="chip-row">${values.map((item) => chip(item, tone)).join("")}</div>`;
  }

  function list(items, numbered) {
    const className = numbered ? "number-list" : "mini-list";
    return `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function sourceLink(build) {
    if (!build.sourceUrl) {
      return "";
    }

    const label = build.sourceLabel || "Build source";
    return `<a class="build-source-link" href="${escapeHtml(build.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
  }

  function textBlock(value) {
    const text = displayValue(value, "");
    if (!text) {
      return `<p class="muted-text">No effect listed.</p>`;
    }

    return `<p>${escapeHtml(text).replaceAll("\n", "<br>")}</p>`;
  }

  function sourceLinks(record) {
    const links = [];
    if (record.sourceUrl) {
      links.push(`<a href="${escapeHtml(record.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(record.source || "Source")}</a>`);
    }
    if (record.patchSourceUrl && record.patchSourceUrl !== record.sourceUrl) {
      links.push(`<a href="${escapeHtml(record.patchSourceUrl)}" target="_blank" rel="noreferrer">Patch override</a>`);
    }

    return links.length ? `<div class="source-row">${links.join("")}</div>` : "";
  }

  function initials(value) {
    return String(value || "?")
      .split(/\s+|-/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function referenceImage(record, type) {
    const className = `reference-image ${type} ${record.imageUrl ? "" : "fallback"}`.trim();
    if (!record.imageUrl) {
      return `<div class="${className}" aria-hidden="true">${escapeHtml(initials(record.name))}</div>`;
    }

    return `
      <div class="${className}">
        <img src="${escapeHtml(record.imageUrl)}" alt="${escapeHtml(record.name)}" loading="lazy">
      </div>
    `;
  }

  function flattenText(value) {
    if (Array.isArray(value)) {
      return value.map(flattenText).join(" ");
    }
    if (value && typeof value === "object") {
      return Object.values(value).map(flattenText).join(" ");
    }
    return String(value || "");
  }

  function buildSearchText(build) {
    return [
      build.name,
      build.tier,
      build.style,
      build.difficulty,
      build.timing,
      build.winCondition,
      ...build.tags,
      ...build.core,
      ...build.early,
      ...build.items,
      ...build.positioning,
      ...build.strongInto,
      ...build.weakInto,
      ...build.counterPlan,
      ...build.pivots
    ].join(" ").toLowerCase();
  }

  const COUNTER_TRAIT_TERMS = {
    "backline-access": ["assassin", "jump", "backline", "ronin nue", "shining assassin", "target the hunter", "targeted"],
    "magic-damage": ["magicka", "mage", "magic", "caster", "spell", "tortola", "dragon"],
    "armor-shred": ["egersis", "armor reduction", "armor shred", "shred armor"],
    "aoe-control": ["aoe", "splash", "storm shaman", "tortola", "devastator", "clear summons", "spell splash", "cluster"],
    "tempo-pressure": ["tempo", "pressure", "hunter", "mid game", "level 7", "level 8", "punish"],
    "damage-sharing": ["strange egg", "damage sharing", "linked", "super egg", "druid"],
    "frontline-armor": ["warrior", "armor", "frontline", "tank", "mithril"],
    "summon-bait": ["summon", "war horn", "insect", "duplicate", "bait", "expendable"],
    "silence-control": ["silence", "disable", "control", "hex", "stun", "storm shaman", "taboo witcher"],
    "late-control": ["legendary", "limit break", "tsunami", "devastator", "control density"],
    "evasion": ["feathered", "evasion", "feather"],
    "ranged-carry": ["hunter", "dwarf sniper", "cannon granny", "ranged"],
    "sustain": ["lifesteal", "sustain", "soul reaper", "warlock"]
  };

  const COUNTER_TRAIT_LABELS = {
    "backline-access": "backline access",
    "magic-damage": "magic damage",
    "armor-shred": "armor shred",
    "aoe-control": "wide AoE/control",
    "tempo-pressure": "tempo pressure",
    "damage-sharing": "damage sharing",
    "frontline-armor": "frontline armor",
    "summon-bait": "summons and bait units",
    "silence-control": "silence/control",
    "late-control": "late-game control",
    "evasion": "evasion",
    "ranged-carry": "protected ranged damage",
    "sustain": "sustain"
  };

  const COUNTER_STAGE_OPTIONS = [
    {
      id: "Early",
      label: "Early",
      description: "Preserve HP, punish greed, and prefer counters that work before expensive pieces are online.",
      traitScores: { "tempo-pressure": 4, "frontline-armor": 2, "ranged-carry": 2, "summon-bait": 1, "late-control": -3, "damage-sharing": -1 },
      timingScores: [
        { terms: ["mid game", "level 7", "level 8", "tempo"], score: 2 },
        { terms: ["round 25", "round 35", "level 16", "legendary"], score: -4 }
      ]
    },
    {
      id: "Mid",
      label: "Mid",
      description: "Fight strongest board, answer visible carries, and keep pivot options open.",
      traitScores: { "tempo-pressure": 2, "backline-access": 2, "aoe-control": 1, "frontline-armor": 1, "late-control": -1 },
      timingScores: [
        { terms: ["mid game", "level 7", "level 8", "item dependent"], score: 3 },
        { terms: ["round 35", "level 16"], score: -2 }
      ]
    },
    {
      id: "Late",
      label: "Late",
      description: "Tech against completed synergies, prioritize control, and protect your win condition.",
      traitScores: { "late-control": 4, "damage-sharing": 2, "magic-damage": 2, "silence-control": 2, "tempo-pressure": -1 },
      timingScores: [
        { terms: ["round 25", "round 35", "level 8", "level 9", "legendary", "item dependent"], score: 3 },
        { terms: ["mid game"], score: -1 }
      ]
    },
    {
      id: "Final",
      label: "Final",
      description: "Counter the remaining opponent directly with positioning, control, and late-board tech.",
      traitScores: { "late-control": 4, "backline-access": 2, "silence-control": 2, "aoe-control": 2, "summon-bait": 1, "tempo-pressure": -2 },
      timingScores: [
        { terms: ["round 35", "level 16", "legendary", "level 8", "level 9"], score: 4 },
        { terms: ["easy", "tempo"], score: -1 }
      ]
    }
  ];

  const SYNERGY_COUNTER_RULES = {
    Assassin: {
      profile: ["Backline burst", "Physical crits", "Carry access"],
      threat: "Assassins skip normal front-to-back trading and try to erase carries before they cast.",
      answers: ["Use corner bait and sacrificial backliners", "Protect the carry with armor, links, or a second threat", "Punish the jump with control or AoE"],
      counterTraits: ["frontline-armor", "damage-sharing", "aoe-control", "summon-bait"],
      buildScores: { "warrior-frontline": 9, "druid-super-egg": 8, "watcher-control": 5, "summon-war-horn": 5, "magicka-dragon": 3 }
    },
    Druid: {
      profile: ["Fast upgrades", "Damage sharing", "Late scaling"],
      threat: "Druid boards hit upgraded front lines early and can become hard to burst once Strange Egg links are online.",
      answers: ["Pressure before the upgraded board stabilizes", "Use AoE so linked units take damage together", "Pick magic conversion or control instead of only attacking armor"],
      counterTraits: ["tempo-pressure", "aoe-control", "magic-damage", "backline-access"],
      buildScores: { "magicka-dragon": 9, "watcher-assassin": 7, "egersis-hunter": 6, "ogre-rage-casters": 5, "limit-break-legendary": 4 }
    },
    Hunter: {
      profile: ["Ranged focus fire", "Physical tempo", "Backline carry"],
      threat: "Hunters convert stable front lines into fast ranged focus fire and can pierce evasion.",
      answers: ["Jump or disable the carry line", "Use damage sharing against focus fire", "Deny clean corners with bait"],
      counterTraits: ["backline-access", "damage-sharing", "summon-bait", "frontline-armor"],
      buildScores: { "watcher-assassin": 9, "druid-super-egg": 7, "warrior-frontline": 5, "summon-war-horn": 5, "insect-midgame-swarm": 4 }
    },
    Knight: {
      profile: ["Shield windows", "Armor", "Magic resistance"],
      threat: "Knight shields make basic front-to-back damage inefficient while the carry keeps firing.",
      answers: ["Use armor reduction or magic conversion when shields are down", "Jump the carry before the shield cycle stabilizes", "Avoid slow fights into a protected ranged carry"],
      counterTraits: ["armor-shred", "backline-access", "magic-damage", "tempo-pressure"],
      buildScores: { "egersis-hunter": 9, "watcher-assassin": 7, "magicka-dragon": 6, "ogre-rage-casters": 4, "limit-break-legendary": 4 }
    },
    Mage: {
      profile: ["Magic burst", "Resistance shred", "AoE punish"],
      threat: "Mage strips magic resistance and turns clumped boards into one-spell losses.",
      answers: ["Spread important units", "Jump or silence The Source and primary casters", "Win the first cast cycle with tempo or control"],
      counterTraits: ["backline-access", "silence-control", "tempo-pressure", "late-control"],
      buildScores: { "watcher-assassin": 9, "egersis-hunter": 7, "limit-break-legendary": 6, "ogre-rage-casters": 4, "druid-super-egg": 3 }
    },
    Mech: {
      profile: ["Early armor", "Economy value", "Stabilizing front line"],
      threat: "Mech boards can survive early trades and convert wins into extra economy.",
      answers: ["Use magic or spell damage over armor checks", "Break the streak before the economy compounds", "Do not let low-health Mechs escape the round"],
      counterTraits: ["magic-damage", "tempo-pressure", "aoe-control"],
      buildScores: { "magicka-dragon": 8, "ogre-rage-casters": 6, "egersis-hunter": 5, "watcher-assassin": 4 }
    },
    Priest: {
      profile: ["Player damage reduction", "Loss streak value", "Greed window"],
      threat: "Priest reduces punishment while the player buys time for a greedier board.",
      answers: ["Pressure their board quality, not just their HP", "Deny streak setup with mid-game tempo", "Force spending before late talents matter"],
      counterTraits: ["tempo-pressure", "backline-access", "late-control"],
      buildScores: { "egersis-hunter": 8, "watcher-assassin": 6, "magicka-dragon": 5, "limit-break-legendary": 4 }
    },
    Shaman: {
      profile: ["Opening hex", "Random disable", "Disruption"],
      threat: "Shaman can remove one important unit from the fight before your first plan executes.",
      answers: ["Avoid relying on one solo carry", "Use summons or secondary threats to absorb random disable", "Win with board depth and control layering"],
      counterTraits: ["summon-bait", "late-control", "damage-sharing", "backline-access"],
      buildScores: { "summon-war-horn": 7, "insect-midgame-swarm": 7, "limit-break-legendary": 6, "druid-super-egg": 5, "watcher-assassin": 4 }
    },
    Warlock: {
      profile: ["Lifesteal", "Long fights", "Sustain"],
      threat: "Warlock turns chip damage into recovery and rewards fights that drag on.",
      answers: ["Burst or disable the healing core", "Focus damage so lifesteal cannot stabilize multiple units", "Use high damage tempo before sustain is assembled"],
      counterTraits: ["backline-access", "tempo-pressure", "magic-damage", "silence-control"],
      buildScores: { "watcher-assassin": 8, "egersis-hunter": 7, "magicka-dragon": 6, "ogre-rage-casters": 5 }
    },
    Warrior: {
      profile: ["Armor stacking", "Stable frontline", "Physical resistance"],
      threat: "Warrior armor blunts physical tempo and lets carries or control pieces play behind a durable wall.",
      answers: ["Bypass armor with magic conversion", "Shred armor with Egersis pressure", "Disable the carry instead of only attacking the tank line"],
      counterTraits: ["magic-damage", "armor-shred", "backline-access", "silence-control"],
      buildScores: { "magicka-dragon": 9, "egersis-hunter": 8, "ogre-rage-casters": 6, "watcher-assassin": 5 }
    },
    Witcher: {
      profile: ["Demon denial", "Carry disruption", "Pure-damage control"],
      threat: "Witcher turns Demon plans awkward and can convert a single carry into a liability.",
      answers: ["Do not rely on Demon value", "Use non-Demon ranged or spell damage", "Layer multiple threats so one counter piece does not decide the round"],
      counterTraits: ["ranged-carry", "magic-damage", "late-control", "summon-bait"],
      buildScores: { "egersis-hunter": 7, "magicka-dragon": 6, "limit-break-legendary": 5, "summon-war-horn": 4 }
    },
    Wizard: {
      profile: ["Synergy shortcut", "High-tier breakpoint", "Flexible cap"],
      threat: "Wizard lets expensive synergies arrive early or hit maximum value with fewer pieces.",
      answers: ["Target the Wizard enabler", "Scout for the one synergy being amplified", "Pressure before the shortcut becomes a capped board"],
      counterTraits: ["backline-access", "tempo-pressure", "silence-control", "late-control"],
      buildScores: { "watcher-assassin": 8, "egersis-hunter": 6, "ogre-rage-casters": 5, "limit-break-legendary": 5 }
    },
    Ancestor: {
      profile: ["Healing", "Pure damage", "Nearby punishment"],
      threat: "Ancestor rewards healing cycles and can turn repeated healing into nearby pure damage.",
      answers: ["Burst key units before healing thresholds repeat", "Spread to reduce nearby pure-damage value", "Disable healers and support pieces"],
      counterTraits: ["backline-access", "tempo-pressure", "silence-control", "aoe-control"],
      buildScores: { "watcher-assassin": 7, "egersis-hunter": 6, "ogre-rage-casters": 5, "magicka-dragon": 5 }
    },
    Beast: {
      profile: ["Summons", "Physical scaling", "Board flood"],
      threat: "Beast increases team damage and often pairs with summons that clog targeting.",
      answers: ["Clear summons with AoE", "Armor up or damage-share through physical pressure", "Kill the real carry before Beast stacks matter"],
      counterTraits: ["aoe-control", "frontline-armor", "backline-access", "damage-sharing"],
      buildScores: { "warrior-frontline": 8, "magicka-dragon": 7, "ogre-rage-casters": 6, "watcher-control": 5, "druid-super-egg": 4 }
    },
    Cave: {
      profile: ["Raw HP", "Durable frontline", "Comeback scaling"],
      threat: "Cave adds enough health that low-burst boards can run out of damage.",
      answers: ["Use magic conversion or armor shred instead of slow physical trades", "Pressure support pieces behind the HP wall", "Bring sustained damage rather than one small burst"],
      counterTraits: ["magic-damage", "armor-shred", "backline-access", "tempo-pressure"],
      buildScores: { "magicka-dragon": 8, "egersis-hunter": 7, "watcher-assassin": 5, "ogre-rage-casters": 5 }
    },
    Civet: {
      profile: ["Duplicate pieces", "Extra bodies", "Rank-up pressure"],
      threat: "Civet creates duplicate pressure that can make single-target damage waste time.",
      answers: ["Use AoE to clear copies", "Focus the surviving duplicate that enables repeated value", "Avoid overcommitting single-target disables into expendable bodies"],
      counterTraits: ["aoe-control", "magic-damage", "silence-control", "frontline-armor"],
      buildScores: { "magicka-dragon": 8, "ogre-rage-casters": 7, "warrior-frontline": 5, "watcher-control": 4 }
    },
    Demon: {
      profile: ["Pure damage", "Single carry spike", "Armor bypass"],
      threat: "Demon pure damage punishes boards that rely only on armor or one tank to survive.",
      answers: ["Disable or bait the Demon carry", "Use damage sharing instead of only armor", "Force the Demon player to split item value"],
      counterTraits: ["backline-access", "damage-sharing", "summon-bait", "silence-control"],
      buildScores: { "watcher-assassin": 8, "druid-super-egg": 7, "summon-war-horn": 5, "warrior-frontline": 4 }
    },
    Divinity: {
      profile: ["Cooldown engine", "Repeated casts", "Control tempo"],
      threat: "Divinity shortens cooldowns and lets key spells repeat before ordinary boards can reset.",
      answers: ["Jump The Source and cooldown pieces", "Silence or stun the first cast cycle", "Pressure before the engine has enough front line"],
      counterTraits: ["backline-access", "silence-control", "tempo-pressure", "late-control"],
      buildScores: { "watcher-assassin": 9, "egersis-hunter": 6, "ogre-rage-casters": 5, "limit-break-legendary": 5 }
    },
    Dragon: {
      profile: ["Instant mana", "First-cast burst", "Splash damage"],
      threat: "Dragon starts fights with mana, so the opening spell cycle arrives before slow boards are ready.",
      answers: ["Spread against first casts", "Jump or silence the caster receiving mana", "Use tempo to kill support before Dragon value repeats"],
      counterTraits: ["backline-access", "silence-control", "tempo-pressure", "late-control"],
      buildScores: { "watcher-assassin": 8, "egersis-hunter": 6, "limit-break-legendary": 5, "ogre-rage-casters": 4 }
    },
    Dwarf: {
      profile: ["Long range", "Protected carry", "Backline damage"],
      threat: "Dwarf carries play from extreme range and can keep firing while the front line stalls.",
      answers: ["Use Assassin or Watcher access to reach the carry", "Place bait to pull targeting away", "Apply control before the ranged carry free-fires"],
      counterTraits: ["backline-access", "summon-bait", "silence-control", "frontline-armor"],
      buildScores: { "watcher-assassin": 9, "watcher-control": 7, "warrior-frontline": 5, "feather-clover": 4 }
    },
    Egersis: {
      profile: ["Armor reduction", "Physical burst", "Frontline shredding"],
      threat: "Egersis makes armor plans worse and lets physical carries cut through tanks.",
      answers: ["Use magic damage or damage sharing rather than pure armor", "Jump the Egersis damage source", "Do not let one tank absorb every hit"],
      counterTraits: ["magic-damage", "damage-sharing", "backline-access", "summon-bait"],
      buildScores: { "magicka-dragon": 8, "druid-super-egg": 7, "watcher-assassin": 6, "ogre-rage-casters": 4 }
    },
    Feathered: {
      profile: ["Evasion", "Physical dodge", "Stall"],
      threat: "Feathered dodges physical attacks and makes accuracy-dependent carries unreliable.",
      answers: ["Use magic damage, spells, or Hunter pierce", "Control the evasion carry", "Avoid relying on a single physical carry without answers"],
      counterTraits: ["magic-damage", "aoe-control", "ranged-carry", "silence-control"],
      buildScores: { "magicka-dragon": 9, "ogre-rage-casters": 7, "egersis-hunter": 6, "watcher-control": 5 }
    },
    Glacier: {
      profile: ["Attack speed", "Sustained DPS", "Carry ramp"],
      threat: "Glacier accelerates physical carries and can overwhelm boards that lack early control.",
      answers: ["Disable the main attack-speed carry", "Use armor or damage sharing during the ramp", "Burst support before lifesteal or attack speed stacks win"],
      counterTraits: ["silence-control", "frontline-armor", "damage-sharing", "backline-access"],
      buildScores: { "watcher-assassin": 7, "warrior-frontline": 6, "druid-super-egg": 5, "ogre-rage-casters": 5 }
    },
    Goblin: {
      profile: ["Armor", "Regeneration", "Early tempo"],
      threat: "Goblin can overperform early with defensive stats and force you into bad HP trades.",
      answers: ["Use magic or spell damage", "Match tempo before the defensive rolls stack", "Do not feed streak economy"],
      counterTraits: ["magic-damage", "tempo-pressure", "armor-shred", "aoe-control"],
      buildScores: { "magicka-dragon": 8, "egersis-hunter": 6, "ogre-rage-casters": 6, "watcher-assassin": 4 }
    },
    Greater: {
      profile: ["Synergy disruption", "Unique pieces", "Board-control pressure"],
      threat: "Greater-style boards punish careless synergy planning and can turn a normal board into scattered value.",
      answers: ["Lean on raw upgraded units and flexible damage", "Target the piece enabling the disruption", "Keep pivots open instead of overcommitting one synergy"],
      counterTraits: ["tempo-pressure", "backline-access", "late-control", "ranged-carry"],
      buildScores: { "egersis-hunter": 6, "watcher-assassin": 6, "limit-break-legendary": 5, "knight-cannon-granny": 4 }
    },
    Horn: {
      profile: ["Damage reduction", "Durable carries", "Stall"],
      threat: "Horn-style mitigation makes shallow burst worse and gives carries more time to act.",
      answers: ["Use sustained damage or armor reduction", "Disable the protected carry", "Avoid dumping all damage into a shielded target"],
      counterTraits: ["armor-shred", "silence-control", "ranged-carry", "magic-damage"],
      buildScores: { "egersis-hunter": 8, "watcher-assassin": 6, "magicka-dragon": 5, "knight-cannon-granny": 4 }
    },
    Human: {
      profile: ["Silence", "Mana denial", "Caster disruption"],
      threat: "Human silence can stop your first cast and ruin single-caster plans.",
      answers: ["Use multiple threats instead of one caster", "Jump or disable Human supports", "Rely on attacks, summons, or board depth when silence is likely"],
      counterTraits: ["summon-bait", "ranged-carry", "backline-access", "late-control"],
      buildScores: { "summon-war-horn": 7, "insect-midgame-swarm": 6, "watcher-assassin": 6, "egersis-hunter": 5, "limit-break-legendary": 4 }
    },
    Insectoid: {
      profile: ["Swarm bodies", "Target dilution", "Mid-game pressure"],
      threat: "Insectoid floods the fight with bodies and makes single-target damage spend time on the wrong unit.",
      answers: ["Use AoE to clear spawned bodies", "Kill the surviving duplicate or real carry", "Bring sustain so chip damage becomes recovery"],
      counterTraits: ["aoe-control", "magic-damage", "frontline-armor", "sustain"],
      buildScores: { "magicka-dragon": 9, "ogre-rage-casters": 8, "warrior-frontline": 5, "druid-super-egg": 4 }
    },
    Kira: {
      profile: ["Item scaling", "High HP", "Carry steroid"],
      threat: "Kira lines can turn one itemized unit into a huge stat problem.",
      answers: ["Disable or jump the item holder", "Shred or bypass the oversized health pool", "Use bait so the carry wastes time"],
      counterTraits: ["backline-access", "armor-shred", "magic-damage", "summon-bait"],
      buildScores: { "watcher-assassin": 8, "egersis-hunter": 7, "magicka-dragon": 6, "watcher-control": 5 }
    },
    Marine: {
      profile: ["Magic resistance", "Anti-caster", "Durability"],
      threat: "Marine makes pure magic plans much less reliable.",
      answers: ["Switch to physical damage or armor reduction", "Jump key carries instead of racing spell damage", "Use control and ranged damage rather than only burst spells"],
      counterTraits: ["armor-shred", "backline-access", "ranged-carry", "frontline-armor"],
      buildScores: { "egersis-hunter": 9, "watcher-assassin": 7, "knight-cannon-granny": 6, "beast-shining-assassin": 5, "warrior-frontline": 4 }
    },
    "Night Demon": {
      profile: ["Single threat", "Burst pressure", "Pure damage"],
      threat: "Night Demon pressure often concentrates value into a dangerous carry or burst unit.",
      answers: ["Bait and disable the carry", "Use damage sharing so one target is not deleted", "Keep a second damage source alive"],
      counterTraits: ["backline-access", "damage-sharing", "summon-bait", "silence-control"],
      buildScores: { "watcher-assassin": 8, "druid-super-egg": 7, "summon-war-horn": 5, "warrior-frontline": 4 }
    },
    Pandaman: {
      profile: ["High-roll pieces", "Flexible splash", "Greed"],
      threat: "Pandaman boards can spike from unexpected units and punish slow scouting.",
      answers: ["Pressure before the high-roll board connects", "Scout every round for the real carry", "Use flexible counters instead of narrow tech"],
      counterTraits: ["tempo-pressure", "backline-access", "late-control"],
      buildScores: { "egersis-hunter": 7, "watcher-assassin": 6, "limit-break-legendary": 5, "ogre-rage-casters": 4 }
    },
    Spirits: {
      profile: ["Petrify", "Melee punishment", "Control"],
      threat: "Spirits punish melee-heavy boards and can freeze physical attackers in place.",
      answers: ["Use ranged or spell damage", "Spread melee units so petrify does not chain value", "Disable Spirit pieces before they control the fight"],
      counterTraits: ["ranged-carry", "magic-damage", "silence-control", "backline-access"],
      buildScores: { "magicka-dragon": 8, "egersis-hunter": 7, "ogre-rage-casters": 6, "watcher-assassin": 5 }
    },
    Watcher: {
      profile: ["Extra targets", "Targeted disables", "Carry pickoff"],
      threat: "Watcher turns unit-targeted effects into broader disruption and punishes boards with only one safe carry.",
      answers: ["Use expendable units to absorb targeted effects", "Spread important pieces", "Prefer summons, links, or wide boards over one protected carry"],
      counterTraits: ["summon-bait", "damage-sharing", "frontline-armor", "evasion"],
      buildScores: { "druid-super-egg": 8, "summon-war-horn": 8, "insect-midgame-swarm": 6, "feather-clover": 5, "warrior-frontline": 4 }
    }
  };

  const COUNTER_COMBO_RULES = [
    {
      label: "Knight + Mage",
      matches: (names) => names.has("Knight") && names.has("Mage"),
      explanation: "Knight shields slow ordinary damage while Mage punishes clumps, so the best answer is carry access, armor shred, and spread control rather than one defensive stack.",
      buildScores: { "watcher-assassin": 8, "egersis-hunter": 7, "limit-break-legendary": 4, "ogre-rage-casters": 3 }
    },
    {
      label: "Dragon + Mage",
      matches: (names) => names.has("Dragon") && names.has("Mage"),
      explanation: "Dragon gives the Mage board an immediate first cast, so deny the opening cycle with jump, silence, or tempo pressure.",
      buildScores: { "watcher-assassin": 8, "egersis-hunter": 6, "limit-break-legendary": 5 }
    },
    {
      label: "Hunter + Dwarf",
      matches: (names) => names.has("Hunter") && names.has("Dwarf"),
      explanation: "Long-range Hunter damage needs carry access or heavy bait; do not let the backline free-fire behind a disposable front line.",
      buildScores: { "watcher-assassin": 8, "watcher-control": 6, "druid-super-egg": 5, "warrior-frontline": 4 }
    },
    {
      label: "Insectoid + Civet",
      matches: (names) => names.has("Insectoid") && names.has("Civet"),
      explanation: "Both synergies add extra bodies, so single-target damage falls off unless you clear copies quickly.",
      buildScores: { "magicka-dragon": 8, "ogre-rage-casters": 7, "warrior-frontline": 4 }
    },
    {
      label: "Cave + Divinity",
      matches: (names) => names.has("Cave") && names.has("Divinity"),
      explanation: "Cave buys time for the Divinity cooldown engine, so you need either early pressure or direct access to The Source and control pieces.",
      buildScores: { "watcher-assassin": 7, "egersis-hunter": 6, "magicka-dragon": 5 }
    },
    {
      label: "Beast + Assassin",
      matches: (names) => names.has("Beast") && names.has("Assassin"),
      explanation: "Beast summons distract targeting while Assassins threaten the carry, so armor, bait, and AoE matter more than a fragile backline race.",
      buildScores: { "warrior-frontline": 8, "druid-super-egg": 6, "magicka-dragon": 5, "watcher-control": 4 }
    },
    {
      label: "Warrior + Beast",
      matches: (names) => names.has("Warrior") && names.has("Beast"),
      explanation: "Armor plus team damage creates a long physical fight; counter with magic conversion, armor shred, or strong AoE.",
      buildScores: { "magicka-dragon": 8, "egersis-hunter": 7, "ogre-rage-casters": 5 }
    }
  ];

  function traitLabel(trait) {
    return COUNTER_TRAIT_LABELS[trait] || trait;
  }

  function buildHasCounterTrait(build, trait) {
    const terms = COUNTER_TRAIT_TERMS[trait] || [];
    const searchText = normalizeForMatch(buildSearchText(build));
    return terms.some((term) => searchText.includes(normalizeForMatch(term)));
  }

  function selectedCounterSynergies() {
    const selected = new Set(state.counterSynergies);
    return reference.synergies.filter((synergy) => selected.has(synergy.id));
  }

  function counterRuleFor(synergy) {
    const rule = SYNERGY_COUNTER_RULES[synergy.name] || {};
    return {
      profile: rule.profile || [`${synergy.type} pressure`],
      threat: rule.threat || `${synergy.name} changes the fight shape enough that scouting and flexible positioning matter.`,
      answers: rule.answers || ["Scout the carry", "Keep positioning flexible", "Use the build's listed counter plan"],
      counterTraits: rule.counterTraits || ["tempo-pressure", "backline-access"],
      buildScores: rule.buildScores || {}
    };
  }

  function activeCounterCombos(selectedSynergies) {
    const names = new Set(selectedSynergies.map((synergy) => synergy.name));
    return COUNTER_COMBO_RULES.filter((combo) => combo.matches(names));
  }

  function effectPreview(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > 260 ? `${text.slice(0, 257)}...` : text;
  }

  function counterFitTone(fit) {
    if (fit >= 86) {
      return "bad";
    }
    if (fit >= 74) {
      return "warn";
    }
    return "good";
  }

  function recommendationPriority(fit) {
    if (fit >= 86) {
      return "High";
    }
    if (fit >= 74) {
      return "Good";
    }
    return "Watch";
  }

  function normalizedEffectText(value) {
    return String(value || "")
      .replace(/\uFF1A/g, ":")
      .replace(/\u00ef\u00bc\u0161/g, ":");
  }

  function synergyLevelOptions(synergy) {
    const levels = new Set();
    const text = normalizedEffectText(synergy.effect);
    const pattern = /(?:^|[\s[])(\d{1,2})\s*(?=[:\]])/g;
    let match = pattern.exec(text);
    while (match) {
      levels.add(Number(match[1]));
      match = pattern.exec(text);
    }

    if (!levels.size) {
      levels.add(1);
    }

    return [...levels].sort((a, b) => a - b);
  }

  function selectedCounterLevel(synergy) {
    const levels = synergyLevelOptions(synergy);
    const selected = Number(state.counterLevels[synergy.id]);
    return levels.includes(selected) ? selected : levels[0];
  }

  function levelIndexRatio(synergy) {
    const levels = synergyLevelOptions(synergy);
    if (levels.length <= 1) {
      return 0;
    }

    const index = Math.max(0, levels.indexOf(selectedCounterLevel(synergy)));
    return index / (levels.length - 1);
  }

  function levelWeight(synergy) {
    if (synergyLevelOptions(synergy).length <= 1) {
      return 1;
    }

    return 0.86 + levelIndexRatio(synergy) * 0.5;
  }

  function levelLabel(synergy) {
    const levels = synergyLevelOptions(synergy);
    const level = selectedCounterLevel(synergy);
    return levels.length === 1 && level === 1 ? "Active" : `${level} pieces`;
  }

  function selectedSynergyLabel(synergy) {
    const levels = synergyLevelOptions(synergy);
    return levels.length === 1 && selectedCounterLevel(synergy) === 1 ? synergy.name : `${synergy.name} ${selectedCounterLevel(synergy)}`;
  }

  function selectedLevelEffect(synergy) {
    const text = normalizedEffectText(synergy.effect);
    const level = selectedCounterLevel(synergy);
    const lines = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const levelPattern = new RegExp(`(?:^|\\[)${level}\\s*(?:[:\\]])`);
    const match = lines.find((line) => levelPattern.test(line));
    return effectPreview(match || text);
  }

  function stageConfig() {
    return COUNTER_STAGE_OPTIONS.find((stage) => stage.id === state.counterStage) || COUNTER_STAGE_OPTIONS[1];
  }

  function stageBuildScore(build, matchedTraits) {
    const stage = stageConfig();
    const searchText = normalizeForMatch([
      build.name,
      build.style,
      build.timing,
      build.difficulty,
      ...build.tags,
      build.winCondition
    ].join(" "));
    let score = 0;

    for (const trait of matchedTraits) {
      score += stage.traitScores[trait] || 0;
    }

    for (const rule of stage.timingScores) {
      if (rule.terms.some((term) => searchText.includes(normalizeForMatch(term)))) {
        score += rule.score;
      }
    }

    return score;
  }

  function levelStageText(synergy) {
    const ratio = levelIndexRatio(synergy);
    if (ratio >= 0.95) {
      return `${levelLabel(synergy)} is the highest listed breakpoint, so this threat is weighted as a capped-board problem.`;
    }
    if (ratio >= 0.45) {
      return `${levelLabel(synergy)} is a meaningful mid-tier breakpoint, so the counter needs to answer the synergy directly.`;
    }
    return `${levelLabel(synergy)} is an early breakpoint, so tempo and clean positioning can still beat it before the board caps.`;
  }

  function buildCounterRecommendations(selectedSynergies) {
    const rules = selectedSynergies.map((synergy) => ({ synergy, rule: counterRuleFor(synergy) }));
    const combos = activeCounterCombos(selectedSynergies);
    const stage = stageConfig();
    const averageLevelWeight = selectedSynergies.length
      ? selectedSynergies.reduce((total, synergy) => total + levelWeight(synergy), 0) / selectedSynergies.length
      : 1;
    const raw = builds
      .map((build) => {
        let score = Math.max(0, build.score - 70) / 8;
        const reasons = [];
        const matchedTraits = new Set();

        for (const item of rules) {
          const directScore = item.rule.buildScores[build.id] || 0;
          const traitMatches = item.rule.counterTraits.filter((trait) => buildHasCounterTrait(build, trait));
          const traitScore = Math.min(4, traitMatches.length * 1.2);
          const total = (directScore + traitScore) * levelWeight(item.synergy);
          if (total <= 0) {
            continue;
          }

          score += total;
          traitMatches.forEach((trait) => matchedTraits.add(trait));
          reasons.push({
            title: `${item.synergy.name} - ${levelLabel(item.synergy)}`,
            text: `${item.rule.threat} Current level read: ${selectedLevelEffect(item.synergy)} ${levelStageText(item.synergy)} Counter priority: ${item.rule.answers.slice(0, 2).join("; ")}.`
          });
        }

        for (const combo of combos) {
          const comboScore = combo.buildScores[build.id] || 0;
          if (comboScore > 0) {
            score += comboScore * averageLevelWeight;
            reasons.push({ title: combo.label, text: combo.explanation });
          }
        }

        if (!reasons.length) {
          return null;
        }

        const stageAdjustment = stageBuildScore(build, matchedTraits);
        score = Math.max(0.1, score + stageAdjustment);
        if (Math.abs(stageAdjustment) >= 2) {
          const fitText = stageAdjustment > 0 ? "fits" : "is less natural for";
          reasons.push({
            title: `${stage.label} stage`,
            text: `${stage.description} This build ${fitText} the selected stage based on timing, traits, and how quickly it can answer the enemy board.`
          });
        }

        return { build, score, reasons, traits: [...matchedTraits], stageAdjustment };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || b.build.score - a.build.score);

    const topScore = raw[0]?.score || 1;
    return raw.map((item) => ({
      ...item,
      fit: Math.min(99, Math.round(58 + (item.score / topScore) * 39))
    }));
  }

  function synergyCheckImage(synergy) {
    if (!synergy.imageUrl) {
      return `<span class="synergy-check-icon fallback" aria-hidden="true">${escapeHtml(initials(synergy.name))}</span>`;
    }

    return `
      <span class="synergy-check-icon" aria-hidden="true">
        <img src="${escapeHtml(synergy.imageUrl)}" alt="">
      </span>
    `;
  }

  function renderCounterStageControl() {
    elements.counterStageControl.innerHTML = COUNTER_STAGE_OPTIONS.map((stage) => {
      const active = stage.id === state.counterStage ? "active" : "";
      return `<button class="${active}" type="button" data-counter-stage="${escapeHtml(stage.id)}">${escapeHtml(stage.label)}</button>`;
    }).join("");

    elements.counterStageControl.querySelectorAll("[data-counter-stage]").forEach((button) => {
      button.addEventListener("click", () => {
        state.counterStage = button.dataset.counterStage || "Mid";
        renderCounterAdvisor();
      });
    });
  }

  function levelOptionLabel(synergy, level) {
    const levels = synergyLevelOptions(synergy);
    return levels.length === 1 && level === 1 ? "Active" : `${level} pieces`;
  }

  function renderSynergyChecks(type, container) {
    const selected = new Set(state.counterSynergies);
    const synergies = reference.synergies.filter((synergy) => synergy.type === type);
    container.innerHTML = synergies
      .map((synergy) => {
        const checked = selected.has(synergy.id) ? "checked" : "";
        const disabled = checked ? "" : "disabled";
        const currentLevel = selectedCounterLevel(synergy);
        const levelOptions = synergyLevelOptions(synergy)
          .map((level) => {
            const selectedOption = level === currentLevel ? "selected" : "";
            return `<option value="${level}" ${selectedOption}>${escapeHtml(levelOptionLabel(synergy, level))}</option>`;
          })
          .join("");
        return `
          <label class="synergy-check ${checked ? "active" : ""}">
            <input type="checkbox" value="${escapeHtml(synergy.id)}" data-counter-synergy="${escapeHtml(synergy.id)}" ${checked}>
            ${synergyCheckImage(synergy)}
            <span class="synergy-check-name">${escapeHtml(synergy.name)}</span>
            <select class="synergy-level-select" data-counter-level="${escapeHtml(synergy.id)}" aria-label="${escapeHtml(synergy.name)} level" ${disabled}>
              ${levelOptions}
            </select>
          </label>
        `;
      })
      .join("");

    container.querySelectorAll("[data-counter-synergy]").forEach((input) => {
      input.addEventListener("change", () => {
        const next = new Set(state.counterSynergies);
        if (input.checked) {
          next.add(input.value);
          if (!state.counterLevels[input.value]) {
            const synergy = reference.synergies.find((item) => item.id === input.value);
            if (synergy) {
              state.counterLevels[input.value] = synergyLevelOptions(synergy)[0];
            }
          }
        } else {
          next.delete(input.value);
          delete state.counterLevels[input.value];
        }
        state.counterSynergies = [...next];
        renderCounterAdvisor();
      });
    });

    container.querySelectorAll("[data-counter-level]").forEach((select) => {
      select.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      select.addEventListener("change", () => {
        state.counterLevels[select.dataset.counterLevel] = Number(select.value);
        renderCounterAdvisor();
      });
    });
  }

  function renderThreatProfile(selectedSynergies, recommendations) {
    if (!selectedSynergies.length) {
      elements.counterThreatProfile.innerHTML = `<div class="empty-state compact-empty">No enemy synergies selected.</div>`;
      return;
    }

    const rules = selectedSynergies.map(counterRuleFor);
    const profile = unique(rules.flatMap((rule) => rule.profile)).slice(0, 8);
    const answers = unique(rules.flatMap((rule) => rule.answers)).slice(0, 6);
    const best = recommendations[0]?.build.name || "No recommendation";
    const stage = stageConfig();

    elements.counterThreatProfile.innerHTML = `
      <section class="advisor-stat">
        <span>Selected</span>
        <strong>${escapeHtml(selectedSynergies.map(selectedSynergyLabel).join(" + "))}</strong>
      </section>
      <section class="advisor-stat">
        <span>Stage</span>
        <strong>${escapeHtml(stage.label)} - ${escapeHtml(stage.description)}</strong>
      </section>
      <section class="advisor-stat">
        <span>Threat profile</span>
        <strong>${escapeHtml(profile.join(", "))}</strong>
      </section>
      <section class="advisor-stat">
        <span>Best counter</span>
        <strong>${escapeHtml(best)}</strong>
      </section>
      <section class="advisor-stat">
        <span>Counter priorities</span>
        <strong>${escapeHtml([stage.description, ...answers].join(", "))}</strong>
      </section>
    `;
  }

  function renderCounterRecommendationCard(item) {
    const build = item.build;
    const reasons = item.reasons.slice(0, 4);
    const playPattern = [...build.counterPlan, ...build.positioning].slice(0, 4);
    const itemPlan = build.items.slice(0, 3);
    const watchOut = build.weakInto.slice(0, 3);
    const traits = item.traits.length ? item.traits.map(traitLabel) : ["direct rule match"];
    const stage = stageConfig();
    const stageTone = item.stageAdjustment >= 2 ? "good" : item.stageAdjustment <= -2 ? "warn" : "";

    return `
      <article class="advisor-recommendation">
        <div class="recommendation-top">
          <div>
            <p class="eyebrow">${escapeHtml(build.tier)} Tier - ${escapeHtml(build.style)}</p>
            <h3>${escapeHtml(build.name)}</h3>
          </div>
          <span class="review-priority ${counterFitTone(item.fit)}">${recommendationPriority(item.fit)} ${item.fit}%</span>
        </div>

        <p>${escapeHtml(build.winCondition)}</p>
        <div class="chip-row">
          ${chip(`${stage.label} stage`, stageTone)}
          ${traits.slice(0, 5).map((trait) => chip(trait)).join("")}
        </div>

        <section class="advisor-explain">
          <h4>Why It Counters This</h4>
          ${list(reasons.map((reason) => `${reason.title}: ${reason.text}`), true)}
        </section>

        <section class="advisor-explain two-column">
          <div>
            <h4>Play Pattern</h4>
            ${list(playPattern, true)}
          </div>
          <div>
            <h4>Items To Look For</h4>
            ${list(itemPlan, true)}
          </div>
        </section>

        <section class="advisor-explain">
          <h4>Watch Outs</h4>
          ${chipRow(watchOut, "bad")}
        </section>

        <button class="mini-action" type="button" data-advisor-build="${escapeHtml(build.id)}">Open Build</button>
      </article>
    `;
  }

  function renderCounterRecommendations(selectedSynergies) {
    if (!selectedSynergies.length) {
      elements.counterRecommendationResults.innerHTML = "";
      return [];
    }

    const recommendations = buildCounterRecommendations(selectedSynergies).slice(0, 6);
    elements.counterRecommendationResults.innerHTML = recommendations.length
      ? `
        <div class="advisor-section-heading">
          <h2>Counter Recommendations</h2>
          <span>${recommendations.length} shown</span>
        </div>
        <div class="advisor-recommendation-list">
          ${recommendations.map(renderCounterRecommendationCard).join("")}
        </div>
      `
      : `<div class="empty-state compact-empty">No counter recommendations matched this selection.</div>`;

    elements.counterRecommendationResults.querySelectorAll("[data-advisor-build]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeView = "builds";
        state.query = "";
        state.tier = "All";
        state.style = "All";
        state.difficulty = "All";
        state.selectedId = button.dataset.advisorBuild;
        elements.searchInput.value = "";
        renderFilters();
        render();
      });
    });

    return recommendations;
  }

  function renderCounterBreakdown(selectedSynergies) {
    if (!selectedSynergies.length) {
      elements.counterSynergyBreakdown.innerHTML = "";
      return;
    }

    elements.counterSynergyBreakdown.innerHTML = `
      <div class="advisor-section-heading">
        <h2>Synergy Breakdown</h2>
      </div>
      <div class="synergy-breakdown-grid">
        ${selectedSynergies
          .map((synergy) => {
            const rule = counterRuleFor(synergy);
            return `
              <article class="synergy-breakdown-card">
                <div class="reference-card-top">
                  ${synergyCheckImage(synergy)}
                  <div class="reference-title">
                    <p class="eyebrow">${escapeHtml(synergy.type)} - ${escapeHtml(levelLabel(synergy))}</p>
                    <h3>${escapeHtml(synergy.name)}</h3>
                  </div>
                </div>
                <p>${escapeHtml(selectedLevelEffect(synergy))}</p>
                <section class="advisor-explain">
                  <h4>Counter Read</h4>
                  <p>${escapeHtml(`${rule.threat} ${levelStageText(synergy)}`)}</p>
                  <div class="chip-row">${rule.answers.slice(0, 4).map((answer) => chip(answer)).join("")}</div>
                </section>
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderCounterAdvisor() {
    renderCounterStageControl();
    renderSynergyChecks("Class", elements.counterClassList);
    renderSynergyChecks("Race", elements.counterRaceList);
    const selectedSynergies = selectedCounterSynergies();
    elements.counterSelectedCount.textContent = `${selectedSynergies.length} selected`;
    const recommendations = renderCounterRecommendations(selectedSynergies);
    renderThreatProfile(selectedSynergies, recommendations);
    renderCounterBreakdown(selectedSynergies);
  }

  function filteredBuilds() {
    const query = state.query.trim().toLowerCase();
    return builds.filter((build) => {
      const matchesQuery = !query || buildSearchText(build).includes(query);
      const matchesTier = state.tier === "All" || build.tier === state.tier;
      const matchesStyle = state.style === "All" || build.style === state.style;
      const matchesDifficulty = state.difficulty === "All" || build.difficulty === state.difficulty;
      return matchesQuery && matchesTier && matchesStyle && matchesDifficulty;
    });
  }

  function renderStats() {
    elements.statBuilds.textContent = builds.length;
    elements.statPieces.textContent = reference.pieces.length;
    elements.statItems.textContent = reference.items.length;
    elements.statSynergies.textContent = reference.synergies.length;
    elements.statUpdated.textContent = data.meta.updatedLabel;
  }

  function renderActiveView() {
    elements.viewTabs.forEach((button) => {
      const active = button.dataset.view === state.activeView;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });

    const buildsActive = state.activeView === "builds";
    const advisorActive = state.activeView === "advisor";
    const patchActive = state.activeView === "patch";
    const referenceActive = state.activeView === "reference";
    elements.buildsView.hidden = !buildsActive;
    elements.counterAdvisorView.hidden = !advisorActive;
    elements.patchDashboardView.hidden = !patchActive;
    elements.referenceView.hidden = !referenceActive;
    elements.buildsView.classList.toggle("active", buildsActive);
    elements.counterAdvisorView.classList.toggle("active", advisorActive);
    elements.patchDashboardView.classList.toggle("active", patchActive);
    elements.referenceView.classList.toggle("active", referenceActive);
  }

  function renderPatchNotes() {
    const notes = activePatchNotes();
    if (!notes) {
      return;
    }

    elements.patchTitle.textContent = `${notes.title} - ${notes.date}`;
    elements.patchSourceLink.href = notes.sourceUrl || "#";
    elements.patchSourceLink.textContent = notes.sourceLabel || "Official notes";
    elements.footerSourceNote.textContent = data.meta.sourceNote;
    elements.patchHighlights.innerHTML = notes.highlights
      .map((section) => `
        <section class="patch-card">
          <h3>${escapeHtml(section.title)}</h3>
          ${list(section.items)}
        </section>
      `)
      .join("");
  }

  function activePatchNotes() {
    return patchData || data.meta.patchNotes;
  }

  function normalizeForMatch(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9%]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanPatchLine(value) {
    return String(value || "")
      .replace(/^\s*\d+\.\s*/, "")
      .trim();
  }

  function patchEntries() {
    const notes = activePatchNotes();
    if (!notes?.highlights) {
      return [];
    }

    return notes.highlights.flatMap((section) =>
      section.items.map((item) => ({
        section: section.title,
        text: cleanPatchLine(item)
      }))
    );
  }

  function referenceCollections() {
    return [
      { type: "pieces", label: "Piece", records: reference.pieces },
      { type: "items", label: "Item", records: reference.items },
      { type: "synergies", label: "Synergy", records: reference.synergies }
    ];
  }

  function textMentionsName(text, name) {
    const needle = normalizeForMatch(name);
    const haystack = ` ${normalizeForMatch(text)} `;
    return needle.length > 2 && haystack.includes(` ${needle} `);
  }

  function affectedReferences() {
    const entries = patchEntries();
    return referenceCollections()
      .flatMap((collection) =>
        collection.records.map((record) => {
          const matches = entries.filter((entry) => {
            const synergyContext = /synergy|race|class/i.test(`${entry.section} ${entry.text}`);
            return textMentionsName(entry.text, record.name) && (collection.type !== "synergies" || synergyContext);
          });
          return matches.length ? { ...collection, record, matches } : null;
        })
      )
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label) || a.record.name.localeCompare(b.record.name));
  }

  function buildFieldGroups(build) {
    return [
      { label: "Tags", weight: 3, values: build.tags },
      { label: "Core", weight: 3, values: build.core },
      { label: "Items", weight: 3, values: build.items },
      { label: "Counter Plan", weight: 2, values: build.counterPlan },
      { label: "Strong Into", weight: 1, values: build.strongInto },
      { label: "Weak Into", weight: 2, values: build.weakInto },
      { label: "Pivots", weight: 1, values: build.pivots },
      { label: "Notes", weight: 1, values: [build.note, build.winCondition, build.style, build.timing] }
    ];
  }

  function directBuildMatch(build, name) {
    return buildFieldGroups(build).find((group) => textMentionsName(flattenText(group.values), name));
  }

  function keywordImpacts(build) {
    const searchText = normalizeForMatch(buildSearchText(build));
    const entries = patchEntries();
    const terms = ["Elite Forces", "Siphon", "Cocoon", "lifesteal", "ranged", "Crystal Sword", "Broken Sword"];
    return terms
      .map((term) => {
        if (!searchText.includes(normalizeForMatch(term))) {
          return null;
        }

        const entry = entries.find((patchEntry) => textMentionsName(patchEntry.text, term) || normalizeForMatch(patchEntry.section).includes(normalizeForMatch(term)));
        if (!entry) {
          return null;
        }

        return {
          label: term,
          type: "Rule",
          field: "Patch Rule",
          section: entry.section,
          reason: entry.text,
          weight: term === "ranged" || term === "lifesteal" ? 2 : 3
        };
      })
      .filter(Boolean);
  }

  function buildReviewQueue() {
    const affected = affectedReferences();
    const queue = builds
      .map((build) => {
        const impacts = affected
          .map((affectedRecord) => {
            const match = directBuildMatch(build, affectedRecord.record.name);
            if (!match) {
              return null;
            }

            return {
              label: affectedRecord.record.name,
              type: affectedRecord.label,
              field: match.label,
              section: affectedRecord.matches[0].section,
              reason: affectedRecord.matches[0].text,
              weight: match.weight
            };
          })
          .filter(Boolean)
          .concat(keywordImpacts(build));

        const deduped = [];
        for (const impact of impacts) {
          if (!deduped.some((item) => item.label === impact.label && item.section === impact.section)) {
            deduped.push(impact);
          }
        }

        if (!deduped.length) {
          return null;
        }

        const topWeight = Math.max(...deduped.map((impact) => impact.weight));
        const priority = topWeight >= 3 ? "High" : deduped.length > 1 ? "Medium" : "Watch";
        return { build, impacts: deduped.sort((a, b) => b.weight - a.weight), priority };
      })
      .filter(Boolean);

    const priorityOrder = { High: 0, Medium: 1, Watch: 2 };
    const tierOrder = { S: 0, A: 1, B: 2 };
    return queue.sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      (tierOrder[a.build.tier] ?? 9) - (tierOrder[b.build.tier] ?? 9) ||
      b.build.score - a.build.score
    );
  }

  function sectionFocus(title) {
    const focus = {
      "Piece Adjustment": "Check affected cores, carry targeting, tempo breakpoints, and counter notes.",
      "Item Adjustments": "Check item priorities, carrier recommendations, and anti-carry counters.",
      "Talent Adjustments": "Check talent callouts in early plans, economy lines, and late-game pivots.",
      "Battle Adjustments": "Check ranged boards, lifesteal assumptions, and positioning notes.",
      "Item Alternation": "Check item availability, replacement items, and damage-item language.",
      "Fixes": "Check counter text that depends on the fixed interaction.",
      "Other": "Check only if a build note directly mentions the affected cast or unit."
    };
    return focus[title] || "Check any build, counter, or reference text that mentions this section.";
  }

  function renderDashboardSummary(notes, affected, queue) {
    const sections = notes.highlights?.length || 0;
    const entries = patchEntries().length;
    const directBuilds = queue.filter((item) => item.priority === "High").length;
    return `
      <div class="dashboard-stat">
        <span>Patch</span>
        <strong>${escapeHtml(notes.date || "Unknown")}</strong>
      </div>
      <div class="dashboard-stat">
        <span>Sections</span>
        <strong>${sections}</strong>
      </div>
      <div class="dashboard-stat">
        <span>Patch Lines</span>
        <strong>${entries}</strong>
      </div>
      <div class="dashboard-stat">
        <span>Affected Records</span>
        <strong>${affected.length}</strong>
      </div>
      <div class="dashboard-stat">
        <span>High Priority</span>
        <strong>${directBuilds}</strong>
      </div>
    `;
  }

  function priorityTone(priority) {
    if (priority === "High") {
      return "bad";
    }
    if (priority === "Medium") {
      return "warn";
    }
    return "good";
  }

  function renderPatchDashboard() {
    const notes = activePatchNotes();
    if (!notes) {
      return;
    }

    const affected = affectedReferences();
    const queue = buildReviewQueue();
    elements.dashboardPatchTitle.textContent = `${notes.title} - ${notes.date}`;
    elements.dashboardPatchSourceLink.href = notes.sourceUrl || "#";
    elements.dashboardPatchSourceLink.textContent = notes.sourceLabel || "Patch source";
    elements.patchDashboardSummary.innerHTML = renderDashboardSummary(notes, affected, queue);
    elements.patchReviewCount.textContent = `${queue.length} builds`;
    elements.patchAffectedCount.textContent = `${affected.length} records`;

    elements.patchReviewQueue.innerHTML = queue.length
      ? queue.map(({ build, impacts, priority }) => `
        <article class="review-row">
          <div class="review-row-main">
            <div>
              <p class="eyebrow">${escapeHtml(build.tier)} Tier - ${escapeHtml(build.style)}</p>
              <h3>${escapeHtml(build.name)}</h3>
            </div>
            <span class="review-priority ${priorityTone(priority)}">${escapeHtml(priority)}</span>
          </div>
          <div class="chip-row">
            ${impacts.slice(0, 5).map((impact) => chip(`${impact.label} / ${impact.field}`)).join("")}
          </div>
          <p>${escapeHtml(impacts[0].reason)}</p>
          <button class="mini-action" type="button" data-dashboard-build="${escapeHtml(build.id)}">Open Build</button>
        </article>
      `).join("")
      : `<div class="empty-state compact-empty">No builds matched the current patch text.</div>`;

    elements.patchAffectedList.innerHTML = affected.length
      ? affected.map((item) => `
        <article class="affected-row">
          <div>
            <p class="eyebrow">${escapeHtml(item.label)} - ${escapeHtml(item.matches[0].section)}</p>
            <h3>${escapeHtml(item.record.name)}</h3>
          </div>
          <p>${escapeHtml(item.matches[0].text)}</p>
          <button class="mini-action ghost" type="button" data-dashboard-reference-type="${escapeHtml(item.type)}" data-dashboard-reference-name="${escapeHtml(item.record.name)}">Open Reference</button>
        </article>
      `).join("")
      : `<div class="empty-state compact-empty">No reference records matched the current patch text.</div>`;

    elements.patchSectionList.innerHTML = (notes.highlights || [])
      .map((section) => {
        const sectionAffected = affected.filter((item) => item.matches.some((match) => match.section === section.title));
        const sectionBuilds = queue.filter((item) => item.impacts.some((impact) => impact.section === section.title));
        return `
          <article class="section-review-card">
            <div class="section-review-top">
              <h3>${escapeHtml(section.title)}</h3>
              <span>${section.items.length} lines</span>
            </div>
            <p>${escapeHtml(sectionFocus(section.title))}</p>
            <div class="chip-row">
              ${chip(`${sectionAffected.length} records`, "good")}
              ${chip(`${sectionBuilds.length} builds`, sectionBuilds.length ? "bad" : "good")}
            </div>
          </article>
        `;
      })
      .join("");

    elements.patchReviewQueue.querySelectorAll("[data-dashboard-build]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeView = "builds";
        state.query = "";
        state.tier = "All";
        state.style = "All";
        state.difficulty = "All";
        state.selectedId = button.dataset.dashboardBuild;
        elements.searchInput.value = "";
        renderFilters();
        render();
      });
    });

    elements.patchAffectedList.querySelectorAll("[data-dashboard-reference-type]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeView = "reference";
        state.referenceType = button.dataset.dashboardReferenceType;
        state.referenceQuery = button.dataset.dashboardReferenceName;
        state.referencePrimary = "All";
        state.referenceSecondary = "All";
        elements.referenceSearchInput.value = state.referenceQuery;
        renderReferenceLibrary();
        renderActiveView();
      });
    });
  }

  function renderTierFilters() {
    const tiers = ["All", "S", "A", "B"];
    elements.tierFilters.innerHTML = tiers
      .map((tier) => {
        const active = state.tier === tier ? "active" : "";
        return `<button class="${active}" type="button" data-tier="${tier}">${tier}</button>`;
      })
      .join("");

    elements.tierFilters.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        state.tier = button.dataset.tier;
        render();
      });
    });
  }

  function populateSelect(select, options, selectedValue) {
    select.innerHTML = options
      .map((option) => {
        const selected = option === selectedValue ? "selected" : "";
        return `<option ${selected} value="${escapeHtml(option)}">${escapeHtml(option)}</option>`;
      })
      .join("");
  }

  function renderFilters() {
    populateSelect(elements.styleFilter, ["All", ...unique(builds.map((build) => build.style))], state.style);
    populateSelect(elements.difficultyFilter, ["All", ...unique(builds.map((build) => build.difficulty))], state.difficulty);
    populateSelect(elements.enemySelect, builds.map((build) => build.name), getBuild(state.enemyId)?.name || builds[0].name);
  }

  function getBuild(id) {
    return builds.find((build) => build.id === id);
  }

  function getBuildByName(name) {
    return builds.find((build) => build.name === name);
  }

  function renderBuildList() {
    const shown = filteredBuilds();
    elements.resultCount.textContent = `${shown.length} shown`;

    if (!shown.length) {
      elements.buildList.innerHTML = `<div class="empty-state">No builds match the current filters.</div>`;
      return false;
    }

    if (!shown.some((build) => build.id === state.selectedId)) {
      state.selectedId = shown[0].id;
    }

    elements.buildList.innerHTML = shown
      .map((build) => {
        const active = build.id === state.selectedId ? "active" : "";
        return `
          <button class="build-card ${active}" type="button" data-build-id="${escapeHtml(build.id)}">
            <div class="build-card-top">
              <div>
                <h3>${escapeHtml(build.name)}</h3>
                <p>${escapeHtml(build.style)} - ${escapeHtml(build.timing)}</p>
              </div>
              <span class="tier-badge ${tierClass(build.tier)}">${escapeHtml(build.tier)}</span>
            </div>
            ${chipRow(build.tags)}
            <p>${escapeHtml(build.winCondition)}</p>
          </button>
        `;
      })
      .join("");

    elements.buildList.querySelectorAll(".build-card").forEach((card) => {
      card.addEventListener("click", () => {
        state.selectedId = card.dataset.buildId;
        render();
      });
    });

    return true;
  }

  function renderDetail() {
    const build = getBuild(state.selectedId);
    if (!build) {
      elements.detailPanel.innerHTML = `<div class="empty-state">Select a build to view details.</div>`;
      return;
    }

    elements.detailPanel.innerHTML = `
      <article class="detail-shell">
        <section class="detail-hero">
          <div class="detail-title-row">
            <div>
              <p class="eyebrow">${escapeHtml(build.style)}</p>
              <h2>${escapeHtml(build.name)}</h2>
            </div>
            <div class="chip-row">
              <span class="tier-badge ${tierClass(build.tier)}">${escapeHtml(build.tier)}</span>
              <span class="score-badge">${escapeHtml(build.score)}%</span>
            </div>
          </div>
          <p class="subhead">${escapeHtml(build.winCondition)}</p>
          ${chipRow(build.tags)}
          <div class="detail-summary">
            <div class="summary-tile">
              <span>Timing</span>
              <strong>${escapeHtml(build.timing)}</strong>
            </div>
            <div class="summary-tile">
              <span>Difficulty</span>
              <strong>${escapeHtml(build.difficulty)}</strong>
            </div>
            <div class="summary-tile">
              <span>Pivot Count</span>
              <strong>${build.pivots.length}</strong>
            </div>
          </div>
        </section>

        <div class="section-grid">
          ${infoSection("Core Pieces", chipRow(build.core))}
          ${infoSection("Early Line", list(build.early))}
          ${infoSection("Items", list(build.items))}
          ${infoSection("Positioning", list(build.positioning))}
          ${infoSection("Strong Into", chipRow(build.strongInto, "good"))}
          ${infoSection("Weak Into", chipRow(build.weakInto, "bad"))}
          ${infoSection("Counter Plan", list(build.counterPlan, true), true)}
          ${infoSection("Pivots", chipRow(build.pivots), true)}
        </div>

        <div class="note-block">${escapeHtml(build.note)}</div>
        ${sourceLink(build)}
      </article>
    `;
  }

  function infoSection(title, body, full) {
    return `
      <section class="info-section ${full ? "full" : ""}">
        <h3>${escapeHtml(title)}</h3>
        ${body}
      </section>
    `;
  }

  function renderCounterFinder() {
    const enemy = getBuild(state.enemyId) || builds[0];
    const punishBuilds = enemy.punishWith.map(getBuild).filter(Boolean);

    elements.counterResults.innerHTML = `
      <section class="counter-card featured">
        <h3>Attack Plan</h3>
        ${list(enemy.counterPlan, true)}
      </section>
      <section class="counter-card">
        <h3>Builds To Consider</h3>
        ${punishBuilds.length ? chipRow(punishBuilds.map((build) => build.name), "good") : "<p>No direct picks listed.</p>"}
      </section>
      <section class="counter-card">
        <h3>Watch For</h3>
        ${chipRow(enemy.strongInto, "bad")}
      </section>
    `;
  }

  function referenceConfig() {
    if (state.referenceType === "items") {
      return {
        records: reference.items,
        empty: "No items match the current filters.",
        primaryLabel: "Quality",
        secondaryLabel: "Category",
        primaryOptions: ["All", ...unique(reference.items.map((item) => item.quality))],
        secondaryOptions: ["All", ...unique(reference.items.flatMap((item) => asArray(item.categories)))],
        matches: (item) => {
          const qualityMatch = state.referencePrimary === "All" || item.quality === state.referencePrimary;
          const categoryMatch = state.referenceSecondary === "All" || asArray(item.categories).includes(state.referenceSecondary);
          return qualityMatch && categoryMatch;
        },
        render: renderItemCard
      };
    }

    if (state.referenceType === "synergies") {
      return {
        records: reference.synergies,
        empty: "No synergies match the current filters.",
        primaryLabel: "Type",
        secondaryLabel: "Contains piece",
        primaryOptions: ["All", ...unique(reference.synergies.map((synergy) => synergy.type))],
        secondaryOptions: ["All", ...unique(reference.synergies.flatMap((synergy) => asArray(synergy.pieces)))],
        matches: (synergy) => {
          const typeMatch = state.referencePrimary === "All" || synergy.type === state.referencePrimary;
          const pieceMatch = state.referenceSecondary === "All" || asArray(synergy.pieces).includes(state.referenceSecondary);
          return typeMatch && pieceMatch;
        },
        render: renderSynergyCard
      };
    }

    return {
      records: reference.pieces,
      empty: "No pieces match the current filters.",
      primaryLabel: "Quality",
      secondaryLabel: "Race/Class",
      primaryOptions: ["All", ...unique(reference.pieces.map((piece) => piece.quality))],
      secondaryOptions: ["All", ...unique(reference.pieces.flatMap((piece) => [...asArray(piece.races), ...asArray(piece.classes)]))],
      matches: (piece) => {
        const qualityMatch = state.referencePrimary === "All" || piece.quality === state.referencePrimary;
        const groupMatch = state.referenceSecondary === "All" || asArray(piece.races).includes(state.referenceSecondary) || asArray(piece.classes).includes(state.referenceSecondary);
        return qualityMatch && groupMatch;
      },
      render: renderPieceCard
    };
  }

  function renderReferenceTabs() {
    const tabs = [
      ["pieces", `Pieces (${reference.pieces.length})`],
      ["items", `Items (${reference.items.length})`],
      ["synergies", `Synergies (${reference.synergies.length})`]
    ];

    elements.referenceTabs.innerHTML = tabs
      .map(([type, label]) => {
        const active = type === state.referenceType ? "active" : "";
        return `<button class="${active}" type="button" data-reference-type="${type}">${escapeHtml(label)}</button>`;
      })
      .join("");

    elements.referenceTabs.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        state.referenceType = button.dataset.referenceType;
        state.referencePrimary = "All";
        state.referenceSecondary = "All";
        renderReferenceLibrary();
      });
    });
  }

  function renderReferenceFilters(config) {
    if (!config.primaryOptions.includes(state.referencePrimary)) {
      state.referencePrimary = "All";
    }
    if (!config.secondaryOptions.includes(state.referenceSecondary)) {
      state.referenceSecondary = "All";
    }

    elements.referencePrimaryLabel.textContent = config.primaryLabel;
    elements.referenceSecondaryLabel.textContent = config.secondaryLabel;
    populateSelect(elements.referencePrimaryFilter, config.primaryOptions, state.referencePrimary);
    populateSelect(elements.referenceSecondaryFilter, config.secondaryOptions, state.referenceSecondary);
  }

  function filteredReferenceRecords(config) {
    const query = state.referenceQuery.trim().toLowerCase();
    return config.records.filter((record) => {
      const matchesQuery = !query || flattenText(record).toLowerCase().includes(query);
      return matchesQuery && config.matches(record);
    });
  }

  function statTile(label, value) {
    return `
      <div class="micro-stat">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(displayValue(value, "-"))}</strong>
      </div>
    `;
  }

  function referenceCopy(title, value) {
    return `
      <section class="reference-copy">
        <h4>${escapeHtml(title)}</h4>
        ${textBlock(value)}
      </section>
    `;
  }

  function renderPieceCard(piece) {
    return `
      <article class="reference-card">
        <div class="reference-card-top">
          ${referenceImage(piece, "piece")}
          <div class="reference-title">
            <p class="eyebrow">${escapeHtml(displayValue(piece.quality, "Piece"))} - Cost ${escapeHtml(displayValue(piece.cost, "?"))}</p>
            <h3>${escapeHtml(piece.name)}</h3>
            ${piece.title ? `<p class="reference-subtitle">${escapeHtml(piece.title)}</p>` : ""}
          </div>
        </div>
        ${chipRow([...asArray(piece.races), ...asArray(piece.classes)])}
        <div class="micro-grid">
          ${statTile("HP", piece.hp)}
          ${statTile("ATK", piece.attack)}
          ${statTile("Armor", piece.armor)}
          ${statTile("AS", piece.attackSpeed)}
          ${statTile("Range", piece.range)}
          ${statTile("MR", piece.magicResist)}
        </div>
        <section class="reference-copy">
          <h4>${escapeHtml(displayValue(piece.abilityName, "Ability"))}</h4>
          ${textBlock(piece.ability)}
        </section>
        ${piece.patchNote ? `<div class="note-block compact-note">${escapeHtml(piece.patchNote)}</div>` : ""}
        ${sourceLinks(piece)}
      </article>
    `;
  }

  function renderItemCard(item) {
    return `
      <article class="reference-card">
        <div class="reference-card-top">
          ${referenceImage(item, "item")}
          <div class="reference-title">
            <p class="eyebrow">${escapeHtml(displayValue(item.quality, "Item"))}</p>
            <h3>${escapeHtml(item.name)}</h3>
          </div>
        </div>
        ${chipRow(asArray(item.categories))}
        ${item.attributes ? referenceCopy("Attributes", item.attributes) : ""}
        ${item.effect ? referenceCopy("Effect", item.effect) : ""}
        ${item.recipe ? referenceCopy("Recipe", item.recipe) : ""}
        ${item.patchNote ? `<div class="note-block compact-note">${escapeHtml(item.patchNote)}</div>` : ""}
        ${sourceLinks(item)}
      </article>
    `;
  }

  function renderSynergyCard(synergy) {
    return `
      <article class="reference-card">
        <div class="reference-card-top">
          ${referenceImage(synergy, "synergy")}
          <div class="reference-title">
            <p class="eyebrow">${escapeHtml(synergy.type)}</p>
            <h3>${escapeHtml(synergy.name)}</h3>
            ${synergy.abilityName ? `<p class="reference-subtitle">${escapeHtml(synergy.abilityName)}</p>` : ""}
          </div>
        </div>
        <section class="reference-copy">
          <h4>Effect</h4>
          ${textBlock(synergy.effect)}
        </section>
        <section class="reference-copy">
          <h4>Pieces</h4>
          ${asArray(synergy.pieces).length ? chipRow(synergy.pieces) : `<p class="muted-text">No current pieces listed.</p>`}
        </section>
        ${synergy.patchNote ? `<div class="note-block compact-note">${escapeHtml(synergy.patchNote)}</div>` : ""}
        ${sourceLinks(synergy)}
      </article>
    `;
  }

  function renderReferenceLibrary() {
    renderReferenceTabs();
    const config = referenceConfig();
    renderReferenceFilters(config);
    const shown = filteredReferenceRecords(config);

    elements.referenceSummary.textContent = `${shown.length} shown`;
    elements.referenceSourceNote.textContent = reference.meta?.sourceNote || "";

    if (!shown.length) {
      elements.referenceList.innerHTML = `<div class="empty-state">${escapeHtml(config.empty)}</div>`;
      return;
    }

    elements.referenceList.innerHTML = shown.map((record) => config.render(record)).join("");
  }

  function render() {
    renderActiveView();
    renderTierFilters();
    const hasResults = renderBuildList();
    if (hasResults) {
      renderDetail();
    } else {
      elements.detailPanel.innerHTML = `<div class="empty-state">Try a different search or filter.</div>`;
    }
    renderCounterFinder();
    renderCounterAdvisor();
  }

  function bindEvents() {
    elements.viewTabs.forEach((button) => {
      button.addEventListener("click", () => {
        state.activeView = button.dataset.view || "builds";
        renderActiveView();
      });
    });

    elements.searchInput.addEventListener("input", (event) => {
      state.query = event.target.value;
      render();
    });

    elements.styleFilter.addEventListener("change", (event) => {
      state.style = event.target.value;
      render();
    });

    elements.difficultyFilter.addEventListener("change", (event) => {
      state.difficulty = event.target.value;
      render();
    });

    elements.enemySelect.addEventListener("change", (event) => {
      const build = getBuildByName(event.target.value);
      state.enemyId = build?.id || state.enemyId;
      renderCounterFinder();
    });

    elements.counterClearButton.addEventListener("click", () => {
      state.counterSynergies = [];
      state.counterLevels = {};
      renderCounterAdvisor();
    });

    elements.referenceSearchInput.addEventListener("input", (event) => {
      state.referenceQuery = event.target.value;
      renderReferenceLibrary();
    });

    elements.referencePrimaryFilter.addEventListener("change", (event) => {
      state.referencePrimary = event.target.value;
      renderReferenceLibrary();
    });

    elements.referenceSecondaryFilter.addEventListener("change", (event) => {
      state.referenceSecondary = event.target.value;
      renderReferenceLibrary();
    });
  }

  function init() {
    renderStats();
    renderPatchNotes();
    renderPatchDashboard();
    renderFilters();
    renderReferenceLibrary();
    renderCounterAdvisor();
    renderActiveView();
    bindEvents();
    render();
  }

  init();
})();
