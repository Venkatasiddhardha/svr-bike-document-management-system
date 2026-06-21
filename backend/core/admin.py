from django.contrib import admin

from .models import ActivityLog, BikeRecord, BusinessSettings, Document, Party, Vehicle, VehicleTransaction


admin.site.site_header = "SVR Document Management"
admin.site.register([BikeRecord, Party, Vehicle, Document, VehicleTransaction, BusinessSettings, ActivityLog])
