interface Props {
  page: number
  totalPages: number // 0 when nothing matches
  first: number // 1-based index of the first row shown
  last: number
  total: number
  disabled: boolean
  onChange: (page: number) => void
}

function Pager({ page, totalPages, first, last, total, disabled, onChange }: Props) {
  return (
    <div className="pager">
      <span className="num">{total === 0 ? '0 of 0' : `${first}–${last} of ${total}`}</span>
      <div className="pager-buttons">
        <button type="button" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
          Prev
        </button>
        <button type="button" disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}

export default Pager
