import { useState, useMemo, useEffect } from 'react'
import { GameItem } from './components/GameItem'
import { SearchBar } from './components/SearchBar'
import { SteamSearch } from './components/SteamSearch'
import { Settings } from './components/Settings'
import type { Game } from './types'
import { AnimatePresence, motion } from 'framer-motion'
import { SettingsIcon, Loader2, Trash2 } from 'lucide-react'
import { githubService } from './services/github'

function App() {
  const [games, setGames] = useState<Game[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSteamSearch, setShowSteamSearch] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Fetch games on mount
  useEffect(() => {
    const loadGames = async () => {
      if (!githubService.isConfigured()) {
        setShowSettings(true)
        return
      }

      setIsLoading(true)
      try {
        const data = await githubService.fetchGames()
        setGames(data.games)
      } catch (err) {
        console.error('Failed to fetch games:', err)
        setToast('加载游戏失败。请检查 GitHub 配置。')
        setShowSettings(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadGames()
  }, [])

  // Clear highlight after a few seconds
  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => setHighlightId(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightId])

  // Clear toast after a few seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Group games by status
  const groupedGames = useMemo(() => {
    const filtered = searchTerm
      ? games.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : games

    const playing = filtered.filter(g => g.status === 'playing').sort((a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )
    const pending = filtered.filter(g => g.status === 'pending').sort((a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )
    const completion = filtered.filter(g => g.status === 'completion').sort((a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )

    return { playing, pending, completion }
  }, [games, searchTerm])

  const handleAddGameFromSteam = async (name: string, steamUrl: string, coverImage: string, _tags: string[]) => {
    const existing = games.find(g => g.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      setToast(`"${name}" 已经在队列中！`)
      setHighlightId(existing.id)
      return
    }

    const newGame: Game = {
      id: Date.now().toString(),
      name,
      status: 'pending',
      addedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      steamUrl,
      coverImage
    }

    try {
      const updatedGames = [newGame, ...games]
      setGames(updatedGames)

      await githubService.updateGames(
        { games: updatedGames },
        `Add game via web: ${name} (${steamUrl.split('/').pop()})`
      )

      setToast(`从 Steam 添加了 "${name}"`)
      setHighlightId(newGame.id)
    } catch (err) {
      console.error('Failed to add game:', err)
      setToast('添加游戏失败')
      setGames(games) // 回滚
    }
  }

  const handleUpdateGame = async (id: string, updates: Partial<Game>) => {
    const game = games.find(g => g.id === id)
    if (!game) return

    const updatedGame: Game = {
      ...game,
      ...updates,
      lastUpdated: new Date().toISOString()
    }

    try {
      const updatedGames = games.map(g => g.id === id ? updatedGame : g)
      setGames(updatedGames)

      await githubService.updateGames(
        { games: updatedGames },
        `Update game via web: ${game.name}`
      )
    } catch (err) {
      console.error('Failed to update game:', err)
      setToast('更新游戏失败')
      setGames(games) // 回滚
    }
  }

  const handleDeleteGame = async (id: string) => {
    const game = games.find(g => g.id === id)
    if (!game) return

    if (window.confirm(`确定要删除 "${game.name}"?`)) {
      try {
        const updatedGames = games.filter(g => g.id !== id)
        setGames(updatedGames)

        await githubService.updateGames(
          { games: updatedGames },
          `Remove game via web: ${game.name}`
        )

        setToast(`移除了 "${game.name}"`)
      } catch (err) {
        console.error('Failed to delete game:', err)
        setToast('删除游戏失败')
        setGames(games) // 回滚
      }
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term) {
      const match = games.find(g => g.name.toLowerCase().includes(term.toLowerCase()))
      if (match) {
        setHighlightId(match.id)
      }
    }
  }

  const handleSettingsClose = () => {
    setShowSettings(false)
    // 重新加载游戏数据（如果配置已更新）
    if (githubService.isConfigured()) {
      githubService.fetchGames()
        .then(data => setGames(data.games))
        .catch(err => console.error('Failed to reload games:', err))
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Game Queue</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <SearchBar value={searchTerm} onSearch={handleSearch} />
          <button
            onClick={() => setShowSteamSearch(true)}
            style={{
              padding: '0.5rem 1rem',
              background: '#1b8dd4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            从 Steam 添加
          </button>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: '0.5rem 1rem',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.9rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <SettingsIcon size={18} />
            设置
          </button>
        </div>
      </header>

      <main>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} />
            <div style={{ marginTop: '1rem' }}>加载中...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Playing Section */}
            {groupedGames.playing.length > 0 && (
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: 'var(--status-playing)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🎮 Playing ({groupedGames.playing.length})
                </h2>
                <div className="game-list">
                  <AnimatePresence>
                    {groupedGames.playing.map(game => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}
                      >
                        <GameItem
                          game={game}
                          onUpdate={handleUpdateGame}
                          isHighlighted={highlightId === game.id}
                        />
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--card-border)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '0 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                            e.currentTarget.style.color = 'var(--status-dropped)';
                            e.currentTarget.style.borderColor = 'var(--status-dropped)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--card-border)';
                          }}
                          title="删除游戏"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Pending Section */}
            {groupedGames.pending.length > 0 && (
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: 'var(--status-backlog)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📋 Pending ({groupedGames.pending.length})
                </h2>
                <div className="game-list">
                  <AnimatePresence>
                    {groupedGames.pending.map(game => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}
                      >
                        <GameItem
                          game={game}
                          onUpdate={handleUpdateGame}
                          isHighlighted={highlightId === game.id}
                        />
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--card-border)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '0 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                            e.currentTarget.style.color = 'var(--status-dropped)';
                            e.currentTarget.style.borderColor = 'var(--status-dropped)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--card-border)';
                          }}
                          title="删除游戏"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Completion Section */}
            {groupedGames.completion.length > 0 && (
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: 'var(--status-finished)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ✅ Completion ({groupedGames.completion.length})
                </h2>
                <div className="game-list">
                  <AnimatePresence>
                    {groupedGames.completion.map(game => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}
                      >
                        <GameItem
                          game={game}
                          onUpdate={handleUpdateGame}
                          isHighlighted={highlightId === game.id}
                        />
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--card-border)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '0 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                            e.currentTarget.style.color = 'var(--status-dropped)';
                            e.currentTarget.style.borderColor = 'var(--status-dropped)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--card-border)';
                          }}
                          title="删除游戏"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {games.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                没有找到游戏。请添加一些！
              </div>
            )}
          </div>
        )}
      </main>

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}

      {showSteamSearch && (
        <SteamSearch
          onAddGame={handleAddGameFromSteam}
          onClose={() => setShowSteamSearch(false)}
        />
      )}

      {showSettings && (
        <Settings
          onClose={handleSettingsClose}
        />
      )}
    </div>
  )
}

export default App
