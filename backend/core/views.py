import csv
import io
import json
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core import serializers as django_serializers
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import redirect

from .models import ActivityLog, BikeRecord, BusinessSettings, Document, Party, Vehicle, VehicleTransaction
from .permissions import IsOwner
from .serializers import (
    ActivityLogSerializer,
    BikeRecordSerializer,
    BusinessSettingsSerializer,
    ChangePasswordSerializer,
    DocumentSerializer,
    OwnerSerializer,
    PartySerializer,
    VehicleSerializer,
    VehicleTransactionSerializer,
)
from .services import client_ip, log_activity


class OwnerTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_superuser:
            raise AuthenticationFailed("Only the owner account can sign in.")
        data["user"] = OwnerSerializer(self.user).data
        ActivityLog.objects.create(
            user=self.user,
            action=ActivityLog.Action.LOGIN,
            description="Owner signed in",
            ip_address=client_ip(self.context["request"]),
        )
        return data


class OwnerTokenView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = OwnerTokenSerializer


class AuditedModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOwner]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_activity(
            self.request,
            ActivityLog.Action.CREATE,
            instance,
            f"Created {instance._meta.verbose_name}: {instance}",
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(
            self.request,
            ActivityLog.Action.UPDATE,
            instance,
            f"Updated {instance._meta.verbose_name}: {instance}",
        )

    def perform_destroy(self, instance):
        description = f"Deleted {instance._meta.verbose_name}: {instance}"
        entity_type, entity_id = instance._meta.model_name, str(instance.pk)
        instance.delete()
        ActivityLog.objects.create(
            user=self.request.user,
            action=ActivityLog.Action.DELETE,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            ip_address=client_ip(self.request),
        )
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class BikeRecordViewSet(AuditedModelViewSet):
    serializer_class = BikeRecordSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = BikeRecord.objects.all()
        query = self.request.query_params.get("search", "").strip()
        if query:
            queryset = queryset.filter(
                Q(vehicle_number__icontains=query)
                | Q(buyer_name__icontains=query)
                | Q(buyer_phone__icontains=query)
                | Q(seller_name__icontains=query)
                | Q(seller_phone__icontains=query)
            )
        return queryset

    @action(detail=True, methods=["get"], url_path=r"image/(?P<field_name>[^/.]+)")
    def image(self, request, pk=None, field_name=None):
        allowed_fields = {
            *[f"rc_photo_{i}" for i in range(1, 6)],
            *[f"insurance_photo_{i}" for i in range(1, 6)],
            *[f"pollution_photo_{i}" for i in range(1, 6)],
            *[f"noc_photo_{i}" for i in range(1, 6)],
            *[f"buyer_identity_photo_{i}" for i in range(1, 6)],
            *[f"seller_identity_photo_{i}" for i in range(1, 6)],
}
            
            
   
            
        
        if field_name not in allowed_fields:
            @action(detail=True, methods=["get"], url_path=r"image/(?P<field_name>[^/.]+)")
            def image(self, request, pk=None, field_name=None):
                bike = self.get_object()

                image = getattr(bike, field_name)

                if not image:
                    return Response({"detail": "No image"}, status=404)

                return redirect(image.url)
            
            
    @action(
    detail=True,
    methods=["delete"],
    url_path=r"image/(?P<field_name>[^/.]+)/delete"
)
    def delete_image(self, request, pk=None, field_name=None):
        
         allowed_fields = {
            *[f"rc_photo_{i}" for i in range(1, 6)],
            *[f"insurance_photo_{i}" for i in range(1, 6)],
            *[f"pollution_photo_{i}" for i in range(1, 6)],
            *[f"noc_photo_{i}" for i in range(1, 6)],
            *[f"buyer_identity_photo_{i}" for i in range(1, 6)],
            *[f"seller_identity_photo_{i}" for i in range(1, 6)],
}            
            
   
            
        

         
         if field_name not in allowed_fields:
             return Response({"detail": "Invalid image field."}, status=400)
         bike = self.get_object()
         
         image = getattr(bike, field_name)
        
         if image:
              image.delete(save=False)
              
         setattr(bike, field_name, None)
         bike.save()

         return Response({"success": True})      

    @action(detail=False, methods=["post"], url_path="smart-search")
    def smart_search(self, request):
        query = request.data.get("query", "").strip()
        if not query:
            return Response({"interpretation": "Enter a search phrase.", "results": []})

        lowered = query.lower()
        role_fields = {
            "buyer": ("buyer_name", "buyer_phone"),
            "seller": ("seller_name", "seller_phone"),
            "vehicle": ("vehicle_number",),
            "bike": ("vehicle_number",),
            "number": ("vehicle_number",),
        }
        selected_role = next((role for role in role_fields if role in lowered.split()), None)
        ignored_words = {
            "find", "show", "search", "get", "me", "for", "the", "a", "an",
            "record", "records", "details", "detail", "with", "named", "name",
            "buyer", "seller", "vehicle", "bike", "number",
        }
        terms = [word for word in lowered.replace(",", " ").split() if word not in ignored_words]
        search_text = " ".join(terms).strip() or query
        if selected_role in {"vehicle", "bike", "number"}:
            search_text = search_text.replace(" ", "")

        filters = Q()
        fields = role_fields.get(
            selected_role,
            ("vehicle_number", "buyer_name", "buyer_phone", "seller_name", "seller_phone"),
        )
        for field in fields:
            filters |= Q(**{f"{field}__icontains": search_text})

        results = BikeRecord.objects.filter(filters)
        if not results.exists() and len(terms) > 1:
            fallback = Q()
            for term in terms:
                for field in fields:
                    fallback |= Q(**{f"{field}__icontains": term})
            results = BikeRecord.objects.filter(fallback)

        role_label = selected_role.title() if selected_role else "All bike fields"
        return Response(
            {
                "interpretation": f"{role_label} search for '{search_text}'.",
                "results": BikeRecordSerializer(results.distinct()[:50], many=True, context={"request": request}).data,
            }
        )


class VehicleViewSet(AuditedModelViewSet):
    serializer_class = VehicleSerializer

    def get_queryset(self):
        queryset = Vehicle.objects.annotate(document_count=Count("documents"))
        query = self.request.query_params.get("search", "").strip()
        status_value = self.request.query_params.get("status")
        if query:
            queryset = queryset.filter(
                Q(registration_number__icontains=query)
                | Q(engine_number__icontains=query)
                | Q(chassis_number__icontains=query)
                | Q(make__icontains=query)
                | Q(model__icontains=query)
            )
        if status_value:
            queryset = queryset.filter(status=status_value)
        return queryset


class PartyViewSet(AuditedModelViewSet):
    serializer_class = PartySerializer

    def get_queryset(self):
        queryset = Party.objects.all()
        party_type = self.request.query_params.get("party_type")
        query = self.request.query_params.get("search", "").strip()
        if party_type:
            queryset = queryset.filter(party_type=party_type)
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(phone__icontains=query)
                | Q(email__icontains=query)
                | Q(identity_number__icontains=query)
            )
        return queryset


class DocumentViewSet(AuditedModelViewSet):
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Document.objects.select_related("vehicle")
        vehicle = self.request.query_params.get("vehicle")
        document_type = self.request.query_params.get("document_type")
        query = self.request.query_params.get("search", "").strip()
        if vehicle:
            queryset = queryset.filter(vehicle_id=vehicle)
        if document_type:
            queryset = queryset.filter(document_type=document_type)
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(document_number__icontains=query)
                | Q(vehicle__registration_number__icontains=query)
            )
        return queryset

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        document = self.get_object()
        return FileResponse(document.file.open("rb"), as_attachment=True, filename=document.file.name.rsplit("/", 1)[-1])

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        document = self.get_object()
        extension = document.file.name.rsplit(".", 1)[-1].lower()
        content_types = {"pdf": "application/pdf", "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png"}
        return FileResponse(
            document.file.open("rb"),
            content_type=content_types.get(extension, "application/octet-stream"),
            as_attachment=False,
        )


class TransactionViewSet(AuditedModelViewSet):
    serializer_class = VehicleTransactionSerializer

    def get_queryset(self):
        queryset = VehicleTransaction.objects.select_related("vehicle", "buyer", "seller")
        query = self.request.query_params.get("search", "").strip()
        if query:
            queryset = queryset.filter(
                Q(vehicle__registration_number__icontains=query)
                | Q(buyer__name__icontains=query)
                | Q(seller__name__icontains=query)
                | Q(reference_number__icontains=query)
            )
        return queryset


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsOwner]
    serializer_class = ActivityLogSerializer
    queryset = ActivityLog.objects.select_related("user")


@api_view(["GET"])
@permission_classes([IsOwner])
def dashboard(request):
    today = timezone.localdate()
    alert_days = BusinessSettings.load().insurance_alert_days
    expiring_limit = today + timedelta(days=alert_days)
    recent = ActivityLog.objects.select_related("user")[:8]
    monthly = (
        VehicleTransaction.objects.filter(transaction_date__year=today.year)
        .values("transaction_date__month")
        .annotate(total=Sum("amount"), count=Count("id"))
        .order_by("transaction_date__month")
    )
    return Response(
        {
            "stats": {
                "vehicles": Vehicle.objects.count(),
                "available_vehicles": Vehicle.objects.filter(status=Vehicle.Status.AVAILABLE).count(),
                "buyers": Party.objects.filter(party_type=Party.PartyType.BUYER).count(),
                "sellers": Party.objects.filter(party_type=Party.PartyType.SELLER).count(),
                "documents": Document.objects.count(),
                "transactions": VehicleTransaction.objects.count(),
            },
            "vehicle_status": list(Vehicle.objects.values("status").annotate(value=Count("id")).order_by("status")),
            "monthly_transactions": list(monthly),
            "recent_activities": ActivityLogSerializer(recent, many=True).data,
            "notifications": {
                "expiring_insurance": Document.objects.filter(
                    document_type=Document.DocumentType.INSURANCE,
                    expiry_date__range=(today, expiring_limit),
                ).count(),
                "missing_rc": Vehicle.objects.exclude(documents__document_type=Document.DocumentType.RC).count(),
                "missing_noc": Vehicle.objects.exclude(documents__document_type=Document.DocumentType.NOC).count(),
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsOwner])
def global_search(request):
    query = request.query_params.get("q", "").strip()
    if len(query) < 2:
        return Response({"vehicles": [], "parties": [], "documents": [], "transactions": []})
    vehicles = Vehicle.objects.filter(
        Q(registration_number__icontains=query)
        | Q(engine_number__icontains=query)
        | Q(chassis_number__icontains=query)
        | Q(make__icontains=query)
        | Q(model__icontains=query)
    )[:10]
    parties = Party.objects.filter(Q(name__icontains=query) | Q(phone__icontains=query))[:10]
    documents = Document.objects.select_related("vehicle").filter(
        Q(title__icontains=query)
        | Q(document_number__icontains=query)
        | Q(vehicle__registration_number__icontains=query)
    )[:10]
    transactions = VehicleTransaction.objects.select_related("vehicle", "buyer", "seller").filter(
        Q(vehicle__registration_number__icontains=query)
        | Q(buyer__name__icontains=query)
        | Q(seller__name__icontains=query)
    )[:10]
    return Response(
        {
            "vehicles": VehicleSerializer(vehicles, many=True).data,
            "parties": PartySerializer(parties, many=True).data,
            "documents": DocumentSerializer(documents, many=True, context={"request": request}).data,
            "transactions": VehicleTransactionSerializer(transactions, many=True).data,
        }
    )


@api_view(["POST"])
@permission_classes([IsOwner])
def smart_search(request):
    text = request.data.get("query", "").strip().lower()
    filters = Q()
    words = [word for word in text.replace(",", " ").split() if len(word) > 1]
    for word in words:
        filters |= (
            Q(registration_number__icontains=word)
            | Q(engine_number__icontains=word)
            | Q(chassis_number__icontains=word)
            | Q(make__icontains=word)
            | Q(model__icontains=word)
            | Q(documents__title__icontains=word)
            | Q(documents__document_number__icontains=word)
            | Q(transactions__buyer__name__icontains=word)
            | Q(transactions__seller__name__icontains=word)
        )
    vehicles = Vehicle.objects.filter(filters).distinct()[:20] if words else Vehicle.objects.none()
    return Response(
        {
            "interpretation": f"Matched {len(words)} searchable terms across vehicles, documents, buyers and sellers.",
            "results": VehicleSerializer(vehicles, many=True).data,
        }
    )


@api_view(["GET", "PUT"])
@permission_classes([IsOwner])
def settings_view(request):
    instance = BusinessSettings.load()
    if request.method == "GET":
        return Response(BusinessSettingsSerializer(instance).data)
    serializer = BusinessSettingsSerializer(instance, data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    log_activity(request, ActivityLog.Action.UPDATE, instance, "Updated business settings")
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsOwner])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    request.user.set_password(serializer.validated_data["new_password"])
    request.user.save(update_fields=["password"])
    return Response({"detail": "Password changed successfully."})


def report_rows(report_type):
    if report_type == "vehicles":
        headers = ["Registration", "Engine", "Chassis", "Make", "Model", "Year", "Status"]
        rows = Vehicle.objects.values_list(
            "registration_number", "engine_number", "chassis_number", "make", "model", "manufacture_year", "status"
        )
    elif report_type == "transactions":
        headers = ["Date", "Vehicle", "Type", "Buyer", "Seller", "Amount", "Payment Status"]
        rows = VehicleTransaction.objects.select_related("vehicle", "buyer", "seller").values_list(
            "transaction_date",
            "vehicle__registration_number",
            "transaction_type",
            "buyer__name",
            "seller__name",
            "amount",
            "payment_status",
        )
    else:
        headers = ["Vehicle", "Type", "Title", "Number", "Issue Date", "Expiry Date"]
        rows = Document.objects.select_related("vehicle").values_list(
            "vehicle__registration_number",
            "document_type",
            "title",
            "document_number",
            "issue_date",
            "expiry_date",
        )
    return headers, rows


@api_view(["GET"])
@permission_classes([IsOwner])
def export_report(request, report_type, file_format):
    headers, rows = report_rows(report_type)
    if file_format == "excel":
        try:
            from openpyxl import Workbook
        except ImportError:
            return Response({"detail": "Install openpyxl to enable Excel export."}, status=503)
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = report_type.title()
        sheet.append(headers)
        for row in rows:
            sheet.append(list(row))
        output = io.BytesIO()
        workbook.save(output)
        output.seek(0)
        response = HttpResponse(
            output.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{report_type}.xlsx"'
    elif file_format == "pdf":
        try:
            from reportlab.lib.pagesizes import A4, landscape
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
            from reportlab.lib import colors
        except ImportError:
            return Response({"detail": "Install reportlab to enable PDF export."}, status=503)
        output = io.BytesIO()
        doc = SimpleDocTemplate(output, pagesize=landscape(A4))
        data = [headers] + [[str(value or "") for value in row] for row in rows]
        table = Table(data, repeatRows=1)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#102a56")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                ]
            )
        )
        doc.build([table])
        response = HttpResponse(output.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{report_type}.pdf"'
    else:
        return Response({"detail": "Unsupported format."}, status=400)
    log_activity(request, ActivityLog.Action.EXPORT, description=f"Exported {report_type} as {file_format}")
    return response


BACKUP_MODELS = [Party, Vehicle, Document, VehicleTransaction, BusinessSettings]


@api_view(["GET"])
@permission_classes([IsOwner])
def backup_data(request):
    payload = django_serializers.serialize("json", [obj for model in BACKUP_MODELS for obj in model.objects.all()])
    response = HttpResponse(payload, content_type="application/json")
    response["Content-Disposition"] = 'attachment; filename="svr-backup.json"'
    return response


@api_view(["POST"])
@permission_classes([IsOwner])
def restore_data(request):
    uploaded = request.FILES.get("file")
    if not uploaded:
        return Response({"detail": "A JSON backup file is required."}, status=400)
    try:
        content = uploaded.read().decode("utf-8")
        json.loads(content)
        with transaction.atomic():
            for obj in django_serializers.deserialize("json", content):
                obj.save()
    except Exception as exc:
        return Response({"detail": f"Restore failed: {exc}"}, status=400)
    log_activity(request, ActivityLog.Action.RESTORE, description="Restored system backup")
    return Response({"detail": "Backup restored successfully."})


@api_view(["GET"])
@permission_classes([IsOwner])
def me(request):
    return Response(OwnerSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok"})
