import { useState } from 'react'
import '../styles/SearchBar.css'

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Qidirish..."
        className="search-input"
      />
      <button type="submit" className="search-btn">
        🔍
      </button>
    </form>
  )
}
