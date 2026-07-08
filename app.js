(function () {
  const data = window.AUTO_CHESS_DATA;
  const builds = data.builds;
  const state = {
    query: "",
    tier: "All",
    style: "All",
    difficulty: "All",
    selectedId: builds[0]?.id || "",
    enemyId: builds[0]?.id || ""
  };

  const elements = {
    searchInput: document.getElementById("searchInput"),
    tierFilters: document.getElementById("tierFilters"),
    styleFilter: document.getElementById("styleFilter"),
    difficultyFilter: document.getElementById("difficultyFilter"),
    buildList: document.getElementById("buildList"),
    detailPanel: document.getElementById("detailPanel"),
    resultCount: document.getElementById("resultCount"),
    enemySelect: document.getElementById("enemySelect"),
    counterResults: document.getElementById("counterResults"),
    patchTitle: document.getElementById("patchTitle"),
    patchSourceLink: document.getElementById("patchSourceLink"),
    patchHighlights: document.getElementById("patchHighlights"),
    footerSourceNote: document.getElementById("footerSourceNote"),
    statBuilds: document.getElementById("stat-builds"),
    statCounters: document.getElementById("stat-counters"),
    statUpdated: document.getElementById("stat-updated")
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
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }

  function tierClass(tier) {
    return tier === "A" ? "tier-a" : tier === "B" ? "tier-b" : "";
  }

  function chip(label, tone) {
    const className = tone ? `chip ${tone}` : "chip";
    return `<span class="${className}">${escapeHtml(label)}</span>`;
  }

  function chipRow(items, tone) {
    return `<div class="chip-row">${items.map((item) => chip(item, tone)).join("")}</div>`;
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
    const counterCount = builds.reduce((total, build) => total + build.counterPlan.length, 0);
    elements.statBuilds.textContent = builds.length;
    elements.statCounters.textContent = counterCount;
    elements.statUpdated.textContent = data.meta.updatedLabel;
  }

  function renderPatchNotes() {
    const notes = data.meta.patchNotes;
    if (!notes) {
      return;
    }

    elements.patchTitle.textContent = `${notes.title} - ${notes.date}`;
    elements.patchSourceLink.href = notes.sourceUrl;
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

  function render() {
    renderTierFilters();
    const hasResults = renderBuildList();
    if (hasResults) {
      renderDetail();
    } else {
      elements.detailPanel.innerHTML = `<div class="empty-state">Try a different search or filter.</div>`;
    }
    renderCounterFinder();
  }

  function bindEvents() {
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
  }

  function init() {
    renderStats();
    renderPatchNotes();
    renderFilters();
    bindEvents();
    render();
  }

  init();
})();
