# OTAKU YEAR-END RAVE 2026 サイト

静的サイト（HTML / CSS / JS + anime.js）。GitHub Pages 等にそのまま配置できます。

## ページ
- `index.html` … トップ（概要・ビンゴ説明・景品・タイムテーブル・開催概要・申込・FAQ）
- `access.html` … 会場アクセス（Google マップ埋め込み）
- `bingo.html` … Web ビンゴカード

## 情報の更新
表示内容はすべて `js/config.js` で管理しています。

- `formUrl` / `formEmbedUrl` … Google フォームの共有 URL / 埋め込み URL
- `capacity` / `deadline` / `contact` … 定員・締切・連絡先
- `schedule` … タイムテーブル
- `songs` … フォームで集まった曲。24 曲以上登録すると本番カードになります（それまではデモ表示）

```js
songs: [
  { title: "曲名", artist: "アーティスト", by: "申請者" },
]
```

ビンゴカードは「名前 + 曲リスト」から決まるため、当日までに `songs` を確定させてから公開してください（曲を変更すると全員のカードが変わります）。

## ローカル確認
```bash
python3 -m http.server 8080
```
