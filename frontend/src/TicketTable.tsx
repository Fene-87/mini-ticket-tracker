import { useState } from 'react'
import { errorMessage, PRIORITY_LABELS, STATUS_LABELS, updateTicket, type Status, type Ticket } from './api'

interface Props {
  tickets: Ticket[]
  onStatusSaved: () => void
}

function TicketTable({ tickets, onStatusSaved }: Props) {
  if (tickets.length === 0) return <p className="empty">No tickets</p>

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th className="col-id">#</th>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td className="col-id num">{ticket.id}</td>
              <td className="col-title">{ticket.title}</td>
              <td className={`priority-${ticket.priority}`}>{PRIORITY_LABELS[ticket.priority]}</td>
              <td>
                {/* Keyed on the server's status, so the select's local state resets when the refetched row arrives. */}
                <StatusSelect key={`${ticket.id}-${ticket.status}`} ticket={ticket} onSaved={onStatusSaved} />
              </td>
              {/* created_at is UTC from the API; toLocaleString shows it in the viewer's time zone. */}
              <td className="num">{new Date(ticket.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusSelect({ ticket, onSaved }: { ticket: Ticket; onSaved: () => void }) {
  const [pending, setPending] = useState<Status | null>(null) // chosen status until the refetch confirms it
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function change(status: Status) {
    setPending(status)
    setSaving(true)
    setError(null)
    try {
      await updateTicket(ticket.id, { status })
      onSaved()
    } catch (e) {
      setPending(null) // the change didn't save, so show the server's value again
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <select
        aria-label={`Status of ${ticket.title}`}
        className={`status-select status-${pending ?? ticket.status}`}
        value={pending ?? ticket.status}
        disabled={saving}
        onChange={(e) => change(e.target.value as Status)}
      >
        {(Object.keys(STATUS_LABELS) as Status[]).map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      {error && <span className="inline-error">{error}</span>}
    </>
  )
}

export default TicketTable
