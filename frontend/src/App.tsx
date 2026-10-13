import { useEffect, useState } from 'react'
import { errorMessage, getStats, listTickets, STATUS_LABELS, type Stats, type Status, type TicketPage } from './api'
import Pager from './Pager'
import StatsBar from './StatsBar'
import TicketTable from './TicketTable'

function App() {
  const [statusFilter, setStatusFilter] = useState<Status | ''>('') // '' means all
  const [page, setPage] = useState(1)
  const [ticketPage, setTicketPage] = useState<TicketPage | null>(null) // last successful response
  // Which request last finished, and how. Loading is derived from it rather than stored,
  // so the effect never has to set state synchronously.
  const [settled, setSettled] = useState<{ key: string; error: string | null } | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)

  const requestKey = `${statusFilter}|${page}`
  const loading = settled?.key !== requestKey
  const listError = loading ? null : settled.error

  useEffect(() => {
    // If the filter or page changes before this request finishes, cleanup marks it stale
    // so a slow old response can't overwrite the newer one.
    let ignore = false
    listTickets({ status: statusFilter || undefined, page })
      .then((data) => {
        if (ignore) return
        setTicketPage(data)
        setSettled({ key: requestKey, error: null })
      })
      .catch((e: unknown) => !ignore && setSettled({ key: requestKey, error: errorMessage(e) }))
    return () => {
      ignore = true
    }
  }, [requestKey, statusFilter, page])

  useEffect(() => {
    let ignore = false
    getStats()
      .then((data) => !ignore && setStats(data))
      .catch((e: unknown) => !ignore && setStatsError(errorMessage(e)))
    return () => {
      ignore = true
    }
  }, [])

  function changeFilter(value: Status | '') {
    setStatusFilter(value)
    setPage(1)
  }

  return (
    <main>
      <h1>Mini Ticket Tracker</h1>
      <StatsBar stats={stats} error={statsError} />

      <label className="filter">
        Status{' '}
        <select value={statusFilter} onChange={(e) => changeFilter(e.target.value as Status | '')}>
          <option value="">All</option>
          {(Object.keys(STATUS_LABELS) as Status[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      {listError ? (
        <p className="error" role="alert">
          Could not load tickets: {listError}
        </p>
      ) : !ticketPage ? (
        <p className="muted">Loading tickets…</p>
      ) : (
        <>
          {/* Keep the previous rows on screen while the next page loads, to avoid flicker. */}
          <div className={loading ? 'loading' : undefined} aria-busy={loading}>
            <TicketTable tickets={ticketPage.results} />
          </div>
          <Pager
            page={page}
            totalPages={ticketPage.total_pages}
            total={ticketPage.total}
            disabled={loading}
            onChange={setPage}
          />
        </>
      )}
    </main>
  )
}

export default App
