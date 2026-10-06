# Alexander x Vharaz — webcomic

Vite + React, lapozás: [page-flip](https://github.com/Nodlik/StPageFlip).

## Új fejezet hozzáadása

Töltsd fel a fejezet mappáját a repó gyökerébe
(GitHub → **Add file → Upload files** → húzd be a mappát → **Commit changes**).
A Vercel magától újraépíti az oldalt: megjelenik az új fejezet, mellette a következő „Coming soon”.

Elnevezés:

- mappa: `1_Chapter`, `2_Chapter`, `3_Chapter` … (a szám adja a sorrendet és a címet: First Chapter, Second Chapter …)
- benne: `1.png`, `2.png`, `3.png` … (bármennyi oldal) + `wallpaper.png` (borító)
- opcionális: `title.txt` a mappában → egyedi fejezetcím
- karakterképek: `Characters/`, favicon: `public/favicon.png`

A képeket buildkor a `scripts/content.mjs` alakítja AVIF-re. A `public/comic/` és a `src/content.json`
generált fájlok, ezért nincsenek a gitben.

## Helyben

```bash
npm install
npm run dev       # http://localhost:5173
```

## Vercel

GitHub repó importálása → Deploy. Semmit nem kell beállítani.
