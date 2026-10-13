import pytest

pytestmark = pytest.mark.django_db


def test_create_applies_defaults(api_client):
    response = api_client.post('/api/tickets', {'title': 'Printer on fire'}, format='json')

    assert response.status_code == 201
    body = response.json()
    assert body['title'] == 'Printer on fire'
    assert body['description'] == ''
    assert body['status'] == 'open'
    assert body['priority'] == 'medium'
    assert body['created_at']
    assert isinstance(body['id'], int)


@pytest.mark.parametrize('payload, field', [
    ({'title': ''}, 'title'),
    ({'title': '   '}, 'title'),
    ({'title': 'x', 'priority': 'urgent'}, 'priority'),
    ({'title': 'x', 'status': 'closed'}, 'status'),  # tickets always start open
    ({'title': 'x', 'assignee': 'bob'}, 'assignee'),  # unknown keys are rejected, not dropped
])
def test_create_rejects_invalid_payload(api_client, payload, field):
    response = api_client.post('/api/tickets', payload, format='json')

    assert response.status_code == 400
    assert field in response.json()
