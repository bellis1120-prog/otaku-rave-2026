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
    mitsubon: { name: "みつぼん", short: "みつぼん", color: "#ff2bd6", img: "assets/slot/mitsubon.png" },
    yancha:   { name: "ヤンチャグッピー", short: "ヤンチャ", color: "#f9f871", img: "assets/slot/yancha.png" },
    otona:    { name: "大人グッピー", short: "大人 グッピー", color: "#9a94bf", img: "assets/slot/otona.png", pay: 10 },
    logo:     { name: "UCHIKAI", short: "UCHI//KAI", color: "#19f0ff", img: null },
    drink:    { name: "ドリンク", short: "🍺", color: "#ffb347", img: null, pay: 4 },
    replay:   { name: "リプレイ", short: "REPLAY", color: "#3ddc97", img: null },
    yuda:     { name: "ゆだ", short: "ゆだ", color: "#ff7a59", img: "assets/slot/yuda.png" },
    udon:     { name: "うどん", short: "うどん", color: "#e8e3c9", img: "assets/slot/udon.png" },
    kairo:    { name: "かいろ", short: "かいろ", color: "#8b5cff", img: "assets/slot/kairo.png" },
    takuasu:  { name: "たくあす", short: "たくあす", color: "#6fd3ff", img: "assets/slot/takuasu.png" },
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
   * text: セリフ（配列にすると出るたびにランダムで1つ）
   * video: 動画（mp4 推奨、3〜5秒・2MB程度。例 "assets/slot/mitsubon-scream.mp4"）
   * image: 動画がないときに出す画像（配列にすると出るたびにランダムで1枚）
   * どちらも null のあいだは who と text だけの文字演出になります
   */
  cutins: {
    yudaSmall: { who: "ゆだ", video: null, image: "assets/slot/yuda.png",
      text: ["ふふっｗ", "んふっ…ｗ", "ちょ、待ってｗ", "え、今のなにｗ"] },
    yudaBig: { who: "ゆだ", video: null, image: "assets/slot/yuda-cutin.png",
      text: ["ｗｗｗｗｗｗｗ！！", "ひーっｗｗ腹痛いｗｗ", "あかんｗｗこれはアツいｗｗ", "この台わかってるｗｗｗ"] },
    kairo: { who: "かいろ", video: null, image: ["assets/slot/kairo-face1.png", "assets/slot/kairo-face2.png"],
      text: ["（渾身の変顔）", "（顔のパーツが全部中央に集まる）", "（無言で変顔をキープ）", "（VJ用の素材になりそうな顔）"] },
    otona: { who: "大人グッピー", video: null, image: "assets/slot/otona-cutin.png",
      text: ["……落ち着けよ、みつぼん。", "大声出すなって。周りに迷惑だろ。", "俺、明日も朝から仕事だから。", "そういうの、もう卒業したんだよ。"] },
    plead: { who: "みつぼん", video: null, image: "assets/slot/mitsubon-scream.png",
      text: ["グッピーさぁぁぁん！！元に戻ってくれぇぇぇ！！", "あの頃のグッピーさんを返してくれぇぇぇ！！", "オレをこんなにしたのはアンタでしょうがぁぁぁ！！", "大人になんかならないでくれぇぇぇ！！"] },
    pleadFail: { who: "大人グッピー", video: null, image: "assets/slot/otona-cutin.png",
      text: ["俺はもう、あの頃の俺じゃないんだ。", "……大人になれよ、みつぼん。", "その話、今度ゆっくり飲みながら聞くわ。", "悪いな。終電あるから。"] },
    yancha: { who: "ヤンチャグッピー", video: null, image: "assets/slot/yancha-cutin.png",
      text: ["……しゃあねぇな。戻ってやるよ。", "みつぼん、行くぞ。今夜は朝までだ。", "待たせたな。", "スーツなんか脱いじまえ！！"] },
    scream: { who: "みつぼん", video: null, image: "assets/slot/mitsubon-scream.png",
      text: ["うおおおおおおおおおお！！！！", "キタアアアアアアアア！！！！", "みんな見てたぁぁぁ！？！？", "これがオレの生き様だぁぁぁ！！"] },
    reg: { who: "みつぼん", video: null, image: "assets/slot/mitsubon-scream.png",
      text: ["よっしゃああああ！", "まぁまぁまぁまぁ！！", "REGでも嬉しいぃぃ！", "小さくても当たりは当たりぃぃ！"] },
    highlight: { who: "うどん", video: null, image: "assets/slot/udon-thumb.png",
      text: ["今の、ちゃんと撮っといたよ。", "はい、サムネこれで決まり。", "テロップ入れとくね。", "この回、再生数伸びるわ。"] },
    ceiling: { who: "たくあす", video: null, image: "assets/slot/takuasu.png",
      text: ["……フッ。ゲージ満タン、次は確定ですぞ", "ここまで回した者だけが辿り着く境地ですぞ", "天井…それは救済ですぞ"] },
  },

  /*
   * 掛け合い（キャラ同士の短いやり取り）
   * 場面ごとに1パターンをランダムで選び、上から順にカットインで出します。
   * 画像は faces から名前で自動的に選ばれます。
   */
  faces: {
    "みつぼん": "assets/slot/mitsubon.png",
    "大人グッピー": "assets/slot/otona.png",
    "ヤンチャグッピー": "assets/slot/yancha.png",
    "ゆだ": "assets/slot/yuda.png",
    "うどん": "assets/slot/udon.png",
    "かいろ": "assets/slot/kairo.png",
    "たくあす": "assets/slot/takuasu.png",
  },
  talks: {
    // ゆだの笑い予告のあと（50%）
    yuda: [
      [["みつぼん", "ゆださん、なに笑ってんすか！！"], ["ゆだ", "いや、この台アツいってｗ"]],
      [["たくあす", "ゆだ氏の笑いは信頼度高いですぞ"], ["ゆだ", "パチ屋で鍛えたからなｗ"]],
      [["みつぼん", "ゆださんが笑うとオレまで笑えてくるぅぅ！！"], ["ゆだ", "声でかｗｗ"]],
      [["ゆだ", "これ、前に一緒に行った店と同じ流れｗ"], ["みつぼん", "あの日は飲まれましたけどねぇぇ！！"]],
    ],
    // うどんの REC が始まったとき（40%）
    rec: [
      [["うどん", "はい、回ってまーす"], ["みつぼん", "今撮ってます！？うおおおお！！"]],
      [["みつぼん", "うどんさん！ここ使ってください！！"], ["うどん", "使えるかは編集で決める"]],
      [["うどん", "このくだり、尺足りてる？"], ["かいろ", "（変顔で尺を稼ぐ）"]],
      [["たくあす", "撮影中は品行方正にいきますぞ"], ["うどん", "いつも通りでいいよ、むしろ"]],
    ],
    // かいろの変顔のあと（60%）
    kairo: [
      [["たくあす", "その顔、面接では封印ですぞ"], ["かいろ", "面接は……来年から本気出す"]],
      [["みつぼん", "かいろぉぉ！！その顔VJで流そう！！"], ["かいろ", "もう素材にしてある"]],
      [["うどん", "今の、サムネにしていい？"], ["かいろ", "ギャラ次第"]],
      [["ゆだ", "ｗｗｗ顔面がリーチしてるｗｗｗ"], ["かいろ", "（さらに変顔）"]],
    ],
    // ボーナスなしで 100G・200G に達したとき
    hamari: [
      [["たくあす", "パチ屋なら、そろそろ台移動を考える頃ですぞ"], ["ゆだ", "ここからが本番ｗ"]],
      [["ゆだ", "この台、なかなか渋いなｗ"], ["たくあす", "渋い台ほど燃えますぞ"]],
      [["大人グッピー", "……そろそろやめとけよ"], ["みつぼん", "グッピーさんまでそんなこと言わないでぇぇ！！"]],
      [["かいろ", "アニメなら次回でキャラが覚醒する流れ"], ["みつぼん", "じゃあ次回はオレが覚醒するぅぅ！！"]],
    ],
    // ボーナス終了後（50%）
    bonusEnd: [
      [["みつぼん", "みんなありがとおおおお！！"], ["大人グッピー", "……声でけぇよ"]],
      [["ゆだ", "次も当てようぜｗ"], ["たくあす", "連チャン期待ですぞ"]],
      [["うどん", "いい画撮れた"], ["かいろ", "VJで流すから送って"]],
    ],
    // ハズレのあとにたまに（4%）
    idle: [
      [["かいろ", "このリール、アニメ化しないかな"], ["うどん", "編集するの俺なんだけど"]],
      [["みつぼん", "回せぇぇぇ！！回せぇぇぇ！！"], ["ゆだ", "声でかｗ"]],
      [["たくあす", "デュフ…ここは押し順が大事ですぞ"], ["ゆだ", "押し順関係ないやつｗ"]],
      [["うどん", "今のとこ、特に撮れ高ないな"], ["みつぼん", "じゃあオレが叫びますぅぅ！！"]],
    ],
  },

  // ボーナス後の「うどん編集ハイライト」に添える画像（null なら文字だけ）
  highlightImg: "assets/slot/udon-thumb.png",

  // たくあすの実況アイコン（null なら名前だけ表示）
  naviImg: "assets/slot/takuasu-face.png",

  // たくあすの実況（場面ごとにランダムで1つ）
  navi: {
    idle:     ["レバーを叩くのですぞ…", "この台、今日は出る気がしますな", "回さなきゃ当たらないですぞ", "デュフ…いい台を選びましたな"],
    miss:     ["まだまだ序の口ですな", "ハマりも醍醐味ですぞ", "次ですぞ、次", "今のは見なかったことにしますぞ"],
    replay:   ["リプレイ、ありがたいですな", "メダルは減っておりませんぞ", "タダで回せる、これぞ至福"],
    small:    ["小役、悪くないですな", "コツコツ、これが大事", "地味にうれしいやつですぞ"],
    yuda:     ["ゆだ氏が笑いましたぞ…", "この笑い方、知っておりますぞ", "ゆだ氏の笑いは当たりの合図ですぞ"],
    rec:      ["うどん氏が録画を始めましたな…", "REC…これは記録案件ですぞ", "カメラが回っていますぞ、キメ顔で"],
    kairo:    ["で、出た！かいろ氏の変顔ですぞ！！", "変顔は激アツと相場が決まっておりますぞ", "その顔、出るときは出ますぞ"],
    reach:    ["リーチですぞ！", "揃え！揃えですぞ！", "頼む…頼みますぞ…！"],
    bonus:    ["キタ━━━━！！！", "これだからスロットはやめられませんぞ！", "おめでとうございますぞ！！"],
    ceiling:  ["ゲージ満タン…次は確定ですぞ", "我慢した甲斐がありましたな"],
    empty:    ["メダルが尽きましたな…補充を待つのですぞ", "休憩も立ち回りのうちですぞ"],
  },
};
