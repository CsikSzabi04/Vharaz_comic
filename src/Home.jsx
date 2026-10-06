import { useEffect, useState } from 'react'

// Felszálló parázs-részecskék a hero-ban (determinisztikus „random”)
const EMBERS = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 41) % 100}%`,
  '--s': `${2 + (i % 3)}px`,
  '--d': `${(7 + (i % 5) * 1.6).toFixed(1)}s`,
  '--delay': `-${((i * 1.7) % 10).toFixed(1)}s`,
  '--x': `${((i % 7) - 3) * 18}px`,
}))

export default function Home({ chapters, characters }) {
  const [open, setOpen] = useState(-1)
  const first = chapters[0]
  // Hero háttér: a legszélesebb karakterkép (fekvő), különben az első borító
  const hero = [...characters].sort((a, b) => b.w / b.h - a.w / a.h)[0]?.src ?? first?.cover

  return (
    <>
      <header className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${hero})` }} />
        <div className="embers" aria-hidden="true">{EMBERS.map((s, i) => <i key={i} style={s} />)}</div>
        <div className="hero-text">
          <p className="eyebrow">Dark fantasy webcomic</p>
          <h1>Alexander x&nbsp;Vharaz</h1>
          <div className="actions">
            {first && <a className="btn primary" href={`/chapter/${first.id}`}>Start reading</a>}
          </div>
        </div>
      </header>

      <section id="chapters" className="section">
        <h2>Chapters</h2>
        <div className="chapters">
          {chapters.map(c => (
            <a key={c.id} className="chapter" href={`/chapter/${c.id}`}>
              <img src={c.cover} alt="" loading="lazy" />
              <div className="chapter-info">
                <small>Chapter {c.n}</small>
                <h3>{c.title}</h3>
                <span>{c.pages.length} pages · Read →</span>
              </div>
            </a>
          ))}
          <div className="chapter soon">
            <small>Chapter {(chapters.at(-1)?.n ?? 0) + 1}</small>
            <h3>Coming soon</h3>
          </div>
        </div>
      </section>

      {characters.length > 0 && (
        <section id="characters" className="section">
          <h2>Characters</h2>
          <div className="gallery">
            {characters.map((c, i) => (
              <button key={c.src} onClick={() => setOpen(i)}>
                <img src={c.src} alt={c.name} width={c.w} height={c.h} loading="lazy" />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {open >= 0 && <Lightbox items={characters} i={open} set={setOpen} />}
    </>
  )
}

function Lightbox({ items, i, set }) {
  const step = d => set((i + d + items.length) % items.length)
  useEffect(() => {
    const key = e => {
      if (e.key === 'Escape') set(-1)
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    addEventListener('keydown', key)
    document.body.style.overflow = 'hidden'
    return () => {
      removeEventListener('keydown', key)
      document.body.style.overflow = ''
    }
  })
  const nav = d => e => { e.stopPropagation(); step(d) }

  return (
    <div className="lightbox" onClick={() => set(-1)}>
      <img key={items[i].src} src={items[i].src} alt={items[i].name} />
      <p>{items[i].name}</p>
      <button className="lb-nav prev" onClick={nav(-1)} aria-label="Previous">‹</button>
      <button className="lb-nav next" onClick={nav(1)} aria-label="Next">›</button>
    </div>
  )
}
