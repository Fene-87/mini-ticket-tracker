import { useEffect, useState } from 'react'
import CreateForm from './CreateForm'
import { errorMessage, getStats, listTickets, type Stats, type Status, type TicketPage } from './api'
import Pager from './Pager'
import StatusTabs from './StatusTabs'
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
  const [version, setVersion] = useState(0) // bumped after a create or status change to refetch list + stats
  const [createOpen, setCreateOpen] = useState(false)
  const [createdNotice, setCreatedNotice] = useState(0) // bumped per create; 0 hides "Ticket created"

  const requestKey = `${statusFilter}|${page}|${version}`
  const loading = settled?.key !== requestKey
  const listError = loading ? null : settled.error

  useEffect(() => {
    // If the filter or page changes before this request finishes, cleanup marks it stale
    // so a slow old response can't overwrite the newer one.
    let ignore = false
    listTickets({ status: statusFilter || undefined, page })
      .then((data) => {
        if (ignore) return
        // A status change under a filter can empty the last page; step back to the new last page.
        if (data.results.length === 0 && page > 1) {
          setPage(Math.max(1, data.total_pages))
          return
        }
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
      .then((data) => {
        if (ignore) return
        setStats(data)
        setStatsError(null)
      })
      .catch((e: unknown) => !ignore && setStatsError(errorMessage(e)))
    return () => {
      ignore = true
    }
  }, [version])

  useEffect(() => {
    if (createdNotice === 0) return
    // Each create bumps the counter, so cleanup cancels the previous timer and the 5 s restarts.
    const timer = setTimeout(() => setCreatedNotice(0), 5000)
    return () => clearTimeout(timer)
  }, [createdNotice])

  function changeFilter(value: Status | '') {
    setStatusFilter(value)
    setPage(1)
  }

  function refresh() {
    setVersion((v) => v + 1)
  }

  function handleCreated() {
    setCreateOpen(false)
    setCreatedNotice((n) => n + 1)
    setPage(1) // newest first, so the new ticket lands on page 1 (if it matches the filter)
    refresh()
  }

  const first = ticketPage ? (ticketPage.page - 1) * ticketPage.limit + 1 : 0
  const last = ticketPage ? first + ticketPage.results.length - 1 : 0

  return (
    <>
      <header className="appbar">
        <div className="appbar-inner">
          <h1>Mini Ticket Tracker</h1>
          <div className="appbar-actions">
            <span className="notice" role="status">
              {createdNotice > 0 && 'Ticket created'}
            </span>
            <button type="button" className="primary" onClick={() => setCreateOpen((open) => !open)}>
              New ticket
            </button>
          </div>
        </div>
      </header>

      <main className="content">
        {statsError && (
          <p className="banner banner-error" role="alert">
            Counts unavailable: {statsError}
          </p>
        )}
        <section className="panel">
          <StatusTabs stats={stats} active={statusFilter} onChange={changeFilter} />
          {createOpen && <CreateForm onCreated={handleCreated} onCancel={() => setCreateOpen(false)} />}

          {listError ? (
            <p className="banner banner-error" role="alert">
              Could not load tickets: {listError}
            </p>
          ) : !ticketPage ? (
            <p className="empty">Loading tickets…</p>
          ) : (
            <>
              {/* Keep the previous rows on screen while the next page loads, to avoid flicker. */}
              <div className={loading ? 'loading' : undefined} aria-busy={loading}>
                <TicketTable tickets={ticketPage.results} onStatusSaved={refresh} />
              </div>
              <Pager
                page={page}
                totalPages={ticketPage.total_pages}
                first={first}
                last={last}
                total={ticketPage.total}
                disabled={loading}
                onChange={setPage}
              />
            </>
          )}
        </section>
      </main>
    </>
  )
}

export default App
