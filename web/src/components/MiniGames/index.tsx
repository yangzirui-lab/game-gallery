import React, { useState } from 'react'
import { SnakeGame } from './SnakeGame'
import styles from './index.module.scss'

interface MiniGame {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

const miniGames: MiniGame[] = [
  {
    id: 'snake',
    name: '贪吃蛇',
    description: '经典贪吃蛇游戏，控制蛇吃食物并避免撞墙',
    icon: '🐍',
    color: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
  },
]

export const MiniGames: React.FC = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null)

  const handlePlayGame = (gameId: string) => {
    setActiveGame(gameId)
  }

  const handleCloseGame = () => {
    setActiveGame(null)
  }

  return (
    <>
      <div className={styles.playgroundContainer}>
        <div className={styles.playgroundHeader}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>🎮 游戏广场</h2>
            <p className={styles.subtitle}>休息一下，来玩个小游戏放松一下吧</p>
          </div>
        </div>

        <div className={styles.gamesSection}>
          <div className={styles.gamesGrid}>
            {miniGames.map((game) => (
              <div
                key={game.id}
                className={styles.gameCard}
                onClick={() => handlePlayGame(game.id)}
              >
                <div className={styles.cardInner} style={{ background: game.color }}>
                  <div className={styles.gameIcon}>{game.icon}</div>
                  <h3 className={styles.gameName}>{game.name}</h3>
                  <p className={styles.gameDescription}>{game.description}</p>
                  <div className={styles.playBtn}>
                    <span>开始游戏</span>
                    <span className={styles.playIcon}>▶</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeGame === 'snake' && <SnakeGame onClose={handleCloseGame} />}
    </>
  )
}
