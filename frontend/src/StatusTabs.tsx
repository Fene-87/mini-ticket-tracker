import { STATUS_LABELS, type Stats, type Status } from './api'

const TABS: { value: Status | ''; label: string }[] = [
  { value: '', label: 'All' },
  ...(Object.keys(STATUS_LABELS) as Status[]).map((status) => ({ value: status, label: STATUS_LABELS[status] })),
]

interface Props {
  stats: Stats | null // null while loading or if /stats failed; tabs still work, just without counts
  active: Status | ''
  onChange: (value: Status | '') => void
}

function StatusTabs({ stats, active, onChange }: Props) {
  return (
    <nav className="tabs" aria-label="Filter by status">
      {TABS.map(({ value, label }) => {
        const count = stats && (value ? stats[value] : stats.total)
        return (
          <button
            key={label}
            type="button"
            className={value === active ? 'tab tab-active' : 'tab'}
            aria-pressed={value === active}
            onClick={() => onChange(value)}
          >
            {label}
            {count !== null && <span className="tab-count">{count}</span>}
          </button>
        )
      })}
    </nav>
  )
}

export default StatusTabs
