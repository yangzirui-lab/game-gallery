import React, { useState } from "react";
import { Plus } from "lucide-react";

interface AddGameProps {
  onAdd: (name: string) => void;
}

export const AddGame: React.FC<AddGameProps> = ({ onAdd }) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
    }
  };

  return (
    <div className="add-game-container">
      <form className="add-game-form" onSubmit={handleSubmit}>
        <input 
          type="text" 
          className="input-primary"
          placeholder="Enter game name to add..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn-add">
          <Plus size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Add Game
        </button>
      </form>
    </div>
  );
};
