/* 搜索区：远端 fundsuggest + 本地 funds-index 模糊匹配 */
import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { fetchGz, loadFundsIndex, repoIssueUrl, searchFunds } from '@services/api'
import type { FundIndexItem, GzData, SearchHit, WatchFund } from '@/types'
import { pct, pctClass } from '@/utils/format'
import shared from '@/styles/shared.module.scss'
import styles from './index.module.scss'

interface Props {
  watchlist: WatchFund[]
}

export default function Search({ watchlist }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchHit[]>([])
  const [showResults, setShowResults] = useState(false)
  const [indexMeta, setIndexMeta] = useState('')
  const [quick, setQuick] = useState<{ hit: SearchHit; gz: GzData | null } | null>(null)
  const indexRef = useRef<FundIndexItem[] | null>(null)
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

    const remote = await searchFunds(key)

    let local: SearchHit[] = []
    if (key.length >= 2) {
      if (!indexRef.current) {
        indexRef.current = await loadFundsIndex()
        setIndexMeta(`本地索引 ${indexRef.current.length} 只`)
      }
      const lower = key.toLowerCase()
      local = indexRef.current
        .filter(
          (f) =>
            f.code.startsWith(key) ||
            f.name.toLowerCase().includes(lower) ||
            (f.jp && f.jp.toLowerCase().includes(lower))
        )
        .slice(0, 30)
        .map((f) => ({ code: f.code, name: f.name, type: f.type }))
    }

    const seen = new Set<string>()
    const merged: SearchHit[] = []
    for (const r of [...remote, ...local]) {
      if (!r.code || seen.has(r.code)) continue
      seen.add(r.code)
      merged.push(r)
      if (merged.length >= 20) break
    }
    setResults(merged)
    setShowResults(true)
  }

  async function showQuick(hit: SearchHit) {
    setShowResults(false)
    setQuick({ hit, gz: null })
    const gz = await fetchGz(hit.code)
    setQuick({ hit, gz })
  }

  return (
    <section className={shared.card}>
      <div className={shared.cardHead}>
        <h2>搜索基金</h2>
        <span className="muted small">{indexMeta}</span>
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
                  <span className={styles.type}>{r.type}</span>
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
          <div className={styles.actions}>
            <a className={styles.primary} href={`#/fund/${quick.hit.code}`}>
              查看详情
            </a>
            {watchlist.some((w) => w.code === quick.hit.code) ? (
              <button type="button" className={classNames(shared.ghostBtn)} disabled>
                已在跟踪
              </button>
            ) : (
              <a
                className={shared.ghostBtn}
                href={repoIssueUrl(quick.hit.code, quick.hit.name)}
                target="_blank"
                rel="noopener noreferrer"
              >
                加入跟踪
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
