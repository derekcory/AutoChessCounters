const fs = require("fs");
const path = require("path");

const DEFAULT_INSTALL = "D:/Program Files/steamapps/common/Auto Chess";
const STEAM_NEWS_API = "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=1530300&count=10&maxlength=20000&format=json";
const STEAM_NEWS_URL = "https://store.steampowered.com/news/app/1530300";

const LANGUAGE_MARKERS = [
  "Chinese",
  "Japanese",
  "ChineseTraditional",
  "English",
  "French",
  "Spanish",
  "Russian",
  "Korean",
  "German",
  "Portuguese",
  "Vietnamese",
  "Thai",
  "Indonesian",
  "Turkish",
  "Spanish-Europe",
  "Italian",
  "Arabic"
];

function decodePbName(fileName) {
  const baseName = fileName.replace(/\.dat$/, "");
  try {
    return Buffer.from(baseName, "base64").toString("utf8");
  } catch {
    return "";
  }
}

function extractEnglishSegment(rawText) {
  const start = rawText.indexOf("English");
  if (start < 0) {
    return "";
  }

  let end = rawText.length;
  for (const marker of LANGUAGE_MARKERS.filter((marker) => marker !== "English")) {
    const index = rawText.indexOf(marker, start + "English".length);
    if (index > start && index < end) {
      end = index;
    }
  }

  return cleanText(rawText.slice(start + "English".length, end));
}

function cleanText(value) {
  return String(value || "")
    .replace(/<\/image="[^"]+">\s*/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]+/g, "")
    .replace(/\uFFFD/g, "")
    .replace(/^[^A-Za-z0-9\[]+/, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function dateFromKey(key) {
  const match = key.match(/(20\d{6})/);
  if (!match) {
    return "";
  }

  const raw = match[1];
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function patchKindScore(decodedName) {
  if (/^gm_zx_/.test(decodedName)) {
    return 3;
  }
  if (/^gm_tz_/.test(decodedName)) {
    return 2;
  }
  return 0;
}

function findLocalPatch(installPath) {
  const pbDir = path.join(installPath, "Cache", "Pb");
  if (!fs.existsSync(pbDir)) {
    return null;
  }

  const pairs = new Map();
  for (const fileName of fs.readdirSync(pbDir)) {
    if (!fileName.endsWith(".dat")) {
      continue;
    }

    const decodedName = decodePbName(fileName);
    const match = decodedName.match(/^(gm_(?:zx|tz))_(tt|ct)_?(20\d{6}\d*)$/);
    if (!match) {
      continue;
    }

    const [, family, type, dateKey] = match;
    const key = `${family}_${dateKey}`;
    const entry = pairs.get(key) || { family, dateKey, titleFile: "", contentFile: "", titleDecodedName: "", contentDecodedName: "" };
    if (type === "tt") {
      entry.titleFile = path.join(pbDir, fileName);
      entry.titleDecodedName = decodedName;
    } else {
      entry.contentFile = path.join(pbDir, fileName);
      entry.contentDecodedName = decodedName;
    }
    pairs.set(key, entry);
  }

  const candidates = [...pairs.values()]
    .filter((entry) => entry.titleFile && entry.contentFile && dateFromKey(entry.dateKey))
    .sort((a, b) => {
      const dateCompare = dateFromKey(b.dateKey).localeCompare(dateFromKey(a.dateKey));
      if (dateCompare) {
        return dateCompare;
      }
      return patchKindScore(b.titleDecodedName) - patchKindScore(a.titleDecodedName);
    });

  const latest = candidates[0];
  if (!latest) {
    return null;
  }

  const titleText = extractEnglishSegment(fs.readFileSync(latest.titleFile, "utf8"));
  const contentText = extractEnglishSegment(fs.readFileSync(latest.contentFile, "utf8"));
  if (!contentText) {
    return null;
  }

  return {
    title: titleText || titleFromDate(dateFromKey(latest.dateKey)),
    date: dateFromKey(latest.dateKey),
    content: contentText,
    sourceLabel: "Local Steam game cache",
    sourceUrl: STEAM_NEWS_URL,
    sourceNote: `Extracted from local Auto Chess cache file ${path.basename(latest.contentFile)} (${latest.contentDecodedName}).`,
    rawKey: latest.contentDecodedName
  };
}

function titleFromDate(date) {
  if (!date) {
    return "Latest Auto Chess Update";
  }
  const [, month, day] = date.split("-");
  return `${Number(month)}.${Number(day)} ONLINE UPDATE`;
}

function sectionTitle(line) {
  const match = line.match(/^\[(.+?)\]$/);
  return match ? match[1].trim() : "";
}

function summarizeContent(content) {
  const sections = [];
  let current = null;
  let currentItem = "";

  function flushItem() {
    if (!current || !currentItem) {
      return;
    }
    current.items.push(currentItem.replace(/\s+/g, " ").trim());
    currentItem = "";
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || /^Dear Players/i.test(line) || /^Auto Chess will undergo/i.test(line) || /^Above is/i.test(line) || /^Auto Chess Operation Team/i.test(line)) {
      continue;
    }

    const heading = sectionTitle(line);
    if (heading) {
      flushItem();
      current = { title: heading, items: [] };
      sections.push(current);
      continue;
    }

    if (!current) {
      continue;
    }

    if (/^\d+\./.test(line)) {
      flushItem();
      currentItem = line;
    } else if (currentItem) {
      currentItem += ` ${line}`;
    }
  }

  flushItem();

  return sections
    .filter((section) => section.items.length)
    .map((section) => ({
      title: section.title,
      items: section.items.slice(0, 6)
    }))
    .slice(0, 8);
}

async function fetchSteamPatch() {
  const response = await fetch(STEAM_NEWS_API);
  const payload = await response.json();
  const item = payload.appnews?.newsitems?.find((entry) => /patch|maintenance|update/i.test(`${entry.title} ${entry.tags?.join(" ") || ""}`));
  if (!item) {
    throw new Error("No Steam patch/news item found.");
  }

  const content = cleanSteamContent(item.contents || "");
  return {
    title: item.title,
    date: new Date(item.date * 1000).toISOString().slice(0, 10),
    content,
    sourceLabel: "Steam news",
    sourceUrl: `https://store.steampowered.com/news/app/1530300/view/${item.gid}`,
    sourceNote: "Extracted from Steam news API.",
    rawKey: item.gid
  };
}

function cleanSteamContent(value) {
  return String(value || "")
    .replace(/\{STEAM_CLAN_IMAGE\}\/\d+\//g, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function writePatchData(patch) {
  const highlights = summarizeContent(patch.content);
  const output = {
    title: patch.title,
    date: `${patch.date} (${patch.sourceLabel})`,
    sourceUrl: patch.sourceUrl,
    sourceLabel: patch.sourceLabel,
    sourceNote: patch.sourceNote,
    rawKey: patch.rawKey,
    highlights
  };

  fs.writeFileSync("patch-data.js", `window.AUTO_CHESS_PATCH_DATA = ${JSON.stringify(output, null, 2)};\n`, "utf8");
  console.log(`Updated patch-data.js: ${output.title} - ${output.date}; ${highlights.length} sections.`);
}

async function main() {
  const installPath = process.env.AUTO_CHESS_INSTALL || DEFAULT_INSTALL;
  const localPatch = findLocalPatch(installPath);
  if (localPatch) {
    writePatchData(localPatch);
    return;
  }

  console.warn(`No local patch cache found at ${installPath}; falling back to Steam news.`);
  writePatchData(await fetchSteamPatch());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
