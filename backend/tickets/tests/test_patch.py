import pytest

from tickets.models import Ticket
from tickets.serializers import TicketUpdateSerializer

pytestmark = pytest.mark.django_db


def test_patch_status_persists(api_client, make_ticket):
    ticket = make_ticket()

    response = api_client.patch(f'/api/tickets/{ticket.id}', {'status': 'closed'}, format='json')

    assert response.status_code == 200
    assert response.json()['status'] == 'closed'
    ticket.refresh_from_db()
    assert ticket.status == 'closed'


@pytest.mark.parametrize('payload, field', [
    ({'status': 'closed', 'assignee': 'bob'}, 'assignee'),
    ({'title': 'renamed'}, 'title'),  # read-only on patch
    ({}, 'non_field_errors'),
])
def test_patch_rejects_invalid_payload(api_client, make_ticket, payload, field):
    ticket = make_ticket()

    response = api_client.patch(f'/api/tickets/{ticket.id}', payload, format='json')

    assert response.status_code == 400
    assert field in response.json()
    ticket.refresh_from_db()
    assert (ticket.title, ticket.status) == ('A ticket', 'open')


def test_patch_missing_ticket_is_404(api_client, db):
    response = api_client.patch('/api/tickets/999999', {'status': 'closed'}, format='json')

    assert response.status_code == 404
    assert not Ticket.objects.exists()


def test_patch_does_not_overwrite_fields_it_did_not_change(make_ticket):
    ticket = make_ticket(priority='low')
    stale = Ticket.objects.get(pk=ticket.pk)
    # A concurrent request changes priority after this one loaded the row.
    Ticket.objects.filter(pk=ticket.pk).update(priority='high')

    serializer = TicketUpdateSerializer(stale, data={'status': 'closed'}, partial=True)
    assert serializer.is_valid(), serializer.errors
    serializer.save()

    ticket.refresh_from_db()
    assert (ticket.status, ticket.priority) == ('closed', 'high')
