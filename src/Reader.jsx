import { useEffect, useRef, useState } from 'react'
import { PageFlip } from 'page-flip/dist/js/page-flip.module.js'
import 'page-flip/src/Style/stPageFlip.css'

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

export default function Reader({ ch, next }) {
  const stage = useRef(null)
  const book = useRef(null)
  const current = useRef(0)
  const [page, setPage] = useState(0)
  const [spread, setSpread] = useState(null) // true: két oldal egymás mellett, false: egy oldal
  const N = ch.pages.length

  useEffect(() => {
    document.title = `${ch.title} · Alexander x Vharaz`
    // Dupla oldal csak akkor, ha a hely elég széles hozzá
    const fit = () => setSpread(stage.current.clientWidth / stage.current.clientHeight > (ch.w / ch.h) * 1.6)
    const key = e => {
      if (e.key === 'ArrowRight') book.current?.flipNext()
      if (e.key === 'ArrowLeft') book.current?.flipPrev()
    }
    fit()
    addEventListener('resize', fit)
    addEventListener('keydown', key)
    return () => {
      document.title = 'Alexander x Vharaz'
      removeEventListener('resize', fit)
      removeEventListener('keydown', key)
    }
  }, [ch])

  useEffect(() => {
    if (spread === null) return
    // A könyv DOM-ját a PageFlip mozgatja, ezért nem React rendereli
    const el = document.createElement('div')
    el.className = 'book'
    const html = [
      `<div class="page cover"><img data-src="${ch.cover}" alt=""></div>`,
      ...ch.pages.map((src, i) => `<div class="page"><img data-src="${src}" alt="Page ${i + 1}"></div>`),
      `<div class="page"><div class="end">
        <small>End of chapter ${ch.n}</small><h2>${ch.title}</h2>
        ${next ? `<a class="btn primary" href="/chapter/${next.id}">Next: ${next.title}</a>` : '<p>To be continued…</p>'}
        <a class="btn" href="/#chapters">All chapters</a>
      </div></div>`,
    ]
    // Dupla oldalon átlátszó üres lapokkal párosítunk, így nincs magányos első/utolsó lap
    // (azokat a könyvtár „hard” lapként rossz helyre rajzolná)
    const off = spread ? 1 : 0 // könyv-index = oldal-index + off
    if (spread) {
      html.unshift('<div class="page blank"></div>')
      if (html.length % 2) html.push('<div class="page blank"></div>')
    }
    el.innerHTML = html.join('')
    stage.current.append(el)

    // Csak az aktuális oldal környékét tölti be → gyors indulás
    const imgs = [...el.querySelectorAll('img')]
    const warm = p => imgs.slice(Math.max(0, p - 2), p + 8).forEach(img => { if (!img.src) img.src = img.dataset.src })
    warm(current.current)

    const pf = new PageFlip(el, {
      width: ch.w,
      height: ch.h,
      size: 'stretch',
      autoSize: false,
      usePortrait: !spread,
      minWidth: spread ? 100 : 1e5, // egyoldalas módban így mindig portrait
      maxWidth: 1e6,
      startPage: current.current + off,
      flippingTime: 800,
      maxShadowOpacity: 0.6,
      mobileScrollSupport: false,
    })
    pf.loadFromHTML(el.querySelectorAll('.page'))
    pf.getPageCollection().pages.forEach(p => p.setDensity('soft')) // minden lap görbülve lapozódik
    el.style.minWidth = el.style.minHeight = '' // a könyvtár fix min-méretet írna rá

    // Csukott könyv (borító / hátlap) középre tolása dupla oldalas módban
    const shift = dir => { el.style.translate = `${(dir * pf.getRender().getRect().pageWidth) / 2}px 0` }
    const center = () => shift(!spread ? 0 : current.current === 0 ? -1 : current.current > N ? 1 : 0)
    // kinyitáskor már lapozás közben középre csúszik
    pf.on('changeState', e => (e.data === 'flipping' ? shift(0) : e.data === 'read' && center()))
    pf.on('flip', e => {
      current.current = Math.max(0, e.data - off)
      setPage(current.current)
      warm(current.current)
      center()
    })
    addEventListener('resize', center)
    center()
    book.current = pf

    return () => {
      removeEventListener('resize', center)
      pf.destroy()
      pf.getRender().render = () => {} // a könyvtár rAF-ciklusa destroy után is futna
      book.current = null
    }
  }, [spread, ch, next])

  const last = spread && N % 2 ? N : N + 1
  const to = spread ? Math.min(page + 1, N) : page
  const label = page === 0 ? 'Cover' : page > N ? 'The End' : `${page}${to > page ? `–${to}` : ''} / ${N}`

  return (
    <div className="reader">
      <div className="reader-bg" style={{ backgroundImage: `url(${ch.cover})` }} />
      <div className="reader-bar">
        <a className="icon-btn" href="/#chapters" aria-label="Back to chapters"><Icon d="M19 12H5M12 19l-7-7 7-7" /></a>
        <div className="reader-title"><small>Chapter {ch.n}</small>{ch.title}</div>
        {document.fullscreenEnabled && (
          <button
            className="icon-btn"
            aria-label="Fullscreen"
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
          >
            <Icon d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
          </button>
        )}
      </div>
      <div className="stage" ref={stage} />
      <div className="reader-bar bottom">
        <button className="icon-btn" onClick={() => book.current?.flipPrev()} disabled={page === 0} aria-label="Previous page">
          <Icon d="M15 18l-6-6 6-6" />
        </button>
        <div className="progress">
          <span>{label}</span>
          <i style={{ width: `${(page / last) * 100}%` }} />
        </div>
        <button className="icon-btn" onClick={() => book.current?.flipNext()} disabled={page >= last} aria-label="Next page">
          <Icon d="M9 18l6-6-6-6" />
        </button>
      </div>
    </div>
  )
}
