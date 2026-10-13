from collections.abc import Mapping

from rest_framework import serializers

from .models import Ticket


class RejectNonWritableFieldsMixin:
    """
    Reject request keys that aren't writable fields on this serializer.

    DRF silently drops unknown and read-only keys by default; we return a 400 naming them
    instead, so a client typo or a forbidden field never looks like a successful write.
    """

    def to_internal_value(self, data):
        if isinstance(data, Mapping):  # non-dict bodies fall through to DRF's own error
            writable = [name for name, field in self.fields.items() if not field.read_only]
            rejected = [key for key in data if key not in writable]
            if rejected:
                message = f'Not a writable field. Allowed: {", ".join(writable)}.'
                raise serializers.ValidationError({key: [message] for key in rejected})
        return super().to_internal_value(data)


class TicketSerializer(RejectNonWritableFieldsMixin, serializers.ModelSerializer):
    """Create: only title, description and priority are accepted; new tickets always start open."""

    class Meta:
        model = Ticket
        fields = ['id', 'title', 'description', 'status', 'priority', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']


class TicketUpdateSerializer(TicketSerializer):
    """Patch: only status and priority are writable. Any status-to-status transition is allowed."""

    class Meta(TicketSerializer.Meta):
        read_only_fields = ['id', 'title', 'description', 'created_at']

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('Provide at least one of: status, priority.')
        return attrs

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        # Write only the changed columns, so concurrent PATCHes to different fields
        # (one sets priority, another sets status) don't overwrite each other.
        instance.save(update_fields=list(validated_data))
        return instance
