const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const REPORT_PATH = path.join(ROOT, "PATCH_UPDATE_REPORT.md");

function runStep(label, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: false
  });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  const ok = result.status === 0;
  const commandText = [command, ...args].join(" ");

  console.log(`\n== ${label} ==`);
  if (stdout) {
    process.stdout.write(stdout.endsWith("\n") ? stdout : `${stdout}\n`);
  }
  if (stderr) {
    process.stderr.write(stderr.endsWith("\n") ? stderr : `${stderr}\n`);
  }

  if (!ok && options.required !== false) {
    const error = new Error(`${label} failed with exit code ${result.status}.`);
    error.step = { label, commandText, ok, status: result.status, stdout, stderr };
    throw error;
  }

  return { label, commandText, ok, status: result.status, stdout, stderr };
}

function loadWindowData(fileName, key) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, fileName), "utf8"), context, { timeout: 5000 });
  return context.window[key];
}

function parseAudit(stdout) {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return null;
  }
}

function commandResult(value) {
  return value ? "Passed" : "Warning";
}

function sourceLink(label, url) {
  return url ? `[${label}](${url})` : label;
}

function writeReport({ steps, auditStep }) {
  const patch = loadWindowData("patch-data.js", "AUTO_CHESS_PATCH_DATA");
  const reference = loadWindowData("reference-data.js", "AUTO_CHESS_REFERENCE");
  const audit = auditStep?.ok ? parseAudit(auditStep.stdout) : null;
  const auditWarning = auditStep?.stderr?.trim() || "";
  const generatedAt = new Date().toISOString();
  const installPath = audit?.installPath || process.env.AUTO_CHESS_INSTALL || "D:/Program Files/steamapps/common/Auto Chess";
  const assetDate = audit?.assetDate || "Unknown";
  const cacheDate = audit?.latestPatchCache?.date || "Unknown";
  const cacheStatus = assetDate !== "Unknown" && cacheDate !== "Unknown" && cacheDate > assetDate
    ? "Local patch cache is newer than the asset table; keep hotfix patch notes as overrides."
    : "Local asset table is not older than the newest detected patch cache.";

  const commandRows = steps
    .map((step) => `| ${step.label} | \`${step.commandText}\` | ${commandResult(step.ok)} |`)
    .join("\n");

  const lines = [
    "# Auto Chess Patch Update Report",
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Summary",
    "",
    `- Latest patch: ${patch?.title || "Unknown"} (${patch?.date || "Unknown date"})`,
    `- Patch source: ${sourceLink(patch?.sourceLabel || "Patch source", patch?.sourceUrl)}`,
    `- Reference records: ${reference?.pieces?.length || 0} pieces, ${reference?.items?.length || 0} items, ${reference?.synergies?.length || 0} synergies`,
    `- Local install checked: \`${installPath}\``,
    `- Local asset table date: ${assetDate}`,
    `- Newest local patch cache date: ${cacheDate}`,
    `- Freshness read: ${cacheStatus}`,
    "",
    "## Command Results",
    "",
    "| Step | Command | Result |",
    "| --- | --- | --- |",
    commandRows,
    "",
    "## Local Audit",
    "",
    audit
      ? `- Parsed ${audit.counts.totalRecords} local config records, including ${audit.counts.pieceRecords} piece records, ${audit.counts.equipmentRecords} equipment records, and ${audit.counts.skillRecords} skill records.`
      : "- Local audit did not complete. Patch and reference data were still regenerated from available web/Steam sources.",
    auditWarning ? `- Audit warning: ${auditWarning}` : "- Audit warning: None.",
    "",
    "## Manual Review Checklist",
    "",
    "- Open the site and check the Patch Review tab.",
    "- Review affected pieces, items, and synergies for stale Dragonest data.",
    "- Update `data.js` if the patch changes build strength, counter plans, or item priorities.",
    "- Run the Counter Advisor against common ladder comps and adjust confidence/counter rules if the recommendations feel off.",
    "- Commit and push the regenerated files to publish through GitHub Pages.",
    ""
  ];

  fs.writeFileSync(REPORT_PATH, `${lines.join("\n")}`, "utf8");
  console.log(`Wrote ${path.relative(ROOT, REPORT_PATH)}.`);
}

function main() {
  const steps = [];
  steps.push(runStep("Update reference data", process.execPath, ["scripts/update-reference-data.js"]));
  steps.push(runStep("Update patch data", process.execPath, ["scripts/update-patch-data.js"]));
  const auditStep = runStep("Audit local game data", process.execPath, ["scripts/audit-local-game-data.js"], { required: false });
  steps.push(auditStep);
  steps.push(runStep("Syntax check update workflow", process.execPath, [
    "--check",
    "scripts/update-site.js"
  ]));
  steps.push(runStep("Syntax check static scripts", process.execPath, [
    "--check",
    "app.js"
  ]));
  steps.push(runStep("Syntax check build data", process.execPath, [
    "--check",
    "data.js"
  ]));
  steps.push(runStep("Syntax check reference data", process.execPath, [
    "--check",
    "reference-data.js"
  ]));
  steps.push(runStep("Syntax check patch data", process.execPath, [
    "--check",
    "patch-data.js"
  ]));
  writeReport({ steps, auditStep });
}

try {
  main();
} catch (error) {
  if (error.step) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
}
