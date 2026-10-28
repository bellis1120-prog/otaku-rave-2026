/*
 * ビンゴカードは端末のブラウザ（localStorage）に保存されるため、
 * 保存先が Safari / Chrome と分かれるアプリ内ブラウザや、保存できない環境で開いたときに注意を出す
 */
(() => {
  const IN_APP = [
    [/ Line\//i, "LINE"],
    [/FBAN|FBAV/i, "Facebook"],
    [/Instagram/i, "Instagram"],
    [/Twitter/i, "X（Twitter）"],
    [/Discord/i, "Discord"],
    [/MicroMessenger/i, "WeChat"],
    [/musical_ly|BytedanceWebview|TikTok/i, "TikTok"],
    [/KAKAOTALK/i, "KakaoTalk"],
  ];
  const ua = navigator.userAgent;
  const app = (IN_APP.find(([re]) => re.test(ua)) || [])[1] || null;

  let storageOk = true;
  try {
    const k = "__uchikai_check";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
  } catch {
    storageOk = false;
  }

  // bingo.js から発行確認のメッセージに使う
  window.BROWSER_CHECK = { app, storageOk };

  const box = document.getElementById("browser-warn");
  if (!box || (!app && storageOk)) return;

  const items = [];
  if (!storageOk) {
    items.push("このブラウザではカードを保存できません。シークレット（プライベート）モードや、サイトデータの保存をブロックする設定が原因の可能性があります。<b>通常モードの Safari / Chrome</b> で開き直してください。");
  }
  if (app) {
    items.push(`<b>${app} のアプリ内ブラウザ</b>で開いています。ここで発行したカードはこのアプリの中にだけ保存され、Safari / Chrome で開いても表示されません。右上のメニューから「ブラウザで開く」を選び、<b>Safari / Chrome で発行</b>してください。`);
  }
  let action = "";
  if (app === "LINE") {
    // LINE は openExternalBrowser=1 を付けると端末の標準ブラウザで開く
    const url = new URL(location.href);
    url.searchParams.set("openExternalBrowser", "1");
    action = `<a class="btn" href="${url.href}">Safari / Chrome で開く ↗</a>`;
  }
  box.innerHTML = `<p class="browser-warn-title">CHECK YOUR BROWSER</p>${items.map((t) => `<p>${t}</p>`).join("")}${action}`;
  box.hidden = false;
})();
