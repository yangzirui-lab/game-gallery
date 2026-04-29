import { useEffect, useState } from 'react'
import Home from '@components/Home'
import Detail from '@components/Detail'

interface Route {
  page: 'home' | 'detail'
  code?: string
}

function parseHash(): Route {
  const h = window.location.hash || ''
  const m = h.match(/^#\/fund\/(\d{6})\/?$/)
  if (m) return { page: 'detail', code: m[1] }
  return { page: 'home' }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash)

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route.page === 'detail' && route.code) {
    return <Detail code={route.code} />
  }
  return <Home />
}
