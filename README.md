# Mini Ticket Tracker

A small ticket tracker: create tickets, filter and page through them, change their status, and see counts per status.
A Django REST API backed by Postgres, with a single-page React frontend.

**Stack:** Python 3.13, Django 6.1.2, Django REST Framework 3.18.3, psycopg 3.3, PostgreSQL 18 (Docker Compose);
React 19.3, TypeScript 6.0, Vite 8.3, Oxlint; pytest 9.1 + pytest-django 4.14.

## Run it

```bash
docker compose up --build          # db (host port 5433) + api on http://localhost:8000
```

The API container runs migrations on start. Backend code is copied into the image, so re-run with `--build` after backend changes.

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173 (proxies /api to :8000)
```

Optional demo data (30 tickets by default, `--count N` for more or fewer):

```bash
docker compose exec api python manage.py seed_tickets
```

## Run the tests

The tests run against the real Postgres, so the db container must be up (`docker compose up -d db`, host port 5433).

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate      # Windows (Git Bash)
source .venv/bin/activate          # macOS / Linux
pip install -r requirements-dev.txt
python -m pytest
```

## API

All routes live under `/api` and have no trailing slash. Validation errors are `{"field": ["message"]}`; other errors are `{"detail": "message"}`.

| Method & path | Params / body | Success | Errors |
|---|---|---|---|
| `POST /api/tickets` | Body: `title` (required, max 200), `description`, `priority` (`low`/`medium`/`high`, default `medium`) | 201, full ticket | 400 blank/missing title, bad priority, any other field |
| `GET /api/tickets` | Query: `status` (`open`/`in_progress`/`closed`, omit for all), `page` (default 1), `limit` (default 20, max 100) | 200, `{results, page, limit, total, total_pages}`, newest first | 400 invalid status, page or limit |
| `PATCH /api/tickets/{id}` | Body: `status` and/or `priority` | 200, full ticket | 400 empty body, bad value, any other field; 404 unknown id |
| `GET /api/tickets/stats` | None | 200, `{open, in_progress, closed, total}`, zero counts included | None |

## Assumptions

- New tickets are always created `open`; `status` can only be changed with PATCH.
- Any status transition is allowed (e.g. `closed` back to `open`).
- Unknown or non-writable fields are rejected with a 400 that names them, never silently dropped.
- An invalid or empty `?status=` gives 400, as does `limit` above 100 (rejected, not clamped).
- A page past the end gives 200 with empty `results`.
- URLs that match no route (e.g. `/api/tickets/abc`) return Django's default HTML 404, not JSON.

## Decisions & Tradeoffs

Postgres is the source of truth for data integrity: CHECK constraints enforce the status and priority values and a non-blank title, so even writes that bypass the serializer cannot store invalid rows. The list uses explicit offset pagination with a deterministic `-created_at, -id` order so pages never skip or repeat rows; with more time I would move to keyset (cursor) pagination, which stays fast on deep pages and is stable while new tickets arrive. PATCH saves only the fields it changed, so concurrent edits to different fields don't overwrite each other, but two edits to the same field are last-write-wins; optimistic locking against an `updated_at` column would turn that into a 409. In development the Vite dev server proxies `/api` to Django, so the browser only ever talks to one origin and no CORS setup is needed. The main shortcuts are running Django's `runserver` inside Docker instead of a production server such as gunicorn, having no authentication, and hand-writing the TypeScript types in `frontend/src/api.ts`, which I would generate from an OpenAPI schema with more time. Also left for later: `updated_at`, assignees and soft delete.
