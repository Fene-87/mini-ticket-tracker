from datetime import datetime, timezone

import pytest

from tickets.models import Ticket

pytestmark = pytest.mark.django_db


def test_list_filters_by_status(api_client, make_ticket):
    make_ticket(status='open')
    closed = make_ticket(status='closed')

    response = api_client.get('/api/tickets', {'status': 'closed'})

    assert response.status_code == 200
    assert [t['id'] for t in response.json()['results']] == [closed.id]


def test_list_returns_pagination_envelope(api_client, make_ticket):
    for _ in range(3):
        make_ticket()

    response = api_client.get('/api/tickets', {'page': 2, 'limit': 2})

    body = response.json()
    assert len(body['results']) == 1
    assert {k: body[k] for k in ('page', 'limit', 'total', 'total_pages')} == {
        'page': 2, 'limit': 2, 'total': 3, 'total_pages': 2,
    }


def test_list_order_is_stable_across_pages(api_client, make_ticket):
    ids = [make_ticket(title=f't{i}').id for i in range(5)]
    # Identical timestamps force the -id tiebreaker to decide the order.
    Ticket.objects.update(created_at=datetime(2026, 1, 1, tzinfo=timezone.utc))

    pages = [api_client.get('/api/tickets', {'page': p, 'limit': 2}).json()['results'] for p in (1, 2, 3)]

    assert [t['id'] for page in pages for t in page] == sorted(ids, reverse=True)


def test_list_page_past_end_is_empty(api_client, make_ticket):
    make_ticket()

    response = api_client.get('/api/tickets', {'page': 5})

    assert response.status_code == 200
    assert response.json()['results'] == []


@pytest.mark.parametrize('params, field', [
    ({'status': 'nope'}, 'status'),
    ({'page': '0'}, 'page'),
    ({'limit': 'abc'}, 'limit'),
    ({'limit': '101'}, 'limit'),
])
def test_list_rejects_invalid_params(api_client, params, field):
    response = api_client.get('/api/tickets', params)

    assert response.status_code == 400
    assert field in response.json()
