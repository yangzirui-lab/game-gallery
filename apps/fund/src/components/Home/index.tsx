import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import Watchlist from '@components/Watchlist'
import Search from '@components/Search'
import { loadGlobalMeta, loadWatchlist } from '@services/api'
import type { GlobalMeta, WatchFund } from '@/types'
import shared from '@/styles/shared.module.scss'

const REPO_URL = 'https://github.com/YBoomer/fund-tracker'

export default function Home() {
  const [watchlist, setWatchlist] = useState<WatchFund[]>([])
  const [meta, setMeta] = useState<GlobalMeta | null>(null)

  useEffect(() => {
    void (async () => {
      const [wl, m] = await Promise.all([loadWatchlist(), loadGlobalMeta()])
      setWatchlist(wl || [])
      setMeta(m)
    })()
  }, [])

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1>Fund Tracker</h1>
        <div className={shared.meta}>
          {meta?.last_update && (
            <span>上次抓取 {new Date(meta.last_update).toLocaleString('zh-CN')}</span>
          )}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            repo <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
          </a>
        </div>
      </header>

      <main className={shared.main}>
        <Watchlist funds={watchlist} />
        <Search watchlist={watchlist} />
      </main>

      <footer className={shared.footer}>
        数据：天天基金 / 新浪财经（公开行情）。仅供参考，不构成投资建议。
      </footer>
    </div>
  )
}
