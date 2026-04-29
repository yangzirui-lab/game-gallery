/* 个基详情页 */
import { useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'
import {
  fetchGz,
  fetchQuotes,
  loadDaily,
  loadHoldings,
  loadIndustryEtfs,
  loadIntraday,
  loadMeta,
  loadWatchlist,
} from '@services/api'
import Sparkline from '@components/Sparkline'
import type {
  DailyData,
  FundMeta,
  HoldingsData,
  IndustryEtf,
  IntradayData,
  IntradayPoint,
  QuoteRow,
} from '@/types'
import { isTradeMinute, num, pct, pctClass } from '@/utils/format'
import shared from '@/styles/shared.module.scss'
import styles from './index.module.scss'

interface Props {
  code: string
}

export default function Detail({ code }: Props) {
  const [meta, setMeta] = useState<FundMeta | null>(null)
  const [intraday, setIntraday] = useState<IntradayData | null>(null)
  const [holdings, setHoldings] = useState<HoldingsData | null>(null)
  const [holdingQuotes, setHoldingQuotes] = useState<QuoteRow[]>([])
  const [daily, setDaily] = useState<DailyData | null>(null)
  const [etfs, setEtfs] = useState<IndustryEtf[]>([])
  const [etfQuotes, setEtfQuotes] = useState<QuoteRow[]>([])
  const [industry, setIndustry] = useState<string>('—')
  const [fundName, setFundName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [quoteRefreshing, setQuoteRefreshing] = useState(false)
  const intradayRef = useRef<IntradayData | null>(null)
  const holdingsRef = useRef<HoldingsData | null>(null)
  const etfsRef = useRef<IndustryEtf[]>([])
  const loadRequestRef = useRef(0)

  useEffect(() => {
    intradayRef.current = intraday
  }, [intraday])

  useEffect(() => {
    holdingsRef.current = holdings
  }, [holdings])

  useEffect(() => {
    etfsRef.current = etfs
  }, [etfs])

  useEffect(() => {
    void initialLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!isTradeMinute()) return
      void refreshIntradayPoint()
      void refreshHoldingQuotes()
    }, 30000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  async function initialLoad() {
    const requestId = loadRequestRef.current + 1
    loadRequestRef.current = requestId
    setLoading(true)
    setLoadError('')
    setFundName(code)
    setMeta(null)
    setIntraday(null)
    setHoldings(null)
    setHoldingQuotes([])
    setDaily(null)
    setEtfs([])
    setEtfQuotes([])
    setIndustry('—')
    try {
      const [m, intra, hold, dly, etfMap, wl] = await Promise.all([
        loadMeta(code),
        loadIntraday(code),
        loadHoldings(code),
        loadDaily(code),
        loadIndustryEtfs(),
        loadWatchlist(),
      ])
      if (loadRequestRef.current !== requestId) return

      setMeta(m)
      setIntraday(intra)
      setHoldings(hold)
      setDaily(dly)

      const watch = (wl || []).find((x) => x.code === code)
      const ind = watch?.industry || 'other'
      setIndustry(ind)
      setFundName(watch?.name || m?.name || code)

      const etfList = etfMap?.[ind] || []
      setEtfs(etfList)

      const holdingSecids = hold?.rows.map((r) => r.secid).filter(Boolean) || []
      const etfSecids = etfList.map((e) => e.secid).filter(Boolean)
      const [nextHoldingQuotes, nextEtfQuotes] = await Promise.all([
        holdingSecids.length ? fetchQuotes(holdingSecids) : Promise.resolve([]),
        etfSecids.length ? fetchQuotes(etfSecids) : Promise.resolve([]),
      ])
      if (loadRequestRef.current !== requestId) return
      setHoldingQuotes(nextHoldingQuotes)
      setEtfQuotes(nextEtfQuotes)

      if (!m && !intra && !hold && !dly) {
        setLoadError('基金数据暂时不可用，请稍后重试')
      }
    } catch (e) {
      if (loadRequestRef.current !== requestId) return
      setLoadError(e instanceof Error ? e.message : String(e))
    } finally {
      if (loadRequestRef.current === requestId) {
        setLoading(false)
      }
    }
  }

  async function refreshIntradayPoint() {
    const gz = await fetchGz(code)
    if (!gz?.gszzl) return
    const cur = intradayRef.current
    if (!cur) return
    const ts = gz.gztime.slice(-5)
    const points: IntradayPoint[] = [...cur.points]
    if (points.length && points[points.length - 1].ts === ts) {
      points[points.length - 1] = { ts, gsz: gz.gsz, gszzl: gz.gszzl }
    } else {
      points.push({ ts, gsz: gz.gsz, gszzl: gz.gszzl })
    }
    setIntraday({ ...cur, points, updated: gz.gztime })
  }

  async function refreshHoldingQuotes() {
    const currentHoldings = holdingsRef.current
    if (!currentHoldings?.rows.length) return
    const secids = currentHoldings.rows.map((r) => r.secid).filter(Boolean)
    if (!secids.length) return
    setHoldingQuotes(await fetchQuotes(secids))
  }

  async function manualRefreshQuotes() {
    setQuoteRefreshing(true)
    try {
      await refreshHoldingQuotes()
      const currentEtfs = etfsRef.current
      if (currentEtfs.length) setEtfQuotes(await fetchQuotes(currentEtfs.map((e) => e.secid)))
    } finally {
      setQuoteRefreshing(false)
    }
  }

  const intradayValues = useMemo(
    () => (intraday?.points || []).map((p) => Number(p.gszzl) || 0),
    [intraday]
  )
  const intradayLast = intraday?.points.at(-1)

  const dailyValues = useMemo(
    () =>
      [...(daily?.rows || [])]
        .reverse()
        .map((r) => Number(r.dwjz))
        .filter(Number.isFinite),
    [daily]
  )
  const dailyReturn = useMemo(() => {
    if (dailyValues.length < 2) return null
    const first = dailyValues[0]
    const last = dailyValues[dailyValues.length - 1]
    if (!first) return null
    return ((last - first) / first) * 100
  }, [dailyValues])

  const holdingsBySecid = useMemo(() => {
    const m = new Map<string, QuoteRow>()
    holdingQuotes.forEach((q) => m.set(q.secid, q))
    return m
  }, [holdingQuotes])
  const etfsBySecid = useMemo(() => {
    const m = new Map<string, QuoteRow>()
    etfQuotes.forEach((q) => m.set(q.secid, q))
    return m
  }, [etfQuotes])

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1>
          <a className={shared.back} href="#">
            ← 返回
          </a>
          <span>{fundName}</span>
        </h1>
        <div className={shared.meta}>
          <span className="muted">{code}</span>
          <a
            href={`https://fund.eastmoney.com/${code}.html`}
            target="_blank"
            rel="noopener noreferrer"
          >
            天天基金
          </a>
        </div>
      </header>

      <main className={shared.main}>
        {loading && <div className={shared.statusBox}>加载基金数据…</div>}
        {loadError && <div className={shared.errorBox}>{loadError}</div>}

        <section className={shared.card}>
          <div className={styles.metaGrid}>
            <div>
              <label>类型</label>
              <span>{meta?.type || '—'}</span>
            </div>
            <div>
              <label>规模</label>
              <span>
                {meta?.scale ? `${meta.scale} 亿` : '—'}
                {meta?.scale_date && <span className="muted small"> ({meta.scale_date})</span>}
              </span>
            </div>
            <div>
              <label>经理</label>
              <span>{meta?.manager || '—'}</span>
            </div>
            <div>
              <label>近 1 年</label>
              <span className={pctClass(meta?.r_1y)}>{meta?.r_1y ? `${meta.r_1y}%` : '—'}</span>
            </div>
          </div>
        </section>

        <section className={shared.card}>
          <div className={shared.cardHead}>
            <h2>日内估值（{intraday?.date || '—'}）</h2>
            {intradayLast && (
              <span className={classNames('muted', pctClass(intradayLast.gszzl))}>
                估值 {intradayLast.gsz} · {pct(intradayLast.gszzl)}
              </span>
            )}
          </div>
          {intradayValues.length >= 2 ? (
            <Sparkline data={intradayValues} zeroLine height={120} />
          ) : (
            <div className={styles.empty}>暂无日内数据</div>
          )}
        </section>

        <section className={shared.card}>
          <div className={shared.cardHead}>
            <h2>
              十大持仓
              {holdings?.report_date && (
                <span className="muted small"> 截止 {holdings.report_date}</span>
              )}
            </h2>
            <button
              type="button"
              className={shared.ghostBtn}
              onClick={manualRefreshQuotes}
              disabled={quoteRefreshing}
            >
              {quoteRefreshing ? '刷新中…' : '刷新行情'}
            </button>
          </div>
          {!holdings?.rows.length ? (
            <div className={styles.empty}>暂无持仓</div>
          ) : (
            <div className={shared.tableScroll}>
              <table className={shared.dataTable}>
                <thead>
                  <tr>
                    <th>代码</th>
                    <th>名称</th>
                    <th className="num">占比</th>
                    <th className="num">现价</th>
                    <th className="num">涨跌</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.rows.map((r) => {
                    const q = holdingsBySecid.get(r.secid)
                    return (
                      <tr key={r.code} className={styles.noHover}>
                        <td>{r.code}</td>
                        <td>{r.name}</td>
                        <td className="num">{r.ratio.toFixed(2)}%</td>
                        <td className="num">{num(q?.price)}</td>
                        <td className={classNames('num', pctClass(q?.chg))}>{pct(q?.chg)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={shared.card}>
          <div className={shared.cardHead}>
            <h2>行业 ETF 对照（{industry}）</h2>
          </div>
          {!etfs.length ? (
            <div className={styles.empty}>未配置</div>
          ) : (
            <div className={shared.tableScroll}>
              <table className={shared.dataTable}>
                <thead>
                  <tr>
                    <th>代码</th>
                    <th>名称</th>
                    <th className="num">现价</th>
                    <th className="num">日涨跌</th>
                  </tr>
                </thead>
                <tbody>
                  {etfs.map((e) => {
                    const q = etfsBySecid.get(e.secid)
                    return (
                      <tr key={e.code} className={styles.noHover}>
                        <td>{e.code}</td>
                        <td>{e.name}</td>
                        <td className="num">{num(q?.price)}</td>
                        <td className={classNames('num', pctClass(q?.chg))}>{pct(q?.chg)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={shared.card}>
          <div className={shared.cardHead}>
            <h2>近 90 天净值</h2>
            {daily?.rows.length && dailyReturn != null && (
              <span className="muted small">
                {daily.rows.length} 个交易日, 累计{' '}
                <span className={pctClass(dailyReturn)}>
                  {dailyReturn >= 0 ? '+' : ''}
                  {dailyReturn.toFixed(2)}%
                </span>
              </span>
            )}
          </div>
          {dailyValues.length >= 2 ? (
            <Sparkline data={dailyValues} height={120} color="#3fb950" />
          ) : (
            <div className={styles.empty}>暂无历史数据</div>
          )}
        </section>
      </main>

      <footer className={shared.footer}>
        数据：天天基金 / 新浪财经。仅供参考，不构成投资建议。
      </footer>
    </div>
  )
}
