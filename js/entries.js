/*
 * 参加申請データの読み込み
 * Googleフォームの回答シートを「ウェブに公開（CSV）」したURLから読み込みます。
 * 見出し行の文字で列を判別します:
 *   名前 / ハンドル        → 申請者名
 *   曲（曲名・曲1 など）    → 曲名（左から順に1曲目, 2曲目…）
 *   アーティスト            → アーティスト名（曲と同じ順番で対応）
 *   ひとこと / メッセージ   → コメント
 * タイムスタンプなど、それ以外の列は無視します。
 */
window.loadEntries = (() => {
  let cache;

  const parseCsv = (text) => {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim()));
  };

  const toEntries = (rows) => {
    const [head, ...body] = rows;
    const find = (re) => head.findIndex((h) => re.test(h));
    const nameCol = find(/名前|ハンドル|name/i);
    const commentCol = find(/ひとこと|メッセージ|コメント|comment/i);
    const artistCols = head.map((h, i) => (/アーティスト|artist/i.test(h) ? i : -1)).filter((i) => i >= 0);
    const songCols = head
      .map((h, i) => (/曲|song|title/i.test(h) && !artistCols.includes(i) && i !== nameCol && i !== commentCol ? i : -1))
      .filter((i) => i >= 0);

    return body
      .map((r) => ({
        name: (r[nameCol] || "").trim(),
        comment: commentCol >= 0 ? (r[commentCol] || "").trim() : "",
        songs: songCols
          .map((c, k) => ({ title: (r[c] || "").trim(), artist: (r[artistCols[k]] || "").trim() }))
          .filter((s) => s.title),
      }))
      .filter((e) => e.name && e.songs.length);
  };

  // config.js の songs（手動追加分）も申請として扱う
  const manualEntries = () => {
    const byName = new Map();
    (window.EVENT_CONFIG.songs || []).forEach((s) => {
      const key = s.by || "主催者セレクト";
      if (!byName.has(key)) byName.set(key, { name: key, comment: "", songs: [] });
      byName.get(key).songs.push({ title: s.title, artist: s.artist || "" });
    });
    return [...byName.values()];
  };

  return () => {
    if (cache) return cache;
    const url = window.EVENT_CONFIG.sheetCsvUrl;
    const remote = url
      ? fetch(url + (url.includes("?") ? "&" : "?") + "t=" + Date.now())
          .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
          .then((t) => toEntries(parseCsv(t)))
      : Promise.resolve([]);
    cache = remote.then((list) => ({ ok: true, entries: [...list, ...manualEntries()] }))
      .catch(() => ({ ok: false, entries: manualEntries() }));
    return cache;
  };
})();
