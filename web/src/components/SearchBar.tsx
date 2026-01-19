import React from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (term: string) => void;
  value: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, value }) => {
  return (
    <div className="search-container">
      <Search className="search-icon" size={18} />
      <input 
        type="text" 
        className="search-input"
        placeholder="Search games..."
        value={value}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
};
