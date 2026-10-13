import { useEffect, useState } from 'react'
import { getStats, type Stats } from './api'

// Placeholder that proves the API client works end to end; the real UI replaces it.
function App() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  return (
    <main>
      <h1>Mini Ticket Tracker</h1>
      {error && <p role="alert">Error: {error}</p>}
      {!error && !stats && <p>Loading…</p>}
      {stats && <pre>{JSON.stringify(stats, null, 2)}</pre>}
    </main>
  )
}

export default App
