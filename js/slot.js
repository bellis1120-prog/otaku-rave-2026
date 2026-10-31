(() => {
  const S = window.SLOT_CONFIG;
  const STORE_KEY = "uchikai-slot-v1";
  const animeOk = typeof window.anime === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BONUS_IDS = ["yancha", "mitsubon", "logo"];

  const $ = (id) => document.getElementById(id);
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, animeOk ? ms : Math.min(ms, 200)));
  const rand = (n) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  };
  const chance = (p) => rand(1e6) < p * 1e6;
  const pick = (arr) => arr[rand(arr.length)];

  /* ---------- 状態 ---------- */
  const blank = () => ({
    medals: S.startMedals, games: 0, sinceBonus: 0, replay: false, bonus: null,
    counts: { yancha: 0, mitsubon: 0, logo: 0 }, best: S.startMedals, lastRefill: 0, sound: false,
  });
  let state;
  try { state = { ...blank(), ...JSON.parse(localStorage.getItem(STORE_KEY)) }; } catch { state = blank(); }
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* 保存できなくても遊べる */ }
  };

  /* ---------- 効果音（Web Audio で簡易生成） ---------- */
  let ctx = null;
  const beep = (freq, ms = 80, type = "square", vol = 0.05) => {
    if (!state.sound) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + ms / 1000);
    } catch { /* 音が出せなくても続行 */ }
  };
  const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 160, "triangle", 0.08), i * 120));

  /* ---------- 絵柄の描画 ---------- */
  const symbolHtml = (id) => {
    const s = S.symbols[id];
    if (s.img) return `<div class="sym img" data-id="${id}" style="--c:${s.color}"><img src="${escapeHtml(s.img)}" alt="${escapeHtml(s.name)}"></div>`;
    return `<div class="sym text" data-id="${id}" style="--c:${s.color}"><span>${escapeHtml(s.short)}</span></div>`;
  };

  /* ---------- リール ---------- */
  const reelEls = [...document.querySelectorAll(".reel-strip")];
  const reels = S.reels.map((strip, i) => {
    const el = reelEls[i];
    // 回転中に途切れないよう2周分並べる
    el.innerHTML = [...strip, ...strip].map(symbolHtml).join("");
    return { strip, el, offset: rand(strip.length), spinning: false, stopping: null, raf: 0 };
  });
  const cellH = () => reelEls[0].firstElementChild.getBoundingClientRect().height;
  const render = (r) => {
    const L = r.strip.length;
    r.offset = ((r.offset % L) + L) % L;
    r.el.style.transform = `translateY(${-r.offset * cellH()}px)`;
  };
  // offset は「一番上に見えているコマ」の番号（小数あり）。中段 = offset + 1
  const centerOf = (r) => r.strip[(Math.round(r.offset) + 1) % r.strip.length];

  const startSpin = (r) => {
    r.spinning = true;
    let last = performance.now();
    const tick = (now) => {
      if (!r.spinning) return;
      r.offset -= ((now - last) / 1000) * 18; // 1秒に18コマ、下向きに流れる
      last = now;
      render(r);
      r.raf = requestAnimationFrame(tick);
    };
    r.raf = requestAnimationFrame(tick);
  };

  // 中段に target のコマが来る位置で止める
  const stopAt = (r, targetIndex) => new Promise((resolve) => {
    cancelAnimationFrame(r.raf);
    r.spinning = false;
    const L = r.strip.length;
    const top = (targetIndex - 1 + L) % L;
    let d = (((r.offset - top) % L) + L) % L;
    if (d < 1.5) d += L;
    const from = r.offset;
    const dur = animeOk ? 260 + d * 12 : 0;
    const t0 = performance.now();
    const step = (now) => {
      const p = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = 1 - Math.pow(1 - p, 3);
      r.offset = from - d * e;
      render(r);
      if (p < 1) requestAnimationFrame(step);
      else {
        r.offset = top;
        render(r);
        beep(220, 60);
        resolve();
      }
    };
    requestAnimationFrame(step);
  });

  const indexesOf = (strip, id) => strip.map((s, i) => (s === id ? i : -1)).filter((i) => i >= 0);

  // 抽選結果に合わせて、3リールそれぞれ中段に来るコマを決める
  const planStops = (outcome, tease) => {
    if (outcome) {
      const id = outcome === "bonusGame" ? "drink" : outcome;
      return reels.map((r) => pick(indexesOf(r.strip, id)));
    }
    // ハズレ：3つ揃わない並びを選ぶ（tease のときは みつぼん で2つまで揃えてリーチ目にする）
    for (;;) {
      const stops = reels.map((r) => rand(r.strip.length));
      if (tease) {
        stops[0] = pick(indexesOf(reels[0].strip, "mitsubon"));
        stops[1] = pick(indexesOf(reels[1].strip, "mitsubon"));
      }
      const ids = stops.map((s, i) => reels[i].strip[s]);
      if (!(ids[0] === ids[1] && ids[1] === ids[2])) return stops;
    }
  };

  /* ---------- 内部抽選 ---------- */
  const draw = () => {
    if (state.bonus) return "bonusGame";
    if (state.sinceBonus >= S.ceiling) return "mitsubon";
    let n = rand(65536);
    for (const o of S.odds) {
      if (n < o.weight) return o.id;
      n -= o.weight;
    }
    return null;
  };

  // 抽選結果から、このゲームで出す演出を決める
  const planEffects = (outcome) => {
    const fx = { yuda: null, rec: false, kairo: false, guppy: null, tease: false, ceiling: false };
    if (outcome === "bonusGame") return fx;
    const isBonus = BONUS_IDS.includes(outcome);
    const small = outcome === "otona" || outcome === "drink";
    const pYuda = isBonus ? 0.5 : small ? 0.12 : 0.06;
    if (chance(pYuda)) fx.yuda = isBonus && chance(0.7) ? "yudaBig" : "yudaSmall";
    fx.rec = chance(isBonus ? 0.5 : small ? 0.08 : 0.04);
    fx.kairo = chance(isBonus ? 0.35 : small ? 0.02 : 0.005);
    if (outcome === "yancha") fx.guppy = "success";
    else if (outcome === "otona" && chance(0.25)) fx.guppy = "fail";
    if (!outcome && chance(0.08)) fx.tease = true;
    if (outcome === "mitsubon" && state.sinceBonus >= S.ceiling) fx.ceiling = true;
    return fx;
  };

  /* ---------- 画面の更新 ---------- */
  const machine = $("machine");
  const navi = (key) => {
    const line = pick(S.navi[key]);
    $("navi-text").textContent = line;
    if (animeOk) anime({ targets: "#navi-text", opacity: [0, 1], translateX: [12, 0], duration: 350, easing: "easeOutQuad" });
  };
  const updateHud = () => {
    $("medals").textContent = state.medals;
    $("games").textContent = state.games;
    $("since").textContent = state.sinceBonus;
    const ratio = Math.min(1, state.sinceBonus / S.ceiling);
    $("gauge-fill").style.width = `${ratio * 100}%`;
    $("gauge").classList.toggle("full", ratio >= 1);
    $("cnt-yancha").textContent = state.counts.yancha;
    $("cnt-big").textContent = state.counts.mitsubon;
    $("cnt-reg").textContent = state.counts.logo;
    $("best").textContent = state.best;
    $("bonus-bar").hidden = !state.bonus;
    if (state.bonus) {
      $("bonus-label").textContent = S.bonus[state.bonus.type].label;
      $("bonus-left").textContent = state.bonus.left;
    }
    machine.classList.toggle("in-bonus", !!state.bonus);
    $("sound").textContent = state.sound ? "🔊 SOUND ON" : "🔈 SOUND OFF";
    $("auto").textContent = auto ? "AUTO STOP ON" : "AUTO STOP OFF";
    updateRefill();
  };

  const flashPay = (n) => {
    const el = $("pay");
    el.textContent = n > 0 ? `+${n}` : "";
    if (n > 0 && animeOk) anime({ targets: el, scale: [1.6, 1], opacity: [0, 1], duration: 600, easing: "easeOutElastic(1, .6)" });
  };

  /* ---------- カットイン ---------- */
  // text・image は配列でも可（出るたびにランダムで1つ）
  const cutin = (key, opts) => showCutin(S.cutins[key], opts);
  const showCutin = async (c, { big = false, ms = 1400 } = {}) => {
    const box = $("cutin");
    const image = Array.isArray(c.image) ? pick(c.image) : c.image;
    const text = Array.isArray(c.text) ? pick(c.text) : c.text;
    let media = "";
    if (c.video) media = `<video class="cutin-media" src="${escapeHtml(c.video)}" autoplay muted playsinline></video>`;
    else if (image) media = `<img class="cutin-media" src="${escapeHtml(image)}" alt="">`;
    box.className = `cutin${big ? " big" : ""}${!c.video && image ? " has-img" : ""}`;
    box.innerHTML = `${media}<div class="cutin-who">${escapeHtml(c.who)}</div><div class="cutin-text">${escapeHtml(text)}</div>`;
    box.hidden = false;
    if (animeOk) {
      anime({ targets: box, translateX: ["-110%", "0%"], duration: 380, easing: "easeOutExpo" });
      if (big) anime({ targets: machine, translateX: [-8, 8, -6, 6, 0], duration: 500, easing: "linear" });
    }
    // カットインはタップで次へ進められる
    const tapped = new Promise((r) => (box.onclick = r));
    const video = box.querySelector("video");
    if (video) {
      await Promise.race([new Promise((r) => (video.onended = r)), sleep(6000), tapped]);
    } else {
      await Promise.race([sleep(ms), tapped]);
    }
    box.onclick = null;
    if (animeOk) await anime({ targets: box, translateX: ["0%", "110%"], duration: 300, easing: "easeInExpo" }).finished;
    box.hidden = true;
  };

  // 掛け合い：場面ごとのパターンから1つ選び、順にカットインで見せる
  /* ---------- テロップ（掛け合い・アニメ討論会） ----------
   * ゲームを止めないよう、セリフは1ゲームにつき1行ずつリール上のテロップで流す */
  const telopQueue = [];
  let telopShown = false; // このゲームでもうテロップを更新したか
  const showNextTelop = () => {
    const line = telopQueue.shift();
    if (!line) return;
    telopShown = true;
    const [who, text] = line;
    const face = (S.faces || {})[who];
    const el = $("telop");
    el.classList.toggle("heading", who === "アニメ討論会");
    el.innerHTML = `${face ? `<img src="${escapeHtml(face)}" alt="">` : ""}<span class="telop-who">${escapeHtml(who)}</span><span class="telop-text">${escapeHtml(text)}</span>`;
    el.classList.remove("empty");
    if (animeOk) anime({ targets: el, translateX: ["40%", "0%"], opacity: [0, 1], duration: 420, easing: "easeOutExpo" });
  };
  const queueTelop = (lines) => {
    telopQueue.push(...lines);
    if (!telopShown) showNextTelop();
  };

  // 掛け合い：場面ごとのパターンから1つ選んでテロップに積む
  const talk = (scene) => {
    const list = S.talks && S.talks[scene];
    const p = (S.talkRates || {})[scene] ?? 1;
    if (!list || !list.length || !chance(p)) return;
    queueTelop(pick(list));
  };

  // ボーナス中のアニメ討論会：まだ出ていない作品から1つ選び、見出しから順にテロップに積む
  const queueAnimeDebate = () => {
    const list = window.SLOT_ANIME || [];
    if (!list.length) return;
    let seen = state.animeSeen || [];
    let rest = list.filter((a) => !seen.includes(a.title));
    if (!rest.length) { seen = []; rest = list; }
    const a = pick(rest);
    state.animeSeen = [...seen, a.title];
    save();
    queueTelop([["アニメ討論会", `『${a.title}』`], ...a.lines]);
  };

  /* ---------- 1ゲームの流れ ---------- */
  let busy = false;
  let auto = false;
  let stopResolvers = [];
  let current = null;
  let holding = false; // リーチ演出中は最後のリールを止めさせない

  const lever = async () => {
    if (busy) return;
    const free = state.replay || !!state.bonus;
    if (!free && state.medals < S.bet) { navi("empty"); updateRefill(); return; }
    busy = true;
    $("lever").disabled = true;
    if (!free) state.medals -= S.bet;
    state.replay = false;
    state.games++;
    if (!state.bonus) state.sinceBonus++;
    flashPay(0);
    beep(440, 90);

    const outcome = draw();
    const fx = planEffects(outcome);
    const stops = planStops(outcome, fx.tease);
    current = { outcome, fx, stops };
    updateHud();
    save();

    // テロップは1ゲーム1行。ボーナス中は討論会のセリフが途切れないよう補充する
    telopShown = false;
    if (state.bonus && !telopQueue.length) queueAnimeDebate();
    else showNextTelop();
    if (!telopShown) $("telop").classList.add("empty");

    // レバーを叩いた時点の演出
    if (fx.ceiling) { navi("ceiling"); await cutin("ceiling", { ms: 1500 }); }
    if (fx.yuda) { navi("yuda"); await cutin(fx.yuda, { ms: fx.yuda === "yudaBig" ? 1300 : 900 }); talk("yuda"); }
    if (!state.bonus && !fx.ceiling && state.sinceBonus > 0 && state.sinceBonus % (S.hamariEvery || 100) === 0) talk("hamari");
    if (fx.guppy) {
      await cutin("otona", { ms: 1100 });
      await cutin("plead", { big: true, ms: 1500 });
      if (fx.guppy === "fail") await cutin("pleadFail", { ms: 1200 });
    }
    machine.classList.toggle("rec", fx.rec);
    if (fx.rec) { navi("rec"); talk("rec"); }
    else if (!fx.yuda && !state.bonus) navi("idle");

    reels.forEach(startSpin);
    stopResolvers = [];
    const stopped = reels.map((_, i) => new Promise((r) => (stopResolvers[i] = r)));
    setStopButtons(true);
    if (auto) autoStop();

    await Promise.all(stopped);
    await finish();
  };

  const setStopButtons = (on) => {
    document.querySelectorAll(".stop").forEach((b, i) => (b.disabled = !on || !reels[i].spinning));
  };

  const stopReel = async (i) => {
    const r = reels[i];
    if (!r || !r.spinning || r.stopping || holding) return;
    r.stopping = stopAt(r, current.stops[i]);
    setStopButtons(true);
    document.querySelectorAll(".stop")[i].disabled = true;
    await r.stopping;
    r.stopping = null;
    // 2つ止まった時点でリーチ判定（残り1つが回っていて、止まった2つが同じ絵柄）
    const done = reels.filter((x) => !x.spinning);
    const still = reels.filter((x) => x.spinning);
    if (done.length === 2 && still.length === 1) {
      const [a, b] = done.map(centerOf);
      if (a === b && a !== "replay" && a !== "drink") await onReach();
    }
    stopResolvers[i]();
  };

  const onReach = async () => {
    holding = true;
    setStopButtons(false);
    machine.classList.add("reach");
    navi("reach");
    beep(880, 200, "sawtooth", 0.04);
    if (current.fx.kairo) { await sleep(300); navi("kairo"); await cutin("kairo", { big: true, ms: 1300 }); talk("kairo"); }
    else { await sleep(500); talk("reach"); }
    machine.classList.remove("reach");
    holding = false;
    setStopButtons(true);
  };

  const autoStop = async () => {
    for (let i = 0; i < reels.length; i++) {
      await sleep(i === 0 ? 450 : 300);
      while (holding || reels.some((r) => r.stopping)) await sleep(50);
      await stopReel(i);
    }
  };

  const finish = async () => {
    const { outcome } = current;
    machine.classList.remove("rec");
    setStopButtons(false);
    let pay = 0;

    if (outcome === "bonusGame") {
      pay = S.bonus[state.bonus.type].perGame;
      state.bonus.left--;
      state.bonus.won += pay;
    } else if (outcome === "replay") {
      state.replay = true;
      navi("replay");
    } else if (outcome === "otona" || outcome === "drink") {
      pay = S.symbols[outcome].pay;
      navi("small");
      talk("small");
    } else if (BONUS_IDS.includes(outcome)) {
      await startBonus(outcome);
      pay = S.bonus[outcome].extra;
    } else {
      navi("miss");
      talk("idle");
    }

    if (pay) {
      state.medals += pay;
      flashPay(pay);
      beep(988, 120, "triangle", 0.06);
      if (outcome !== "bonusGame") lightLine();
    }
    state.best = Math.max(state.best, state.medals);
    updateHud();
    save();

    if (state.bonus && state.bonus.left <= 0) await endBonus();
    busy = false;
    $("lever").disabled = false;
    updateHud();
  };

  const lightLine = () => {
    machine.classList.add("hit");
    setTimeout(() => machine.classList.remove("hit"), 900);
  };

  /* ---------- ボーナス ---------- */
  const startBonus = async (type) => {
    lightLine();
    fanfare();
    navi("bonus");
    if (type === "yancha") await cutin("yancha", { big: true, ms: 1800 });
    await cutin(type === "logo" ? "reg" : "scream", { big: true, ms: type === "logo" ? 1300 : 1800 });
    burst(S.bonus[type].label);
    state.counts[type]++;
    state.sinceBonus = 0;
    const fx = current.fx;
    state.bonus = {
      type, left: S.bonus[type].games, won: S.bonus[type].extra,
      trigger: [fx.ceiling && "たくあすゲージ満タン", fx.yuda === "yudaBig" && "ゆだ大笑い", fx.yuda === "yudaSmall" && "ゆだ笑い", fx.rec && "うどんREC", fx.kairo && "かいろ変顔", fx.guppy && "グッピー覚醒"].filter(Boolean),
    };
  };

  const endBonus = async () => {
    const b = state.bonus;
    state.bonus = null;
    save();
    await cutin("highlight", { ms: 1100 });
    $("hl-title").textContent = S.bonus[b.type].label;
    $("hl-games").textContent = S.bonus[b.type].games;
    $("hl-won").textContent = b.won;
    $("hl-trigger").textContent = b.trigger.length ? b.trigger.join(" → ") : "完全告知なし（いきなり）";
    if (S.highlightImg) { $("hl-img").src = S.highlightImg; $("hl-img").hidden = false; }
    $("highlight").hidden = false;
    if (animeOk) anime({ targets: "#highlight .hl-body", scale: [0.8, 1], opacity: [0, 1], duration: 500, easing: "easeOutBack" });
    await new Promise((r) => ($("hl-close").onclick = r));
    $("highlight").hidden = true;
    // 討論会の残りは持ち越さない
    telopQueue.length = 0;
    telopShown = false;
    talk("bonusEnd");
  };

  const burst = (label) => {
    const el = $("slot-burst");
    el.textContent = label;
    el.hidden = false;
    if (animeOk) {
      anime({ targets: el, scale: [0.3, 1], opacity: [0, 1], duration: 700, easing: "easeOutElastic(1, .6)" });
      setTimeout(() => anime({ targets: el, opacity: 0, duration: 400, easing: "linear", complete: () => (el.hidden = true) }), 1600);
    } else setTimeout(() => (el.hidden = true), 1200);
  };

  /* ---------- メダル補充 ---------- */
  const refillWait = () => Math.max(0, state.lastRefill + S.refillMinutes * 60000 - Date.now());
  const updateRefill = () => {
    const need = state.medals < S.bet && !state.replay && !state.bonus;
    const btn = $("refill");
    btn.hidden = !need;
    if (!need) return;
    const w = refillWait();
    btn.disabled = w > 0;
    btn.textContent = w > 0 ? `メダル補充まで ${Math.ceil(w / 1000)} 秒` : `メダルを補充する（+${S.startMedals}）`;
  };
  setInterval(updateRefill, 1000);
  $("refill").addEventListener("click", () => {
    if (refillWait() > 0) return;
    state.medals += S.startMedals;
    state.lastRefill = Date.now();
    save();
    updateHud();
    navi("idle");
  });

  /* ---------- 操作 ---------- */
  $("lever").addEventListener("click", lever);
  document.querySelectorAll(".stop").forEach((b, i) => b.addEventListener("click", () => stopReel(i)));
  $("auto").addEventListener("click", () => {
    auto = !auto;
    updateHud();
    if (auto && reels.some((r) => r.spinning)) autoStop();
  });
  $("sound").addEventListener("click", () => {
    state.sound = !state.sound;
    save();
    updateHud();
    beep(660, 80);
  });
  // キーボード：スペースでレバー、1/2/3 または J/K/L でストップ
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.code === "Space") { e.preventDefault(); if (reels.some((r) => r.spinning)) stopReel(reels.findIndex((r) => r.spinning && !r.stopping)); else lever(); }
    const k = { Digit1: 0, Digit2: 1, Digit3: 2, KeyJ: 0, KeyK: 1, KeyL: 2 }[e.code];
    if (k !== undefined) stopReel(k);
  });
  window.addEventListener("resize", () => reels.forEach(render));

  // 前回ボーナス中に閉じた場合も続きから遊べる
  requestAnimationFrame(() => reels.forEach(render));
  if (S.naviImg) document.querySelector(".navi-who").insertAdjacentHTML("afterbegin", `<img src="${escapeHtml(S.naviImg)}" alt="">`);
  updateHud();
  navi("idle");
})();
