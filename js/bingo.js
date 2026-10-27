(() => {
  const C = window.EVENT_CONFIG;
  const STORE_KEY = "otaku-rave-card-v2";
  const FREE = 12;
  const animeOk = typeof window.anime === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const eventStarted = () => Date.now() >= new Date(C.start).getTime();

  const LINES = [
    [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
  ];

  const $ = (id) => document.getElementById(id);
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => s.replace(/\s+/g, "").toLowerCase();

  /* ---------- 状態 ---------- */
  const blank = () => ({ name: "", cells: Array(25).fill(""), locked: false, lockedAt: null, marks: Array(25).fill(false), bingos: 0 });
  let state;
  try { state = { ...blank(), ...JSON.parse(localStorage.getItem(STORE_KEY)) }; } catch { state = blank(); }
  state.marks[FREE] = true;
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* 保存できなくても動作は継続 */ }
  };

  /* ---------- 申請曲を候補として読み込み ---------- */
  let suggestions = [];
  window.loadEntries().then(({ entries }) => {
    const seen = new Set();
    entries.forEach((e) => e.songs.forEach((s) => {
      const label = s.artist ? `${s.title} / ${s.artist}` : s.title;
      if (seen.has(norm(s.title))) return;
      seen.add(norm(s.title));
      suggestions.push({ title: s.title, label });
    }));
    $("song-list").innerHTML = suggestions.map((s) => `<option value="${escapeHtml(s.title)}">${escapeHtml(s.label)}</option>`).join("");
  });

  /* ---------- 作成モード ---------- */
  const editGrid = $("edit-grid");

  const renderEditor = () => {
    $("editor").hidden = false;
    $("player-view").hidden = true;
    $("player").value = state.name;
    const counts = {};
    state.cells.forEach((t) => { if (t) counts[norm(t)] = (counts[norm(t)] || 0) + 1; });
    editGrid.innerHTML = state.cells
      .map((t, i) => {
        if (i === FREE) return `<div class="cell free on">FREE</div>`;
        const dup = t && counts[norm(t)] > 1;
        return t
          ? `<button class="cell filled${dup ? " dup" : ""}" data-i="${i}"><span class="t">${escapeHtml(t)}</span></button>`
          : `<button class="cell empty" data-i="${i}" aria-label="マス${i + 1}に曲を入力">＋</button>`;
      })
      .join("");
    $("filled").textContent = state.cells.filter((t, i) => i !== FREE && t).length;
    $("dup-warn").hidden = !hasDuplicate();
    updateLockButton();
  };

  // 同じ曲で複数の穴が開かないよう、重複があるカードは確定させない
  const hasDuplicate = () => {
    const titles = state.cells.filter((t, i) => i !== FREE && t).map(norm);
    return new Set(titles).size !== titles.length;
  };
  const updateLockButton = () => {
    const filled = state.cells.filter((t, i) => i !== FREE && t).length;
    $("lock").disabled = filled < 24 || !state.name || hasDuplicate();
  };

  $("player").addEventListener("input", (e) => {
    state.name = e.target.value.trim();
    save();
    updateLockButton();
  });

  /* ---------- 曲入力シート ---------- */
  let editing = -1;
  const openSheet = (i) => {
    editing = i;
    const col = "BINGO"[i % 5];
    $("sheet-title").textContent = `${col} 列 ${Math.floor(i / 5) + 1} 段目`;
    $("song-input").value = state.cells[i];
    renderSuggest();
    $("sheet").hidden = false;
    if (animeOk) anime({ targets: ".sheet-body", translateY: [60, 0], opacity: [0, 1], duration: 450, easing: "easeOutExpo" });
    setTimeout(() => $("song-input").focus(), 50);
  };
  const closeSheet = () => { $("sheet").hidden = true; editing = -1; };
  const commit = (value) => {
    state.cells[editing] = value.trim();
    save();
    closeSheet();
    renderEditor();
  };

  // 入力中の文字で申請曲を絞り込み（カードで使用済みの曲は除外）
  const renderSuggest = () => {
    const q = norm($("song-input").value);
    const used = new Set(state.cells.filter((t, i) => t && i !== editing).map(norm));
    const list = suggestions.filter((s) => !used.has(norm(s.title)) && (!q || norm(s.label).includes(q))).slice(0, 8);
    $("suggest").innerHTML = list.map((s) => `<button type="button" class="chip" data-title="${escapeHtml(s.title)}">${escapeHtml(s.label)}</button>`).join("");
  };
  $("song-input").addEventListener("input", renderSuggest);
  $("song-input").addEventListener("keydown", (e) => { if (e.key === "Enter") commit($("song-input").value); });
  $("suggest").addEventListener("click", (e) => {
    const b = e.target.closest("[data-title]");
    if (b) commit(b.dataset.title);
  });
  $("sheet-save").addEventListener("click", () => commit($("song-input").value));
  $("sheet-clear").addEventListener("click", () => commit(""));
  $("sheet-cancel").addEventListener("click", closeSheet);
  $("sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") closeSheet(); });

  editGrid.addEventListener("click", (e) => {
    const cell = e.target.closest("button.cell");
    if (cell) openSheet(+cell.dataset.i);
  });

  $("clear-all").addEventListener("click", () => {
    if (!confirm("入力したマスをすべて消しますか？")) return;
    state.cells = Array(25).fill("");
    save();
    renderEditor();
  });

  $("lock").addEventListener("click", () => {
    if (!confirm("カードを確定しますか？\n確定後はマスの曲を書き換えられません。")) return;
    state.locked = true;
    state.lockedAt = new Date().toISOString();
    state.marks = Array(25).fill(false);
    state.marks[FREE] = true;
    state.bingos = 0;
    save();
    renderPlay(true);
  });

  /* ---------- プレイモード ---------- */
  const grid = $("grid");

  const renderPlay = (intro) => {
    $("editor").hidden = true;
    $("player-view").hidden = false;
    $("player-label").textContent = `PLAYER: ${state.name}`;
    const d = new Date(state.lockedAt);
    $("locked-at").textContent = isNaN(d) ? "" : `確定 ${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    $("remake").hidden = eventStarted();
    grid.innerHTML = state.cells
      .map((t, i) => {
        if (i === FREE) return `<div class="cell free on">FREE</div>`;
        return `<button class="cell${state.marks[i] ? " on" : ""}" data-i="${i}" aria-pressed="${state.marks[i]}"><span class="t">${escapeHtml(t)}</span></button>`;
      })
      .join("");
    updateLines(false);
    if (intro && animeOk) {
      anime({
        targets: grid.children,
        scale: [0, 1],
        rotate: [anime.stagger([-20, 20]), 0],
        opacity: [0, 1],
        delay: anime.stagger(40, { grid: [5, 5], from: "center" }),
        duration: 700,
        easing: "easeOutBack",
      });
    }
  };

  const updateLines = (celebrate) => {
    const cells = grid.children;
    [...cells].forEach((c) => c.classList.remove("line"));
    let bingo = 0, reach = 0;
    LINES.forEach((line) => {
      const n = line.filter((i) => state.marks[i]).length;
      if (n === 5) { bingo++; line.forEach((i) => cells[i].classList.add("line")); }
      else if (n === 4) reach++;
    });
    const holes = state.marks.filter((m, i) => m && i !== FREE).length;
    const holesEl = $("holes");
    if (celebrate && animeOk && +holesEl.textContent !== holes) {
      anime({ targets: holesEl, scale: [1.4, 1], duration: 500, easing: "easeOutElastic(1, .6)" });
    }
    holesEl.textContent = holes;
    $("bingo").textContent = bingo;
    $("reach").textContent = reach;
    if (celebrate && bingo > (state.bingos || 0)) showBurst(bingo);
    state.bingos = bingo;
    save();
  };

  grid.addEventListener("click", (e) => {
    const cell = e.target.closest("button.cell");
    if (!cell) return;
    const i = +cell.dataset.i;
    state.marks[i] = !state.marks[i];
    cell.classList.toggle("on", state.marks[i]);
    cell.setAttribute("aria-pressed", state.marks[i]);
    if (animeOk) anime({ targets: cell, scale: [0.85, 1], duration: 500, easing: "easeOutElastic(1, .5)" });
    updateLines(true);
  });

  $("clear").addEventListener("click", () => {
    if (!confirm("マークをすべてリセットしますか？")) return;
    state.marks = Array(25).fill(false);
    state.marks[FREE] = true;
    state.bingos = 0;
    save();
    renderPlay(false);
  });

  // 作り直しはイベント開始前のみ
  $("remake").addEventListener("click", () => {
    if (eventStarted()) return;
    if (!confirm("カードの確定を取り消して作り直しますか？\n書き込んだ曲はそのまま残ります。")) return;
    state.locked = false;
    save();
    renderEditor();
  });

  /* ---------- BINGO 演出 ---------- */
  const showBurst = (count) => {
    $("burst-title").innerHTML = [..."BINGO!"].map((c) => `<span>${c}</span>`).join("") + (count > 1 ? `<span style="font-size:.4em">×${count}</span>` : "");
    $("burst").classList.add("show");
    if (!animeOk) return;
    anime({ targets: "#burst-title span", translateY: [-120, 0], scale: [2, 1], opacity: [0, 1], delay: anime.stagger(70), duration: 900, easing: "easeOutElastic(1, .6)" });
    const colors = ["#ff2bd6", "#19f0ff", "#f9f871", "#8b5cff"];
    const pieces = Array.from({ length: 80 }, () => {
      const el = document.createElement("div");
      el.className = "confetti";
      el.style.left = Math.random() * 100 + "vw";
      el.style.background = colors[(Math.random() * colors.length) | 0];
      document.body.appendChild(el);
      return el;
    });
    anime({
      targets: pieces,
      translateY: () => [-40, innerHeight + 60],
      translateX: () => anime.random(-120, 120),
      rotate: () => anime.random(-720, 720),
      duration: () => anime.random(1800, 3200),
      delay: anime.stagger(12),
      easing: "easeInQuad",
      complete: () => pieces.forEach((p) => p.remove()),
    });
  };
  $("burst-close").addEventListener("click", () => $("burst").classList.remove("show"));

  if (state.locked) renderPlay(false);
  else renderEditor();
})();
