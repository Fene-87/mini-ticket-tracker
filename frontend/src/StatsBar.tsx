import { STATUS_LABELS, type Stats, type Status } from './api'

interface Props {
  stats: Stats | null
  error: string | null
}

function StatsBar({ stats, error }: Props) {
  if (error) return <p className="error" role="alert">Stats unavailable: {error}</p>
  if (!stats) return <p className="muted">Loading stats…</p>

  const statuses = Object.keys(STATUS_LABELS) as Status[]
  return (
    <dl className="stats">
      {statuses.map((status) => (
        <div key={status}>
          <dt>{STATUS_LABELS[status]}</dt>
          <dd>{stats[status]}</dd>
        </div>
      ))}
      <div>
        <dt>Total</dt>
        <dd>{stats.total}</dd>
      </div>
    </dl>
  )
}

export default StatsBar
