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
  const intradayRef = useRef<IntradayData | null>(null)

  useEffect(() => {
    intradayRef.current = intraday
  }, [intraday])

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
    const [m, intra, hold, dly, etfMap, wl] = await Promise.all([
      loadMeta(code),
      loadIntraday(code),
      loadHoldings(code),
      loadDaily(code),
      loadIndustryEtfs(),
      loadWatchlist(),
    ])
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

    if (hold?.rows.length) {
      const secids = hold.rows.map((r) => r.secid).filter(Boolean)
      if (secids.length) {
        setHoldingQuotes(await fetchQuotes(secids))
      }
    }
    if (etfList.length) {
      setEtfQuotes(await fetchQuotes(etfList.map((e) => e.secid)))
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
    if (!holdings?.rows.length) return
    const secids = holdings.rows.map((r) => r.secid).filter(Boolean)
    if (!secids.length) return
    setHoldingQuotes(await fetchQuotes(secids))
  }

  async function manualRefreshQuotes() {
    await refreshHoldingQuotes()
    if (etfs.length) setEtfQuotes(await fetchQuotes(etfs.map((e) => e.secid)))
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
            <button type="button" className={shared.ghostBtn} onClick={manualRefreshQuotes}>
              刷新行情
            </button>
          </div>
          {!holdings?.rows.length ? (
            <div className={styles.empty}>暂无持仓</div>
          ) : (
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
          )}
        </section>

        <section className={shared.card}>
          <div className={shared.cardHead}>
            <h2>行业 ETF 对照（{industry}）</h2>
          </div>
          {!etfs.length ? (
            <div className={styles.empty}>未配置</div>
          ) : (
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
