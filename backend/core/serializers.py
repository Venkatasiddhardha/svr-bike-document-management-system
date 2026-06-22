from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import ActivityLog, BikeRecord, BusinessSettings, Document, Party, Vehicle, VehicleTransaction


class BikeRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = BikeRecord
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")
        extra_kwargs = {
            "rc_photo_1": {"required": False},
"rc_photo_2": {"required": False},
"rc_photo_3": {"required": False},
"rc_photo_4": {"required": False},
"rc_photo_5": {"required": False},

"insurance_photo_1": {"required": False},
"insurance_photo_2": {"required": False},
"insurance_photo_3": {"required": False},
"insurance_photo_4": {"required": False},
"insurance_photo_5": {"required": False},

"pollution_photo_1": {"required": False},
"pollution_photo_2": {"required": False},
"pollution_photo_3": {"required": False},
"pollution_photo_4": {"required": False},
"pollution_photo_5": {"required": False},

"noc_photo_1": {"required": False},
"noc_photo_2": {"required": False},
"noc_photo_3": {"required": False},
"noc_photo_4": {"required": False},
"noc_photo_5": {"required": False},

"buyer_identity_photo_1": {"required": False},
"buyer_identity_photo_2": {"required": False},
"buyer_identity_photo_3": {"required": False},
"buyer_identity_photo_4": {"required": False},
"buyer_identity_photo_5": {"required": False},

"seller_identity_photo_1": {"required": False},
"seller_identity_photo_2": {"required": False},
"seller_identity_photo_3": {"required": False},
"seller_identity_photo_4": {"required": False},
"seller_identity_photo_5": {"required": False},
        }

    def validate_vehicle_number(self, value):
        normalized = value.upper().replace(" ", "")
        queryset = BikeRecord.objects.filter(vehicle_number=normalized)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                "A bike with this vehicle number already exists."
            )
        return normalized

    def validate(self, attrs):
        attrs["buyer_name"] = attrs.get("buyer_name", "")
        attrs["seller_name"] = attrs.get("seller_name", "")
        return attrs


class PartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")


class DocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    vehicle_registration = serializers.CharField(source="vehicle.registration_number", read_only=True)

    class Meta:
        model = Document
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url


class VehicleSerializer(serializers.ModelSerializer):
    document_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Vehicle
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def validate_manufacture_year(self, value):
        if value < 1900 or value > 2100:
            raise serializers.ValidationError("Enter a valid manufacture year.")
        return value


class VehicleTransactionSerializer(serializers.ModelSerializer):
    vehicle_registration = serializers.CharField(source="vehicle.registration_number", read_only=True)
    buyer_name = serializers.CharField(source="buyer.name", read_only=True)
    seller_name = serializers.CharField(source="seller.name", read_only=True)

    class Meta:
        model = VehicleTransaction
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def validate(self, attrs):
        seller = attrs.get("seller", getattr(self.instance, "seller", None))
        buyer = attrs.get("buyer", getattr(self.instance, "buyer", None))
        if seller and seller.party_type != Party.PartyType.SELLER:
            raise serializers.ValidationError({"seller": "Selected party must be a seller."})
        if buyer and buyer.party_type != Party.PartyType.BUYER:
            raise serializers.ValidationError({"buyer": "Selected party must be a buyer."})
        return attrs


class ActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ActivityLog
        fields = "__all__"


class BusinessSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessSettings
        fields = "__all__"
        read_only_fields = ("id", "updated_at")


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value, self.context["request"].user)
        return value

    def validate(self, attrs):
        if not self.context["request"].user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})
        return attrs


class OwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ("id", "username", "first_name", "last_name", "email")

class OwnerTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.is_superuser:
            raise AuthenticationFailed("Only the owner account can sign in.")

        data["user"] = OwnerSerializer(self.user).data
        return data
