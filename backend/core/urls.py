from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ActivityLogViewSet,
    BikeRecordViewSet,
    DocumentViewSet,
    OwnerTokenView,
    PartyViewSet,
    TransactionViewSet,
    VehicleViewSet,
    backup_data,
    change_password,
    dashboard,
    export_report,
    global_search,
    health,
    me,
    restore_data,
    settings_view,
    smart_search,
)


router = DefaultRouter()
router.register("bikes", BikeRecordViewSet, basename="bike")
router.register("vehicles", VehicleViewSet, basename="vehicle")
router.register("parties", PartyViewSet, basename="party")
router.register("documents", DocumentViewSet, basename="document")
router.register("transactions", TransactionViewSet, basename="transaction")
router.register("activities", ActivityLogViewSet, basename="activity")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/login/", OwnerTokenView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("auth/me/", me),
    path("dashboard/", dashboard),
    path("search/", global_search),
    path("smart-search/", smart_search),
    path("settings/", settings_view),
    path("settings/change-password/", change_password),
    path("reports/<str:report_type>/<str:file_format>/", export_report),
    path("backup/", backup_data),
    path("restore/", restore_data),
    path("health/", health),
]
