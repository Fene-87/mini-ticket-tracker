interface Props {
  page: number
  totalPages: number // 0 when nothing matches
  total: number
  disabled: boolean
  onChange: (page: number) => void
}

function Pager({ page, totalPages, total, disabled, onChange }: Props) {
  return (
    <nav className="pager">
      <button type="button" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
        Prev
      </button>
      <span>
        Page {page} of {Math.max(totalPages, 1)} · {total} tickets
      </span>
      <button type="button" disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  )
}

export default Pager
