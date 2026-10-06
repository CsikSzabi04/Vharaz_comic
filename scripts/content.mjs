// Képek feldolgozása – a dev/build előtt automatikusan fut (a Vercelen is, minden pushnál):
//   N_Chapter/  (1.png, 2.png, … bármennyi + wallpaper.png)  → fejezetek
//   Characters/                                              → karakterképek
//   public/favicon.png                                       → kis ikonok
// Kimenet (generált, nincs a gitben): public/comic/*.avif + src/content.json
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'

const OUT = 'public/comic'
const CACHE = 'node_modules/.cache/comic' // buildek között megmarad → csak az új képeket konvertálja
const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth']

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const nice = s => s.replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase())

async function convert(file, id) {
  const name = slug(path.parse(file).name)
  const buf = fs.readFileSync(file)
  const cached = path.join(CACHE, crypto.createHash('sha1').update('avif60').update(buf).digest('hex') + '.avif')
  if (!fs.existsSync(cached)) await sharp(buf).avif({ quality: 60 }).toFile(cached)
  fs.copyFileSync(cached, path.join(OUT, id, name + '.avif'))
  const { width: w, height: h } = await sharp(buf).metadata()
  return { name, src: `/comic/${id}/${name}.avif`, w, h }
}

function images(dir, id, re) {
  fs.mkdirSync(path.join(OUT, id), { recursive: true })
  const files = fs.readdirSync(dir).filter(f => re.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  return Promise.all(files.map(f => convert(path.join(dir, f), id)))
}

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(CACHE, { recursive: true })
const dirs = fs.readdirSync('.', { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)

const chapters = []
for (const dir of dirs) {
  const n = Number(dir.match(/^(\d+)[ _-]*chapters?$/i)?.[1]) // 1_Chapter → 1
  if (!n) continue
  const imgs = await images(dir, String(n), /^(\d+|wallpaper)\.(png|jpe?g|webp)$/i)
  const pages = imgs.filter(i => i.name !== 'wallpaper')
  if (!pages.length) continue
  const titleFile = path.join(dir, 'title.txt')
  chapters.push({
    id: String(n),
    n,
    title: fs.existsSync(titleFile) ? fs.readFileSync(titleFile, 'utf8').trim() : ORD[n - 1] ? `${ORD[n - 1]} Chapter` : `Chapter ${n}`,
    cover: (imgs.find(i => i.name === 'wallpaper') ?? pages[0]).src,
    w: pages[0].w,
    h: pages[0].h,
    pages: pages.map(p => p.src),
  })
}
chapters.sort((a, b) => a.n - b.n)

const charDir = dirs.find(d => /^characters?$/i.test(d))
const characters = charDir
  ? (await images(charDir, 'characters', /\.(png|jpe?g|webp)$/i)).map(({ name, ...i }) => ({ name: nice(name), ...i }))
  : []

fs.writeFileSync('src/content.json', JSON.stringify({ chapters, characters }, null, 1))

if (fs.existsSync('public/favicon.png')) {
  for (const s of [64, 180]) await sharp('public/favicon.png').resize(s, s).png().toFile(`public/icon-${s}.png`)
}
console.log(`comic: ${chapters.map(c => `${c.n}. fejezet (${c.pages.length} oldal)`).join(', ') || 'nincs fejezet'}, ${characters.length} karakterkép`)
