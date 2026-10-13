import pytest
from django.db import IntegrityError

from tickets.models import Ticket

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize('fields', [
    {'title': 'x', 'status': 'done'},
    {'title': 'x', 'priority': 'urgent'},
    {'title': '   '},
])
def test_database_rejects_invalid_rows_without_serializer(fields):
    # objects.create() skips the serializer, so only the CHECK constraints stand in the way.
    with pytest.raises(IntegrityError):
        Ticket.objects.create(**fields)
