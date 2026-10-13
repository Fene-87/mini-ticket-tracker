import pytest

pytestmark = pytest.mark.django_db


def test_stats_counts_each_status_including_zero(api_client, make_ticket):
    for status in ['open', 'open', 'in_progress']:
        make_ticket(status=status)

    response = api_client.get('/api/tickets/stats')

    assert response.status_code == 200
    assert response.json() == {'open': 2, 'in_progress': 1, 'closed': 0, 'total': 3}
