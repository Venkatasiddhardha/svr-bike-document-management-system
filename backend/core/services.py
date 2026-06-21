from django.contrib.contenttypes.models import ContentType

from .models import ActivityLog


def client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    return forwarded.split(",")[0].strip() if forwarded else request.META.get("REMOTE_ADDR")


def log_activity(request, action, instance=None, description=""):
    entity_type = ""
    entity_id = ""
    if instance is not None:
        entity_type = ContentType.objects.get_for_model(instance).model
        entity_id = str(instance.pk)
    ActivityLog.objects.create(
        user=request.user if request.user.is_authenticated else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        ip_address=client_ip(request),
    )
