/* 极简 SVG sparkline，无第三方依赖 */
import { useMemo } from 'react'
import styles from './index.module.scss'

interface Props {
  data: number[]
  width?: number
  height?: number
  color?: string
  /** 是否在 y=0 画一条参考线（涨跌幅模式时建议开启） */
  zeroLine?: boolean
  showArea?: boolean
}

export default function Sparkline({
  data,
  width = 800,
  height = 120,
  color = '#58a6ff',
  zeroLine = false,
  showArea = true,
}: Props) {
  const path = useMemo(() => {
    if (data.length < 2) return { line: '', area: '', zeroY: 0, min: 0, max: 0 }
    let min = Math.min(...data)
    let max = Math.max(...data)
    if (zeroLine) {
      min = Math.min(min, 0)
      max = Math.max(max, 0)
    }
    if (min === max) {
      min -= 1
      max += 1
    }
    const padY = 4
    const dx = (width - 8) / (data.length - 1)
    const scaleY = (v: number) => height - padY - ((v - min) / (max - min)) * (height - padY * 2)

    let line = ''
    data.forEach((v, i) => {
      const x = 4 + i * dx
      const y = scaleY(v)
      line += i === 0 ? `M${x},${y}` : `L${x},${y}`
    })
    const area = showArea ? `${line} L${4 + (data.length - 1) * dx},${height} L4,${height} Z` : ''
    const zeroY = zeroLine ? scaleY(0) : 0
    return { line, area, zeroY, min, max }
  }, [data, width, height, zeroLine, showArea])

  if (data.length < 2) {
    return <div className={styles.empty}>暂无数据</div>
  }

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="走势图"
    >
      {showArea && <path d={path.area} fill={color} fillOpacity={0.1} />}
      {zeroLine && (
        <line
          x1="0"
          x2={width}
          y1={path.zeroY}
          y2={path.zeroY}
          stroke="var(--line)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}
      <path d={path.line} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  )
}
