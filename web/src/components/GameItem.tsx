import React, { useRef, useEffect } from "react";
import type { Game, GameStatus } from "../types";
import { Clock, Calendar, CheckCircle, Play, Bookmark, XCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface GameItemProps {
  game: Game;
  onUpdate: (id: string, updates: Partial<Game>) => void;
  onDelete: (id: string) => void;
  isHighlighted: boolean;
}

const statusIcons: Record<GameStatus, React.ReactNode> = {
  playing: <Play size={14} className="text-status-playing" />,
  backlog: <Bookmark size={14} className="text-status-backlog" />,
  finished: <CheckCircle size={14} className="text-status-finished" />,
  dropped: <XCircle size={14} className="text-status-dropped" />,
};

export const GameItem: React.FC<GameItemProps> = ({ game, onUpdate, onDelete, isHighlighted }) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHighlighted && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  const handleNameChange = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value !== game.name) {
      onUpdate(game.id, { name: e.target.value, lastUpdated: new Date().toISOString() });
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(game.id, { 
      status: e.target.value as GameStatus, 
      lastUpdated: new Date().toISOString() 
    });
  };

  return (
    <div 
      ref={itemRef}
      className={`game-card ${game.status === 'playing' ? 'playing' : ''} ${isHighlighted ? 'highlight' : ''}`}
      id={`game-${game.id}`}
    >
      <div className="game-header">
        <input 
          className="game-name"
          defaultValue={game.name}
          onBlur={handleNameChange}
          placeholder="Game Name"
        />
        <div className="game-actions">
          <select 
            className="game-status-select"
            value={game.status}
            onChange={handleStatusChange}
            style={{ color: `var(--status-${game.status})` }}
          >
            <option value="playing">Playing</option>
            <option value="backlog">Backlog</option>
            <option value="finished">Finished</option>
            <option value="dropped">Dropped</option>
          </select>
          <button 
            className="btn-delete"
            onClick={() => onDelete(game.id)}
            title="Delete Game"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="game-meta">
        <div className="meta-item">
          <Calendar size={14} />
          <span>Added: {format(new Date(game.addedAt), 'MMM dd, yyyy')}</span>
        </div>
        <div className="meta-item">
          <Clock size={14} />
          <span>Updated: {format(new Date(game.lastUpdated), 'MMM dd, HH:mm')}</span>
        </div>
        <div className="meta-item" style={{ marginLeft: 'auto' }}>
          {statusIcons[game.status]}
          <span style={{ textTransform: 'capitalize' }}>{game.status}</span>
        </div>
      </div>
    </div>
  );
};
