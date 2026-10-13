// Typed wrappers around the ticket API. Paths have no trailing slash, matching the backend routes;
// in dev, Vite proxies /api to Django, so the browser only talks to one origin.

export type Status = 'open' | 'in_progress' | 'closed'
export type Priority = 'low' | 'medium' | 'high'

export interface Ticket {
  id: number
  title: string
  description: string
  status: Status
  priority: Priority
  created_at: string
}

export interface TicketPage {
  results: Ticket[]
  page: number
  limit: number
  total: number
  total_pages: number
}

export type Stats = Record<Status, number> & { total: number }

export interface NewTicket {
  title: string
  description?: string
  priority?: Priority
}

export type TicketUpdate = Partial<Pick<Ticket, 'status' | 'priority'>>

export interface ListParams {
  status?: Status // omitted means all statuses
  page?: number
  limit?: number
}

/** Validation errors keyed by field (or `non_field_errors`), as DRF returns them. */
export type FieldErrors = Record<string, string[]>

/** A non-2xx response. `fieldErrors` is filled for `{field: [msgs]}` bodies, empty for `{detail}`. */
export class ApiError extends Error {
  status: number
  fieldErrors: FieldErrors

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

function toApiError(status: number, body: unknown): ApiError {
  if (body && typeof body === 'object') {
    if ('detail' in body && typeof body.detail === 'string') {
      return new ApiError(status, body.detail)
    }
    const fieldErrors = body as FieldErrors
    const message = Object.entries(fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(' ')}`)
      .join('; ')
    return new ApiError(status, message, fieldErrors)
  }
  // Non-JSON body, e.g. Django's HTML 404 for an unmatched URL.
  return new ApiError(status, `Request failed (${status})`)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init)
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw toApiError(response.status, body)
  }
  return body as T
}

function sendJson(method: 'POST' | 'PATCH', data: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
}

export function listTickets({ status, page, limit }: ListParams = {}): Promise<TicketPage> {
  const query = new URLSearchParams()
  if (status) query.set('status', status)
  if (page !== undefined) query.set('page', String(page))
  if (limit !== undefined) query.set('limit', String(limit))
  const qs = query.toString()
  return request(`/tickets${qs ? `?${qs}` : ''}`)
}

export function createTicket(ticket: NewTicket): Promise<Ticket> {
  return request('/tickets', sendJson('POST', ticket))
}

export function updateTicket(id: number, changes: TicketUpdate): Promise<Ticket> {
  return request(`/tickets/${id}`, sendJson('PATCH', changes))
}

export function getStats(): Promise<Stats> {
  return request('/tickets/stats')
}
