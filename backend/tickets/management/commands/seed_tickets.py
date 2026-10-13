from django.core.management.base import BaseCommand, CommandError

from tickets.models import Priority, Status, Ticket


class Command(BaseCommand):
    help = 'Create demo tickets with a mix of statuses and priorities.'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=30, help='Number of tickets to create (default 30).')

    def handle(self, *args, count, **options):
        if count < 1:
            raise CommandError('--count must be at least 1.')

        statuses, priorities = Status.values, Priority.values
        # Status cycles every ticket and priority every third, so all 9 combinations appear.
        # bulk_create skips model validation, but the DB CHECK constraints still apply.
        tickets = Ticket.objects.bulk_create(
            Ticket(
                title=f'Demo ticket {i + 1}',
                description=f'Seeded demo ticket #{i + 1}.',
                status=statuses[i % len(statuses)],
                priority=priorities[(i // len(statuses)) % len(priorities)],
            )
            for i in range(count)
        )
        self.stdout.write(self.style.SUCCESS(f'Created {len(tickets)} tickets.'))
