/*
 * イベント情報の設定ファイル
 * サイト上の表記はすべてここから読み込まれます。TBD の項目は決まり次第書き換えてください。
 */
window.EVENT_CONFIG = {
  name: "OTAKU YEAR-END RAVE 2026",
  subtitle: "推し曲ビンゴ忘年会",
  tagline: "あなたの「私といえばこの曲」で、今年を締めくくろう。",

  // 開催日時（カウントダウンに使用）
  start: "2026-12-31T12:00:00+09:00",
  end: "2026-12-31T17:00:00+09:00",
  dateLabel: "2026.12.31 THU",
  timeLabel: "12:00 - 17:00",

  // 料金
  fee: 2800,
  drink: 1200,
  drinkCount: 2,

  // 申込関連
  capacity: "TBD",
  deadline: "TBD",
  // Googleフォームの共有URL（例: https://forms.gle/xxxx）。空ならボタンは「準備中」表示
  formUrl: "",
  // Googleフォームの埋め込みURL（…/viewform?embedded=true）。空なら埋め込みは非表示
  formEmbedUrl: "",

  // 主催者連絡先
  contact: { label: "X (旧Twitter)", handle: "@TBD", url: "" },

  // 当日のタイムテーブル（仮）
  schedule: [
    { time: "12:00", title: "OPEN / DJ START", note: "受付・ドリンクチケット受け取り。ビンゴカードを発行しよう" },
    { time: "12:15", title: "DJ TIME & BINGO", note: "みんなの「私といえばこの曲」が次々と流れます" },
    { time: "16:00", title: "BINGO 結果発表", note: "ビンゴ達成者は景品受け取りへ" },
    { time: "16:30", title: "年忘れラストスパート", note: "締めの一曲で2026年を送り出そう" },
    { time: "17:00", title: "CLOSE", note: "良いお年を！" },
  ],

  // 会場
  venue: {
    name: "Entertainment BAR Guild",
    zip: "〒556-0005",
    address: "大阪府大阪市浪速区日本橋5-12-5 KS日本橋ビル 6F",
    note: "※ 階数は過去の情報で4Fと記載されている場合があります。最新情報は公式サイトでご確認ください。",
    site: "https://barguild.com/",
    mapQuery: "Entertainment BAR Guild 大阪市浪速区日本橋5-12-5",
  },

  // 1人あたりの申請曲数（フォームの設問数に合わせる）
  songsPerPerson: 1,

  // ビンゴカードの発行開始時刻（申請曲からランダムに25曲を選んで発行）。空なら start と同じ
  cardOpenAt: "2026-12-31T12:00:00+09:00",

  /*
   * 申請一覧の読み込み元
   * Googleフォームの回答スプレッドシートを「ファイル → 共有 → ウェブに公開 → CSV」で公開したURL。
   * 例: https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=csv
   * ※ 公開したシートの内容は誰でも見られます。メールアドレス等は収集しないでください。
   */
  sheetCsvUrl: "",

  /*
   * 手動で追加する曲（フォーム外で受け付けた分や、25曲に満たない場合のDJ側の補充曲など）
   * 例: { title: "曲名", artist: "アーティスト", by: "申請者のハンドルネーム" }
   */
  songs: [],
};
