from datetime import date

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from io import BytesIO
from rest_framework.test import APITestCase

from .models import BikeRecord, Document, Party, Vehicle


class ApiTests(APITestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_superuser("owner", "owner@example.com", "StrongPass123!")
        response = self.client.post("/api/auth/login/", {"username": "owner", "password": "StrongPass123!"})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_owner_can_create_and_search_vehicle(self):
        payload = {
            "registration_number": "TS 09 AB 1234",
            "engine_number": "ENG001",
            "chassis_number": "CHS001",
            "make": "Tata",
            "model": "Nexon",
            "manufacture_year": 2024,
        }
        response = self.client.post("/api/vehicles/", payload)
        self.assertEqual(response.status_code, 201)
        response = self.client.get("/api/search/?q=ENG001")
        self.assertEqual(len(response.data["vehicles"]), 1)

    def test_dashboard_reports_missing_documents(self):
        Vehicle.objects.create(
            registration_number="TS09AB9999",
            engine_number="E999",
            chassis_number="C999",
            make="Mahindra",
            model="XUV",
            manufacture_year=2023,
        )
        response = self.client.get("/api/dashboard/")
        self.assertEqual(response.data["notifications"]["missing_rc"], 1)

    def test_document_upload(self):
        vehicle = Vehicle.objects.create(
            registration_number="TS09AB1111",
            engine_number="E111",
            chassis_number="C111",
            make="Maruti",
            model="Swift",
            manufacture_year=2022,
        )
        upload = SimpleUploadedFile("rc.pdf", b"%PDF-1.4 test", content_type="application/pdf")
        response = self.client.post(
            "/api/documents/",
            {"vehicle": vehicle.pk, "document_type": "rc", "title": "RC", "file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Document.objects.count(), 1)
        preview = self.client.get(f"/api/documents/{response.data['id']}/preview/")
        self.assertEqual(preview.status_code, 200)
        self.assertEqual(preview["Content-Type"], "application/pdf")

    def test_report_exports(self):
        for file_format, content_type in (
            ("pdf", "application/pdf"),
            ("excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        ):
            response = self.client.get(f"/api/reports/vehicles/{file_format}/")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["Content-Type"], content_type)

    def image_upload(self, name):
        output = BytesIO()
        Image.new("RGB", (20, 20), "white").save(output, format="JPEG")
        return SimpleUploadedFile(name, output.getvalue(), content_type="image/jpeg")

    def test_create_and_search_bike_record(self):
        response = self.client.post(
            "/api/bikes/",
            {
                "vehicle_number": "TS 09 AB 1234",
                "rc_photo": self.image_upload("rc.jpg"),
                "insurance_photo": self.image_upload("insurance.jpg"),
                "pollution_photo": self.image_upload("pollution.jpg"),
                "buyer_name": "Ravi",
                "buyer_phone": "9999999999",
                "buyer_photo": self.image_upload("buyer.jpg"),
                "seller_name": "Kiran",
                "seller_phone": "8888888888",
                "seller_photo": self.image_upload("seller.jpg"),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(BikeRecord.objects.get().vehicle_number, "TS09AB1234")
        search = self.client.get("/api/bikes/?search=Ravi")
        self.assertEqual(search.data["count"], 1)
        smart_search = self.client.post("/api/bikes/smart-search/", {"query": "find buyer Ravi"})
        self.assertEqual(smart_search.status_code, 200)
        self.assertEqual(len(smart_search.data["results"]), 1)
        self.assertIn("Buyer search", smart_search.data["interpretation"])
