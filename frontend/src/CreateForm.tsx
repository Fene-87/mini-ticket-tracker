import { useState, type SubmitEvent } from 'react'
import { ApiError, createTicket, errorMessage, PRIORITY_LABELS, type FieldErrors, type Priority } from './api'

const FORM_FIELDS = ['title', 'description', 'priority']

interface Props {
  onCreated: () => void // the parent closes (unmounts) the panel, which also resets the fields
  onCancel: () => void
}

function CreateForm({ onCreated, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState<string | null>(null)

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setFieldErrors({})
    setBanner(null)
    try {
      await createTicket({ title, description, priority })
      onCreated()
    } catch (e) {
      const all = e instanceof ApiError ? e.fieldErrors : {}
      const ours = Object.fromEntries(Object.entries(all).filter(([field]) => FORM_FIELDS.includes(field)))
      if (Object.keys(ours).length > 0) setFieldErrors(ours)
      else setBanner(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="create-panel" onSubmit={submit} aria-label="New ticket">
      {banner && (
        <p className="banner banner-error" role="alert">
          {banner}
        </p>
      )}
      {/* A disabled fieldset disables every control in it, so the form can't be double-submitted. */}
      <fieldset disabled={submitting}>
        <div className="create-row">
          <label className="field field-title">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
            <FieldError messages={fieldErrors.title} />
          </label>
          <label className="field field-priority">
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
            <FieldError messages={fieldErrors.priority} />
          </label>
          <div className="create-actions">
            <button type="submit" className="primary">
              {submitting ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
        <label className="field">
          Description
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <FieldError messages={fieldErrors.description} />
        </label>
      </fieldset>
    </form>
  )
}

function FieldError({ messages }: { messages?: string[] }) {
  return messages ? <span className="field-error">{messages.join(' ')}</span> : null
}

export default CreateForm
