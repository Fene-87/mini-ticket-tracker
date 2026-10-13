from django.db import models
from django.db.models import Q


class Status(models.TextChoices):
    OPEN = 'open', 'Open'
    IN_PROGRESS = 'in_progress', 'In progress'
    CLOSED = 'closed', 'Closed'


class Priority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'


class Ticket(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status, default=Status.OPEN)
    priority = models.CharField(max_length=20, choices=Priority, default=Priority.MEDIUM)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            # Enforced by Postgres too, so writes that bypass the serializer can't store bad data.
            models.CheckConstraint(condition=Q(status__in=Status.values), name='ticket_status_valid'),
            models.CheckConstraint(condition=Q(priority__in=Priority.values), name='ticket_priority_valid'),
            # At least one non-whitespace character, i.e. not blank once trimmed.
            models.CheckConstraint(condition=Q(title__regex=r'\S'), name='ticket_title_not_blank'),
        ]
        indexes = [
            models.Index(fields=['status', '-created_at'], name='ticket_status_created_idx'),
        ]

    def __str__(self):
        return self.title
