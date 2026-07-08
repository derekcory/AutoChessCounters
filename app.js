(function () {
  const data = window.AUTO_CHESS_DATA;
  const builds = data.builds;
  const reference = window.AUTO_CHESS_REFERENCE || { pieces: [], items: [], synergies: [], meta: {} };
  const state = {
    activeView: "builds",
    query: "",
    tier: "All",
    style: "All",
    difficulty: "All",
    selectedId: builds[0]?.id || "",
    enemyId: builds[0]?.id || "",
    referenceType: "pieces",
    referenceQuery: "",
    referencePrimary: "All",
    referenceSecondary: "All"
  };

  const elements = {
    searchInput: document.getElementById("searchInput"),
    viewTabs: document.querySelectorAll(".view-tab"),
    buildsView: document.getElementById("buildsView"),
    referenceView: document.getElementById("referenceView"),
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

    const referenceActive = state.activeView === "reference";
    elements.buildsView.hidden = referenceActive;
    elements.referenceView.hidden = !referenceActive;
    elements.buildsView.classList.toggle("active", !referenceActive);
    elements.referenceView.classList.toggle("active", referenceActive);
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
          <div>
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
          <div>
            <p class="eyebrow">${escapeHtml(displayValue(item.quality, "Item"))}</p>
            <h3>${escapeHtml(item.name)}</h3>
          </div>
        </div>
        ${chipRow(asArray(item.categories))}
        ${item.attributes ? referenceCopy("Attributes", item.attributes) : ""}
        ${item.effect ? referenceCopy("Effect", item.effect) : ""}
        ${item.recipe ? referenceCopy("Recipe", item.recipe) : ""}
        ${sourceLinks(item)}
      </article>
    `;
  }

  function renderSynergyCard(synergy) {
    return `
      <article class="reference-card">
        <div class="reference-card-top">
          <div>
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
    renderFilters();
    renderReferenceLibrary();
    renderActiveView();
    bindEvents();
    render();
  }

  init();
})();
