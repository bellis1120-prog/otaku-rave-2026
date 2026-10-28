(() => {
  const C = window.EVENT_CONFIG;
  const STORE_KEY = "uchikai-card-v3";
  const animeOk = typeof window.anime === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches;

  const LINES = [
    [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
  ];

  const $ = (id) => document.getElementById(id);
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => s.replace(/\s+/g, "").toLowerCase();
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  /* ---------- 状態 ---------- */
  const blank = () => ({ name: "", cells: null, issuedAt: null, marks: Array(25).fill(false), bingos: 0 });
  let state;
  try { state = { ...blank(), ...JSON.parse(localStorage.getItem(STORE_KEY)) }; } catch { state = blank(); }
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* 保存できなくても動作は継続 */ }
  };

  /* ---------- 発行モード ---------- */
  const openAt = new Date(C.cardOpenAt || C.start);
  const isOpen = () => Date.now() >= openAt.getTime();

  // 真ん中のマスは全員共通の曲（config の centerSong）。残り24マスを申請曲からランダムに埋める
  const CENTER = 12;
  const center = C.centerSong && C.centerSong.title ? C.centerSong : null;
  const randomCount = center ? 24 : 25;

  // 申請曲を曲名で重複排除してカードの元にする（共通曲は除く）
  let pool = null;
  window.loadEntries().then(({ ok, entries }) => {
    const seen = new Set();
    pool = [];
    if (center) seen.add(norm(center.title));
    entries.forEach((e) => e.songs.forEach((s) => {
      if (seen.has(norm(s.title))) return;
      seen.add(norm(s.title));
      pool.push({ title: s.title, artist: s.artist });
    }));
    pool.loadFailed = !ok;
    updateIssuer();
  });

  const randInt = (n) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  };
  const pickCells = () => {
    const a = pool.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    const cells = a.slice(0, randomCount);
    if (center) cells.splice(CENTER, 0, { title: center.title, artist: center.artist || "" });
    return cells;
  };
  const enoughSongs = () => pool && pool.length >= randomCount;
  const poolTotal = () => (pool ? pool.length + (center ? 1 : 0) : 0);

  const preview = $("preview-grid");
  preview.innerHTML = Array.from({ length: 25 }, () => `<div class="cell mystery-cell">?</div>`).join("");

  const updateIssuer = () => {
    const open = isOpen();
    const enough = enoughSongs();
    $("pool-count").textContent = pool ? poolTotal() : "-";
    $("issue-state").textContent = open ? "発行受付中" : `発行は ${fmt(openAt)} から`;
    $("issue-form").hidden = !open;
    let msg = "";
    if (pool && pool.loadFailed) msg = "申請曲を読み込めませんでした。通信状況を確認して再読み込みしてください。";
    else if (open && pool && !enough) msg = `曲が25曲に満たないため発行できません（現在 ${poolTotal()} 曲）。スタッフにお声がけください。`;
    $("issue-msg").textContent = msg;
    $("issue-msg").hidden = !msg;
    $("issue").disabled = !(open && enough && state.name);
  };

  $("player").addEventListener("input", (e) => {
    state.name = e.target.value.trim();
    save();
    updateIssuer();
  });

  $("issue").addEventListener("click", () => {
    if (!isOpen() || !enoughSongs() || !state.name) return;
    const check = window.BROWSER_CHECK || {};
    const warn = check.app ? `\n\n⚠ ${check.app} のアプリ内ブラウザで開いています。発行したカードは Safari / Chrome では表示されません。` : "";
    if (!confirm(`「${state.name}」でカードを発行しますか？\n発行は1回のみで、やり直しはできません。${warn}`)) return;
    state.cells = pickCells();
    state.issuedAt = new Date().toISOString();
    state.marks = Array(25).fill(false);
    state.bingos = 0;
    save();
    renderPlay(true);
  });

  const renderIssuer = () => {
    $("issuer").hidden = false;
    $("player-view").hidden = true;
    $("player").value = state.name;
    updateIssuer();
    // 発行開始時刻をまたいだら自動で切り替え
    if (!isOpen()) {
      const timer = setInterval(() => { if (isOpen()) { clearInterval(timer); updateIssuer(); } }, 10000);
    }
    if (animeOk) {
      anime({ targets: preview.children, opacity: [0.25, 1], scale: [0.9, 1], delay: anime.stagger(60, { grid: [5, 5], from: "center" }), direction: "alternate", loop: true, duration: 900, easing: "easeInOutSine" });
    }
  };

  /* ---------- プレイモード ---------- */
  const grid = $("grid");

  const renderPlay = (intro) => {
    if (intro && animeOk) anime.remove(preview.children);
    $("issuer").hidden = true;
    $("player-view").hidden = false;
    $("player-label").textContent = `PLAYER: ${state.name}`;
    const d = new Date(state.issuedAt);
    $("issued-at").textContent = isNaN(d) ? "" : `発行 ${fmt(d)}`;
    grid.innerHTML = state.cells
      .map((s, i) => `<button class="cell${i === CENTER && center ? " center" : ""}${state.marks[i] ? " on" : ""}" data-i="${i}" aria-pressed="${state.marks[i]}"><span class="t">${escapeHtml(s.title)}</span>${s.artist ? `<span class="a">${escapeHtml(s.artist)}</span>` : ""}</button>`)
      .join("");
    updateLines(false);
    if (intro && animeOk) {
      anime({
        targets: grid.children,
        scale: [0, 1],
        rotateY: [180, 0],
        opacity: [0, 1],
        delay: anime.stagger(60, { grid: [5, 5], from: "center" }),
        duration: 800,
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
    const holes = state.marks.filter(Boolean).length;
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
    state.bingos = 0;
    save();
    renderPlay(false);
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

  if (Array.isArray(state.cells) && state.cells.length === 25) renderPlay(false);
  else renderIssuer();
})();
