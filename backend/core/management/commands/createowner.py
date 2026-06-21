import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create or update the single SVR owner account from environment variables."

    def handle(self, *args, **options):
        username = os.getenv("SVR_OWNER_USERNAME", "owner")
        password = os.getenv("SVR_OWNER_PASSWORD")
        email = os.getenv("SVR_OWNER_EMAIL", "")
        if not password:
            raise CommandError("Set SVR_OWNER_PASSWORD before running createowner.")
        User = get_user_model()
        other_owners = User.objects.filter(is_superuser=True).exclude(username=username)
        if other_owners.exists():
            raise CommandError("Another owner account already exists. Remove it before creating a replacement.")
        user, created = User.objects.get_or_create(username=username, defaults={"email": email})
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} owner account '{username}'."))
