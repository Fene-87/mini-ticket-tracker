import { useState, type SubmitEvent } from 'react'
import { ApiError, createTicket, errorMessage, PRIORITY_LABELS, type FieldErrors, type Priority } from './api'

const FORM_FIELDS = ['title', 'description', 'priority']

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [created, setCreated] = useState(false)

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setFieldErrors({})
    setBanner(null)
    setCreated(false)
    try {
      await createTicket({ title, description, priority })
      setTitle('')
      setDescription('')
      setPriority('medium')
      setCreated(true)
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
    <form className="create" onSubmit={submit}>
      <h2>New ticket</h2>
      {banner && (
        <p className="error" role="alert">
          {banner}
        </p>
      )}
      {/* A disabled fieldset disables every control in it, so the form can't be double-submitted. */}
      <fieldset disabled={submitting}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <FieldError messages={fieldErrors.title} />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          <FieldError messages={fieldErrors.description} />
        </label>
        <label>
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
        <div>
          <button type="submit">{submitting ? 'Creating…' : 'Create ticket'}</button>
          {created && <span className="success">Ticket created</span>}
        </div>
      </fieldset>
    </form>
  )
}

function FieldError({ messages }: { messages?: string[] }) {
  return messages ? <span className="error">{messages.join(' ')}</span> : null
}

export default CreateForm
