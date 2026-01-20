import React from 'react'
import { Search } from 'lucide-react'
import styles from './index.module.scss'

interface SearchBarProps {
  onSearch: (term: string) => void
  value: string
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, value }) => {
  return (
    <div className={styles.searchContainer}>
      <Search className={styles.searchIcon} size={18} />
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Search games..."
        value={value}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  )
}
