import { useState } from 'react'

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Qidirish..."
        className="flex-1 px-4 py-2 bg-white text-gray-800 rounded-full focus:outline-none"
      />
      <button
        type="submit"
        className="bg-white text-teal-600 px-4 py-2 rounded-full font-bold hover:bg-gray-100 transition-all"
      >
        🔍
      </button>
    </form>
  )
}