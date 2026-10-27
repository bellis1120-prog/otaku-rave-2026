(() => {
  const C = window.EVENT_CONFIG;
  const STORE_KEY = "otaku-rave-bingo-v1";
  const animeOk = typeof window.anime === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 24曲未満ならサンプル曲でデモ表示
  const isDemo = C.songs.length < 24;
  const songs = isDemo
    ? Array.from({ length: 36 }, (_, i) => ({ title: `サンプル曲 ${String(i + 1).padStart(2, "0")}`, artist: "Sample Artist" }))
    : C.songs;
  const signature = songs.map((s) => s.title + "|" + s.artist).join("/");
  document.getElementById("demo-banner").hidden = !isDemo;

  const LINES = [
    [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
  ];

  /* ---------- 名前から決定的にカードを作る ---------- */
  const hash = (str) => {
    let h = 2166136261;
    for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const makeCard = (name) => {
    const rand = rng(hash(name.trim() + "::" + signature));
    const idx = songs.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const picked = idx.slice(0, 24);
    picked.splice(12, 0, -1); // 中央は FREE
    return picked;
  };

  /* ---------- 状態の保存 ---------- */
  const load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      return s && s.signature === signature ? s : null;
    } catch { return null; }
  };
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* 保存できなくても動作は継続 */ }
  };

  let state = load();
  const $ = (id) => document.getElementById(id);
  const grid = $("grid");

  const start = (name) => {
    state = { name, signature, card: makeCard(name), marks: Array(25).fill(false), bingos: 0 };
    state.marks[12] = true;
    save();
    render(true);
  };

  /* ---------- 描画 ---------- */
  const render = (intro) => {
    $("setup").hidden = true;
    $("card-area").hidden = false;
    $("player-label").textContent = `PLAYER: ${state.name}`;
    grid.innerHTML = state.card
      .map((si, i) => {
        if (si === -1) return `<div class="cell free on">FREE</div>`;
        const s = songs[si];
        return `<button class="cell${state.marks[i] ? " on" : ""}" data-i="${i}" aria-pressed="${state.marks[i]}">
          <span class="t">${escapeHtml(s.title)}</span><span class="a">${escapeHtml(s.artist || "")}</span></button>`;
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

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const updateLines = (celebrate) => {
    const cells = grid.children;
    [...cells].forEach((c) => c.classList.remove("line"));
    let bingo = 0, reach = 0;
    LINES.forEach((line) => {
      const n = line.filter((i) => state.marks[i]).length;
      if (n === 5) { bingo++; line.forEach((i) => cells[i].classList.add("line")); }
      else if (n === 4) reach++;
    });
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

  /* ---------- BINGO 演出 ---------- */
  const showBurst = (count) => {
    const title = $("burst-title");
    title.innerHTML = [..."BINGO!"].map((c) => `<span>${c}</span>`).join("") + (count > 1 ? `<span style="font-size:.4em">×${count}</span>` : "");
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

  /* ---------- 操作 ---------- */
  $("setup").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("player").value.trim();
    if (!name) return;
    if (state && state.name === name) render(false);
    else start(name);
  });
  $("clear").addEventListener("click", () => {
    if (!confirm("マークをすべてリセットしますか？")) return;
    state.marks = Array(25).fill(false);
    state.marks[12] = true;
    state.bingos = 0;
    save();
    render(false);
  });
  $("rename").addEventListener("click", () => {
    $("setup").hidden = false;
    $("card-area").hidden = true;
    $("player").value = state.name;
    $("player").focus();
  });

  if (state) render(false);
})();
