/* 搜索区：调后端 /api/fund/search + /api/fund/realtime */
import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { addWatchlist, fetchGz, searchFunds } from '@services/api'
import type { GzData, SearchHit, WatchFund } from '@/types'
import { pct, pctClass } from '@/utils/format'
import shared from '@/styles/shared.module.scss'
import styles from './index.module.scss'

interface Props {
  watchlist: WatchFund[]
  onWatchlistChange?: () => void
}

export default function Search({ watchlist, onWatchlistChange }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchHit[]>([])
  const [showResults, setShowResults] = useState(false)
  const [quick, setQuick] = useState<{ hit: SearchHit; gz: GzData | null } | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const debounceRef = useRef<number | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const lastQueryRef = useRef('')

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  function onChange(value: string) {
    setQ(value)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setResults([])
      setShowResults(false)
      return
    }
    debounceRef.current = window.setTimeout(() => {
      void doSearch(value.trim())
    }, 250)
  }

  async function doSearch(key: string) {
    if (key === lastQueryRef.current) return
    lastQueryRef.current = key
    const list = await searchFunds(key)
    setResults(list)
    setShowResults(true)
  }

  async function showQuick(hit: SearchHit) {
    setShowResults(false)
    setQuick({ hit, gz: null })
    setAddError('')
    const gz = await fetchGz(hit.code)
    setQuick({ hit, gz })
  }

  async function handleAdd() {
    if (!quick) return
    setAdding(true)
    setAddError('')
    try {
      await addWatchlist(quick.hit.code, quick.hit.name)
      onWatchlistChange?.()
    } catch (e) {
      setAddError(e instanceof Error ? e.message : String(e))
    } finally {
      setAdding(false)
    }
  }

  return (
    <section className={shared.card}>
      <div className={shared.cardHead}>
        <h2>搜索基金</h2>
      </div>
      <div className={styles.box} ref={wrapRef}>
        <input
          type="search"
          value={q}
          onChange={(e) => onChange(e.target.value)}
          placeholder="输入基金代码或名称（中/拼音首字母均可）"
          autoComplete="off"
          className={styles.input}
        />
        {showResults && (
          <ul className={styles.results}>
            {!results.length ? (
              <li className="muted">无结果</li>
            ) : (
              results.map((r) => (
                <li key={r.code} onClick={() => showQuick(r)}>
                  <span className={styles.name}>
                    <span className="muted">{r.code}</span> {r.name}
                  </span>
                  <span className={styles.type}>{r.ftype || r.type || ''}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {quick && (
        <div className={styles.quick}>
          <h3>
            <span>
              {quick.hit.code} {quick.hit.name}
            </span>
            <span className={pctClass(quick.gz?.gszzl)}>
              {quick.gz ? pct(quick.gz.gszzl) : '加载中…'}
            </span>
          </h3>
          <div className="muted small">
            上日净值 {quick.gz?.dwjz || '—'} · 估值 {quick.gz?.gsz || '—'} ·{' '}
            {quick.gz?.gztime || ''}
          </div>
          {addError && <div className={classNames('small', styles.errorText)}>{addError}</div>}
          <div className={styles.actions}>
            <a className={styles.primary} href={`#/fund/${quick.hit.code}`}>
              查看详情
            </a>
            {watchlist.some((w) => w.code === quick.hit.code) ? (
              <button type="button" className={shared.ghostBtn} disabled>
                已在跟踪
              </button>
            ) : (
              <button
                type="button"
                className={shared.ghostBtn}
                onClick={() => void handleAdd()}
                disabled={adding}
              >
                {adding ? '添加中…' : '加入跟踪'}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
