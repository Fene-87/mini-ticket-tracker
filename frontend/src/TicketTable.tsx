import { PRIORITY_LABELS, STATUS_LABELS, type Ticket } from './api'

function TicketTable({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) return <p className="muted">No tickets</p>

  return (
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((ticket) => (
          <tr key={ticket.id}>
            <td>{ticket.title}</td>
            <td>{STATUS_LABELS[ticket.status]}</td>
            <td>{PRIORITY_LABELS[ticket.priority]}</td>
            {/* created_at is UTC from the API; toLocaleString shows it in the viewer's time zone. */}
            <td>{new Date(ticket.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TicketTable
