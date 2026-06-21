import os
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


def bike_upload_path(instance, filename):
    extension = os.path.splitext(filename)[1].lower()
    vehicle_number = instance.vehicle_number.upper().replace(" ", "") or "new-bike"
    return f"bike-records/{vehicle_number}/{uuid.uuid4().hex}{extension}"


def validate_image_size(file):
    if file.size > 10 * 1024 * 1024:
        raise ValidationError("Image size must not exceed 10 MB.")


class BikeRecord(TimeStampedModel):

    vehicle_number = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
    )

    # RC Photos
    rc_photo_1 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    rc_photo_2 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    rc_photo_3 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    rc_photo_4 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    rc_photo_5 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)

    # Insurance Photos
    insurance_photo_1 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    insurance_photo_2 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    insurance_photo_3 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    insurance_photo_4 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    insurance_photo_5 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)

    # Pollution Photos
    pollution_photo_1 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    pollution_photo_2 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    pollution_photo_3 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    pollution_photo_4 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    pollution_photo_5 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)

    # NOC Photos
    noc_photo_1 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    noc_photo_2 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    noc_photo_3 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    noc_photo_4 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    noc_photo_5 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)

    # Buyer Identity Photos
    buyer_identity_photo_1 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    buyer_identity_photo_2 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    buyer_identity_photo_3 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    buyer_identity_photo_4 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    buyer_identity_photo_5 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)

    # Seller Identity Photos
    seller_identity_photo_1 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    seller_identity_photo_2 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    seller_identity_photo_3 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    seller_identity_photo_4 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)
    seller_identity_photo_5 = models.ImageField(upload_to=bike_upload_path, blank=True, null=True)

    buyer_name = models.CharField(max_length=160, blank=True, default="")
    buyer_phone = models.CharField(max_length=20, blank=True)
    buyer_address = models.TextField(blank=True)

    seller_name = models.CharField(max_length=160, blank=True)
    seller_phone = models.CharField(max_length=20, blank=True)
    seller_address = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        self.vehicle_number = self.vehicle_number.upper().replace(" ", "")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.vehicle_number
class Party(TimeStampedModel):
    class PartyType(models.TextChoices):
        BUYER = "buyer", "Buyer"
        SELLER = "seller", "Seller"

    party_type = models.CharField(max_length=10, choices=PartyType.choices, db_index=True)
    name = models.CharField(max_length=160, db_index=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    identity_number = models.CharField(max_length=80, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "parties"
        indexes = [models.Index(fields=["party_type", "name"])]

    def __str__(self):
        return f"{self.name} ({self.get_party_type_display()})"


class Vehicle(TimeStampedModel):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        SOLD = "sold", "Sold"
        PENDING = "pending", "Pending"
        ARCHIVED = "archived", "Archived"

    registration_number = models.CharField(max_length=30, unique=True, db_index=True)
    engine_number = models.CharField(max_length=80, unique=True, db_index=True)
    chassis_number = models.CharField(max_length=80, unique=True, db_index=True)
    make = models.CharField(max_length=80)
    model = models.CharField(max_length=80)
    variant = models.CharField(max_length=80, blank=True)
    manufacture_year = models.PositiveSmallIntegerField()
    color = models.CharField(max_length=40, blank=True)
    fuel_type = models.CharField(max_length=30, blank=True)
    odometer_km = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        self.registration_number = self.registration_number.upper().replace(" ", "")
        self.engine_number = self.engine_number.upper().strip()
        self.chassis_number = self.chassis_number.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.registration_number


def document_upload_path(instance, filename):
    extension = os.path.splitext(filename)[1].lower()
    return f"documents/{instance.vehicle.registration_number}/{uuid.uuid4().hex}{extension}"


def validate_file_size(file):
    if file.size > 10 * 1024 * 1024:
        raise ValidationError("File size must not exceed 10 MB.")


class Document(TimeStampedModel):
    class DocumentType(models.TextChoices):
        RC = "rc", "Registration Certificate"
        NOC = "noc", "No Objection Certificate"
        INSURANCE = "insurance", "Insurance"
        OTHER = "other", "Other"

    vehicle = models.ForeignKey(Vehicle, related_name="documents", on_delete=models.CASCADE)
    document_type = models.CharField(max_length=20, choices=DocumentType.choices, db_index=True)
    title = models.CharField(max_length=160)
    document_number = models.CharField(max_length=100, blank=True, db_index=True)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True, db_index=True)
    file = models.FileField(
        upload_to=document_upload_path,
        validators=[
            FileExtensionValidator(["pdf", "jpg", "jpeg", "png"]),
            validate_file_size,
        ],
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.vehicle} - {self.title}"


class VehicleTransaction(TimeStampedModel):
    class TransactionType(models.TextChoices):
        PURCHASE = "purchase", "Purchase"
        SALE = "sale", "Sale"
        TRANSFER = "transfer", "Transfer"

    vehicle = models.ForeignKey(Vehicle, related_name="transactions", on_delete=models.PROTECT)
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    seller = models.ForeignKey(
        Party,
        related_name="sales",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        limit_choices_to={"party_type": Party.PartyType.SELLER},
    )
    buyer = models.ForeignKey(
        Party,
        related_name="purchases",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        limit_choices_to={"party_type": Party.PartyType.BUYER},
    )
    transaction_date = models.DateField(db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(max_length=30, default="paid")
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-transaction_date", "-created_at"]

    def clean(self):
        if self.seller and self.seller.party_type != Party.PartyType.SELLER:
            raise ValidationError({"seller": "Selected party must be a seller."})
        if self.buyer and self.buyer.party_type != Party.PartyType.BUYER:
            raise ValidationError({"buyer": "Selected party must be a buyer."})


class BusinessSettings(models.Model):
    business_name = models.CharField(max_length=160, default="SVR Documents")
    owner_name = models.CharField(max_length=160, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    tax_number = models.CharField(max_length=80, blank=True)
    insurance_alert_days = models.PositiveSmallIntegerField(default=30)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class ActivityLog(models.Model):
    class Action(models.TextChoices):
        CREATE = "create", "Created"
        UPDATE = "update", "Updated"
        DELETE = "delete", "Deleted"
        LOGIN = "login", "Logged in"
        EXPORT = "export", "Exported"
        RESTORE = "restore", "Restored"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=20, choices=Action.choices)
    entity_type = models.CharField(max_length=80, blank=True)
    entity_id = models.CharField(max_length=80, blank=True)
    description = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.description
