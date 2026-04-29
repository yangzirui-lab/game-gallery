/* 跟踪清单表格 */
import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { Trash2 } from 'lucide-react'
import { fetchGz, removeWatchlist } from '@services/api'
import type { GzData, WatchFund } from '@/types'
import { pct, pctClass } from '@/utils/format'
import shared from '@/styles/shared.module.scss'
import styles from './index.module.scss'

interface Props {
  funds: WatchFund[]
  /** 当 watchlist 本身（增/删）变化时触发上层 reload */
  onChange?: () => void
}

interface Row {
  fund: WatchFund
  gz?: GzData | null
}

export default function Watchlist({ funds, onChange }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRows(funds.map((f) => ({ fund: f })))
  }, [funds])

  useEffect(() => {
    void refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funds])

  async function refreshAll() {
    setLoading(true)
    const results = await Promise.all(
      funds.map(async (f) => ({ fund: f, gz: await fetchGz(f.code) }))
    )
    setRows(results)
    setLoading(false)
  }

  function go(code: string) {
    window.location.hash = `#/fund/${code}`
  }

  async function handleRemove(e: React.MouseEvent, code: string, name: string) {
    e.stopPropagation()
    if (!confirm(`移除跟踪：${name} (${code})？`)) return
    try {
      await removeWatchlist(code)
      onChange?.()
    } catch (err) {
      alert('移除失败：' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <section className={shared.card}>
      <div className={shared.cardHead}>
        <h2>跟踪清单</h2>
        <button
          type="button"
          className={shared.ghostBtn}
          onClick={() => void refreshAll()}
          disabled={loading}
        >
          {loading ? '刷新中…' : '手动刷新'}
        </button>
      </div>
      {!funds.length ? (
        <div className={styles.empty}>尚无跟踪基金，使用下方搜索添加</div>
      ) : (
        <table className={shared.dataTable}>
          <thead>
            <tr>
              <th>代码</th>
              <th>简称</th>
              <th className="num">上日净值</th>
              <th className="num">估值</th>
              <th className="num">日涨跌</th>
              <th className="num">更新</th>
              <th className="num"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ fund, gz }) => (
              <tr key={fund.code} onClick={() => go(fund.code)}>
                <td>{fund.code}</td>
                <td>{fund.name}</td>
                <td className="num">{gz?.dwjz || '—'}</td>
                <td className="num">{gz?.gsz || '—'}</td>
                <td className={classNames('num', pctClass(gz?.gszzl))}>{pct(gz?.gszzl)}</td>
                <td className="num muted">{(gz?.gztime || '').slice(-5) || '—'}</td>
                <td className="num">
                  <button
                    type="button"
                    className={styles.removeBtn}
                    title="移除跟踪"
                    onClick={(e) => void handleRemove(e, fund.code, fund.name)}
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
