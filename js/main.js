(() => {
  const C = window.EVENT_CONFIG;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasAnime = typeof window.anime === "function" && !reduced;
  if (!hasAnime) document.documentElement.classList.add("no-anim");

  /* ---------- config の値を流し込み ---------- */
  const yen = (n) => "¥" + n.toLocaleString("ja-JP");
  const values = {
    name: C.name,
    subtitle: C.subtitle,
    tagline: C.tagline,
    date: C.dateLabel,
    time: C.timeLabel,
    fee: yen(C.fee),
    drink: yen(C.drink),
    total: yen(C.fee + C.drink),
    capacity: C.capacity,
    deadline: C.deadline,
    venue: C.venue.name,
    address: C.venue.address,
    zip: C.venue.zip,
    venueNote: C.venue.note,
    contact: C.contact.handle,
  };
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const v = values[el.dataset.cfg];
    if (v !== undefined) el.textContent = v;
  });

  // 申込ボタン
  document.querySelectorAll("[data-form-link]").forEach((a) => {
    if (C.formUrl) {
      a.href = C.formUrl;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.classList.add("disabled");
      a.querySelector(".label") && (a.querySelector(".label").textContent = "ENTRY 準備中");
    }
  });
  const embed = document.getElementById("form-embed");
  if (embed && C.formEmbedUrl) {
    embed.innerHTML = `<iframe src="${C.formEmbedUrl}" loading="lazy" title="参加申請フォーム">読み込んでいます…</iframe>`;
    embed.hidden = false;
  }

  // 連絡先リンク
  document.querySelectorAll("[data-contact]").forEach((a) => {
    a.textContent = `${C.contact.label} ${C.contact.handle}`;
    if (C.contact.url) a.href = C.contact.url;
  });

  // タイムテーブル
  const tl = document.getElementById("timeline");
  if (tl) {
    tl.innerHTML = C.schedule
      .map((s) => `<li class="reveal"><time>${s.time}</time><h3>${s.title}</h3><p>${s.note}</p></li>`)
      .join("");
  }

  /* ---------- メニュー ---------- */
  const toggle = document.querySelector(".nav-toggle");
  toggle?.addEventListener("click", () => document.body.classList.toggle("menu-open"));
  document.querySelectorAll(".nav a").forEach((a) =>
    a.addEventListener("click", () => document.body.classList.remove("menu-open"))
  );

  /* ---------- 背景パーティクル ---------- */
  const canvas = document.getElementById("bg-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const colors = ["#ff2bd6", "#19f0ff", "#8b5cff", "#f9f871"];
    let w, h, dots;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      const count = Math.round(Math.min(90, (innerWidth * innerHeight) / 16000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.6 + 0.4) * dpr,
        vy: -(Math.random() * 0.3 + 0.08) * dpr,
        c: colors[(Math.random() * colors.length) | 0],
        p: Math.random() * Math.PI * 2,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * 0.75, h * 0.2, 0, w * 0.75, h * 0.2, w * 0.7);
      g.addColorStop(0, "rgba(139,92,255,0.18)");
      g.addColorStop(1, "rgba(7,6,13,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (const d of dots) {
        d.y += d.vy;
        d.p += 0.02;
        if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w; }
        ctx.globalAlpha = 0.4 + Math.sin(d.p) * 0.3;
        ctx.fillStyle = d.c;
        ctx.shadowColor = d.c;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (!reduced) requestAnimationFrame(draw);
    };
    resize();
    addEventListener("resize", resize);
    draw();
  }

  /* ---------- HERO タイトル分割 & 登場 ---------- */
  document.querySelectorAll(".hero-title .line").forEach((line) => {
    const text = line.textContent;
    line.innerHTML = [...text].map((c) => `<span class="char">${c === " " ? "&nbsp;" : c}</span>`).join("");
  });

  if (hasAnime) {
    anime
      .timeline({ easing: "easeOutExpo" })
      .add({ targets: ".hero-kicker", opacity: [0, 1], translateX: [-30, 0], duration: 700 })
      .add({
        targets: ".hero-title .char",
        translateY: ["110%", "0%"],
        rotateZ: [8, 0],
        opacity: [0, 1],
        duration: 1100,
        delay: anime.stagger(35),
      }, "-=400")
      .add({ targets: ".hero .fade-up", translateY: [24, 0], opacity: [0, 1], duration: 900, delay: anime.stagger(110) }, "-=700")
      .add({ targets: ".countdown .unit", scale: [0.6, 1], opacity: [0, 1], duration: 700, delay: anime.stagger(80) }, "-=700");
  }

  /* ---------- イコライザー ---------- */
  const eq = document.querySelector(".equalizer");
  if (eq) {
    eq.innerHTML = "<span></span>".repeat(14);
    if (hasAnime) {
      const bars = eq.querySelectorAll("span");
      const pulse = () => {
        anime({
          targets: bars,
          height: () => anime.random(12, 100) + "%",
          duration: 420,
          easing: "easeInOutSine",
          delay: anime.stagger(18),
          complete: pulse,
        });
      };
      pulse();
    }
  }

  /* ---------- レコード回転 ---------- */
  if (hasAnime && document.querySelector(".vinyl")) {
    anime({ targets: ".vinyl", rotate: "1turn", duration: 4000, easing: "linear", loop: true });
  }

  /* ---------- カウントダウン ---------- */
  const cd = document.querySelector(".countdown");
  if (cd) {
    const start = new Date(C.start).getTime();
    const end = new Date(C.end).getTime();
    const el = (k) => cd.querySelector(`[data-cd="${k}"]`);
    const tick = () => {
      const now = Date.now();
      if (now >= end) {
        cd.innerHTML = `<div class="unit" style="opacity:1"><div class="num">THANK YOU</div><div class="lbl">SEE YOU NEXT YEAR</div></div>`;
        return;
      }
      if (now >= start) {
        cd.innerHTML = `<div class="unit" style="opacity:1"><div class="num">NOW ON AIR</div><div class="lbl">PARTY IN PROGRESS</div></div>`;
        return;
      }
      let s = Math.floor((start - now) / 1000);
      const d = Math.floor(s / 86400); s %= 86400;
      const h = Math.floor(s / 3600); s %= 3600;
      const m = Math.floor(s / 60); s %= 60;
      el("d").textContent = d;
      el("h").textContent = String(h).padStart(2, "0");
      el("m").textContent = String(m).padStart(2, "0");
      el("s").textContent = String(s).padStart(2, "0");
      setTimeout(tick, 1000);
    };
    tick();
  }

  /* ---------- スクロールで出現 ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (hasAnime && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          anime({ targets: e.target, opacity: [0, 1], translateY: [40, 0], duration: 1000, easing: "easeOutExpo" });
          // 中にスタッガー対象があれば順に表示
          const kids = e.target.querySelectorAll(".stagger");
          if (kids.length) {
            anime({ targets: kids, opacity: [0, 1], translateY: [30, 0], scale: [0.95, 1], duration: 900, delay: anime.stagger(120, { start: 200 }), easing: "easeOutExpo" });
          }
        });
      },
      { threshold: 0.15 }
    );
    reveals.forEach((r) => io.observe(r));
  } else {
    reveals.forEach((r) => (r.style.opacity = 1));
    document.querySelectorAll(".stagger").forEach((s) => (s.style.opacity = 1));
  }

  /* ---------- ミニビンゴ演出（トップページ） ---------- */
  const mini = document.querySelector(".mini-card");
  if (mini) {
    mini.innerHTML = "<span></span>".repeat(25);
    const cells = [...mini.children];
    cells[12].classList.add("hit");
    if (hasAnime) {
      const lines = [[0, 6, 12, 18, 24], [10, 11, 12, 13, 14], [2, 7, 12, 17, 22], [4, 8, 12, 16, 20]];
      let i = 0;
      const play = () => {
        cells.forEach((c, idx) => idx !== 12 && c.classList.remove("hit"));
        const line = lines[i++ % lines.length];
        anime({
          targets: line.map((n) => cells[n]),
          scale: [0.4, 1],
          duration: 500,
          delay: anime.stagger(260),
          easing: "easeOutBack",
          begin: (a) => a.animatables.forEach((x, k) => setTimeout(() => x.target.classList.add("hit"), k * 260)),
          complete: () => setTimeout(play, 1400),
        });
      };
      play();
    }
  }

  /* ---------- 景品の??? シャッフル ---------- */
  if (hasAnime) {
    document.querySelectorAll(".mystery").forEach((m) => {
      const glyphs = "?!#$%&*@";
      setInterval(() => {
        if (Math.random() > 0.3) return;
        const orig = "???";
        let n = 0;
        const iv = setInterval(() => {
          m.textContent = [...orig].map(() => glyphs[(Math.random() * glyphs.length) | 0]).join("");
          if (++n > 6) { clearInterval(iv); m.textContent = orig; }
        }, 50);
      }, 1200);
    });
  }

  /* ---------- 現在ページのナビをハイライト ---------- */
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach((a) => {
    if (a.getAttribute("href").split("#")[0] === page && !a.getAttribute("href").includes("#")) a.classList.add("active");
  });
})();
