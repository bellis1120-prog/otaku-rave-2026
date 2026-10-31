/*
 * UCHIKAI SLOT の設定ファイル
 * 絵柄・カットイン・セリフ・確率はすべてここで管理します。
 * 素材を差し替えるときは img / video に assets/slot/ 以下のパスを書くだけで、
 * 空（null）のあいだは文字アイコン・テキスト演出で表示されます。
 */
window.SLOT_CONFIG = {
  bet: 3,              // 1ゲームに使うメダル
  startMedals: 100,    // 初回とメダル補充時にもらえる枚数
  refillMinutes: 3,    // メダル補充の待ち時間（分）
  ceiling: 300,        // たくあすゲージ：ボーナスなしでこのゲーム数に達したら次は BIG 確定

  /*
   * 絵柄
   * pay: 中段に3つ揃ったときの払い出し枚数（ボーナス絵柄は bonus の内容で決まる）
   * img: 絵柄画像（正方形の透過PNG推奨。例 "assets/slot/mitsubon.png"）
   */
  symbols: {
    mitsubon: { name: "みつぼん", short: "みつぼん", color: "#ff2bd6", img: null },
    yancha:   { name: "ヤンチャグッピー", short: "ヤンチャ", color: "#f9f871", img: null },
    otona:    { name: "大人グッピー", short: "大人 グッピー", color: "#9a94bf", img: null, pay: 10 },
    logo:     { name: "UCHIKAI", short: "UCHI//KAI", color: "#19f0ff", img: null },
    drink:    { name: "ドリンク", short: "🍺", color: "#ffb347", img: null, pay: 4 },
    replay:   { name: "リプレイ", short: "REPLAY", color: "#3ddc97", img: null },
    yuda:     { name: "ゆだ", short: "ゆだ", color: "#ff7a59", img: null },
    udon:     { name: "うどん", short: "うどん", color: "#e8e3c9", img: null },
    kairo:    { name: "かいろ", short: "かいろ", color: "#8b5cff", img: null },
    takuasu:  { name: "たくあす", short: "たくあす", color: "#6fd3ff", img: null },
  },

  // リール配列（上から順に並ぶ。各リール21コマ）
  reels: [
    ["mitsubon", "drink", "replay", "otona", "yuda", "logo", "replay", "drink", "kairo", "otona", "replay", "mitsubon", "drink", "udon", "yancha", "replay", "drink", "otona", "takuasu", "logo", "replay"],
    ["replay", "mitsubon", "otona", "drink", "udon", "replay", "logo", "drink", "takuasu", "replay", "otona", "yancha", "drink", "replay", "kairo", "mitsubon", "otona", "drink", "yuda", "logo", "replay"],
    ["drink", "replay", "logo", "otona", "kairo", "mitsubon", "replay", "drink", "yuda", "otona", "replay", "yancha", "drink", "takuasu", "replay", "logo", "otona", "mitsubon", "drink", "udon", "replay"],
  ],

  /*
   * 内部抽選（レバーを押した瞬間に決まる）
   * weight は 65536 分のいくつか。残りはハズレ。
   */
  odds: [
    { id: "yancha",   weight: 33 },    // 約 1/2000 プレミア
    { id: "mitsubon", weight: 273 },   // 約 1/240  BIG BONUS
    { id: "logo",     weight: 182 },   // 約 1/360  REG BONUS
    { id: "otona",    weight: 4096 },  // 約 1/16   小役
    { id: "drink",    weight: 5461 },  // 約 1/12   小役
    { id: "replay",   weight: 8978 },  // 約 1/7.3  リプレイ
  ],

  // ボーナスの内容（games ゲームのあいだ、毎ゲーム perGame 枚の払い出し）
  bonus: {
    yancha:   { label: "PREMIUM BIG", games: 30, perGame: 15, extra: 300 },
    mitsubon: { label: "BIG BONUS", games: 20, perGame: 15, extra: 0 },
    logo:     { label: "REG BONUS", games: 8, perGame: 15, extra: 0 },
  },

  /*
   * カットイン
   * video: 動画（mp4 推奨、3〜5秒・2MB程度。例 "assets/slot/mitsubon-scream.mp4"）
   * image: 動画がないときに出す画像
   * どちらも null のあいだは who と text だけの文字演出になります
   */
  cutins: {
    yudaSmall:    { who: "ゆだ", text: "ふふっｗ", video: null, image: null },
    yudaBig:      { who: "ゆだ", text: "ｗｗｗｗｗｗｗ！！", video: null, image: null },
    kairo:        { who: "かいろ", text: "（渾身の変顔）", video: null, image: null },
    otona:        { who: "大人グッピー", text: "……落ち着けよ、みつぼん。", video: null, image: null },
    plead:        { who: "みつぼん", text: "グッピーさぁぁぁん！！元に戻ってくれぇぇぇ！！", video: null, image: null },
    pleadFail:    { who: "大人グッピー", text: "俺はもう、あの頃の俺じゃないんだ。", video: null, image: null },
    yancha:       { who: "ヤンチャグッピー", text: "……しゃあねぇな。戻ってやるよ。", video: null, image: null },
    scream:       { who: "みつぼん", text: "うおおおおおおおおおお！！！！", video: null, image: null },
    reg:          { who: "みつぼん", text: "よっしゃああああ！", video: null, image: null },
    highlight:    { who: "うどん", text: "今の、ちゃんと撮っといたよ。", video: null, image: null },
  },

  // たくあすの実況（場面ごとにランダムで1つ）
  navi: {
    idle:     ["レバーを叩くのですぞ…", "この台、今日は出る気がしますな", "回さなきゃ当たらないですぞ"],
    miss:     ["まだまだ序の口ですな", "ハマりも醍醐味ですぞ", "次ですぞ、次"],
    replay:   ["リプレイ、ありがたいですな", "メダルは減っておりませんぞ"],
    small:    ["小役、悪くないですな", "コツコツ、これが大事"],
    yuda:     ["ゆだ氏が笑いましたぞ…", "この笑い方、知っておりますぞ"],
    rec:      ["うどん氏が録画を始めましたな…", "REC…これは記録案件ですぞ"],
    kairo:    ["で、出た！かいろ氏の変顔ですぞ！！", "変顔は激アツと相場が決まっておりますぞ"],
    reach:    ["リーチですぞ！", "揃え！揃えですぞ！"],
    bonus:    ["キタ━━━━！！！", "これだからスロットはやめられませんぞ！"],
    ceiling:  ["ゲージ満タン…次は確定ですぞ", "我慢した甲斐がありましたな"],
    empty:    ["メダルが尽きましたな…補充を待つのですぞ"],
  },
};
