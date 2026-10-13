import pytest
from rest_framework.test import APIClient

from tickets.models import Ticket


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def make_ticket(db):
    def make(title='A ticket', **fields):
        return Ticket.objects.create(title=title, **fields)
    return make
