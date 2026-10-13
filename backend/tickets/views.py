import math

from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Status, Ticket
from .serializers import TicketSerializer, TicketUpdateSerializer

DEFAULT_LIMIT = 20
MAX_LIMIT = 100


def parse_positive_int(params, name, default, maximum=None):
    """Read an optional query param as an int >= 1 (and <= maximum). Returns (value, error)."""
    raw = params.get(name)
    if raw is None:
        return default, None
    try:
        value = int(raw)
    except ValueError:
        return None, 'Must be an integer.'
    if value < 1:
        return None, 'Must be at least 1.'
    if maximum is not None and value > maximum:
        return None, f'Must be at most {maximum}.'
    return value, None


class TicketListCreateView(APIView):
    def get(self, request):
        params = request.query_params
        errors = {}

        status_filter = params.get('status')
        if status_filter is not None and status_filter not in Status.values:
            errors['status'] = [f'Must be one of: {", ".join(Status.values)}.']
        page, page_error = parse_positive_int(params, 'page', default=1)
        if page_error:
            errors['page'] = [page_error]
        limit, limit_error = parse_positive_int(params, 'limit', default=DEFAULT_LIMIT, maximum=MAX_LIMIT)
        if limit_error:
            errors['limit'] = [limit_error]
        if errors:
            raise ValidationError(errors)

        tickets = Ticket.objects.all()
        if status_filter is not None:
            tickets = tickets.filter(status=status_filter)
        # id breaks ties between equal timestamps so pages never skip or repeat rows.
        tickets = tickets.order_by('-created_at', '-id')

        total = tickets.count()
        offset = (page - 1) * limit
        return Response({
            'results': TicketSerializer(tickets[offset:offset + limit], many=True).data,
            'page': page,
            'limit': limit,
            'total': total,
            'total_pages': math.ceil(total / limit),
        })

    def post(self, request):
        serializer = TicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TicketDetailView(APIView):
    def patch(self, request, pk):
        ticket = get_object_or_404(Ticket, pk=pk)
        serializer = TicketUpdateSerializer(ticket, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TicketStatsView(APIView):
    def get(self, request):
        # One GROUP BY query; statuses with no tickets are missing from it, so fill them with 0.
        rows = Ticket.objects.values('status').annotate(count=Count('id'))
        counts = {row['status']: row['count'] for row in rows}
        stats = {value: counts.get(value, 0) for value in Status.values}
        # The CHECK constraint rules out other statuses, so the buckets add up to the total.
        stats['total'] = sum(stats.values())
        return Response(stats)
