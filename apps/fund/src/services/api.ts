/**
 * fund-tracker 数据访问层
 *
 * - 跨域 JSONP：fundgz / fundsuggest（直接请求第三方）
 * - 同域 fetch：/api/quote、/data/*.json（由 nginx 反代到 fund-tracker docker 容器）
 */
import type {
  DailyData,
  FundMeta,
  GlobalMeta,
  GzData,
  HoldingsData,
  IndustryEtfsMap,
  IntradayData,
  QuoteRow,
  SearchHit,
  WatchFund,
} from '@/types'

const REPO_OWNER = 'YBoomer'
const REPO_NAME = 'fund-tracker'

interface JsonpgzWindow extends Window {
  jsonpgz?: (data: GzData) => void
  [callback: string]: unknown
}

declare const window: JsonpgzWindow

function loadScript(src: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve(s)
    s.onerror = () => reject(new Error('jsonp load failed: ' + src))
    document.head.appendChild(s)
  })
}

/** 上游 fundgz 用固定函数名 jsonpgz()，需要临时 hook */
export function fetchGz(code: string): Promise<GzData | null> {
  return new Promise((resolve) => {
    const url = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`
    const orig = window.jsonpgz
    let settled = false
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true
        window.jsonpgz = orig
        resolve(null)
      }
    }, 8000)
    window.jsonpgz = (data: GzData) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      window.jsonpgz = orig
      resolve(data)
    }
    loadScript(url).then(
      (s) => s.remove(),
      () => {
        if (!settled) {
          settled = true
          window.clearTimeout(timer)
          window.jsonpgz = orig
          resolve(null)
        }
      }
    )
  })
}

interface FundSuggestRaw {
  Datas?: Array<{
    CODE: string
    NAME: string
    FundBaseInfo?: { SHORTNAME?: string; FTYPE?: string }
  }>
}

export function searchFunds(key: string): Promise<SearchHit[]> {
  return new Promise((resolve) => {
    const cb = `cb_${Math.random().toString(36).slice(2, 9)}`
    const url =
      `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx` +
      `?callback=${cb}&m=1&key=${encodeURIComponent(key)}&_=${Date.now()}`
    let settled = false
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true
        delete window[cb]
        resolve([])
      }
    }, 8000)
    window[cb] = (raw: unknown) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      delete window[cb]
      const r = raw as FundSuggestRaw
      const list: SearchHit[] = (r?.Datas || []).map((x) => ({
        code: x.CODE,
        name: x.FundBaseInfo?.SHORTNAME || x.NAME,
        type: x.FundBaseInfo?.FTYPE || '',
      }))
      resolve(list)
    }
    loadScript(url).catch(() => {
      if (!settled) {
        settled = true
        window.clearTimeout(timer)
        delete window[cb]
        resolve([])
      }
    })
  })
}

async function loadJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`/data/${path}`, { cache: 'no-cache' })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export const loadWatchlist = (): Promise<WatchFund[] | null> =>
  loadJson<WatchFund[]>('watchlist.json')

export const loadIndustryEtfs = (): Promise<IndustryEtfsMap | null> =>
  loadJson<IndustryEtfsMap>('industry_etfs.json')

export const loadGlobalMeta = (): Promise<GlobalMeta | null> => loadJson<GlobalMeta>('meta.json')

export const loadFundsIndex = async (): Promise<
  Array<{ code: string; name: string; type: string; jp: string }>
> => (await loadJson('funds-index.json')) || []

export const loadMeta = (code: string): Promise<FundMeta | null> =>
  loadJson<FundMeta>(`${code}/meta.json`)

export const loadIntraday = (code: string): Promise<IntradayData | null> =>
  loadJson<IntradayData>(`${code}/intraday.json`)

export const loadHoldings = (code: string): Promise<HoldingsData | null> =>
  loadJson<HoldingsData>(`${code}/holdings.json`)

export const loadDaily = (code: string): Promise<DailyData | null> =>
  loadJson<DailyData>(`${code}/daily.json`)

export async function fetchQuotes(secids: string[]): Promise<QuoteRow[]> {
  if (!secids.length) return []
  try {
    const res = await fetch(`/api/quote?secids=${secids.join(',')}`, { cache: 'no-cache' })
    if (!res.ok) return []
    return (await res.json()) as QuoteRow[]
  } catch {
    return []
  }
}

export function repoIssueUrl(code: string, name: string): string {
  const params = new URLSearchParams({
    template: 'track-fund.yml',
    title: `track: ${code}`,
    code,
    name,
  })
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new?${params}`
}
