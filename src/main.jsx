import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import data from './content.json'
import Home from './Home.jsx'
import Reader from './Reader.jsx'
import './styles.css'

// Mini router: a belső <a href="/..."> linkek SPA-navigációt kapnak, View Transition áttűnéssel
function go(to) {
  const nav = () => {
    flushSync(() => {
      history.pushState(null, '', to)
      dispatchEvent(new PopStateEvent('popstate'))
    })
    const id = to.split('#')[1]
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
    else scrollTo({ top: 0, behavior: 'instant' })
  }
  document.startViewTransition ? document.startViewTransition(nav) : nav()
}

addEventListener('click', e => {
  const a = e.target.closest?.('a[href^="/"]')
  if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return
  e.preventDefault()
  go(a.getAttribute('href'))
})

function App() {
  const [path, setPath] = useState(location.pathname)
  useEffect(() => {
    const sync = () => setPath(location.pathname)
    addEventListener('popstate', sync)
    return () => removeEventListener('popstate', sync)
  }, [])
  const i = data.chapters.findIndex(c => path === `/chapter/${c.id}`)
  if (i < 0) return <Home {...data} />
  return <Reader key={path} ch={data.chapters[i]} next={data.chapters[i + 1]} />
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
