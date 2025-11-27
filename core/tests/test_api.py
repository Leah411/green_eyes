from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Unit, Profile, AccessRequest, OTPToken, AvailabilityReport
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class AuthAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_register(self):
        url = reverse('register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password2': 'newpass123',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
        self.assertTrue(AccessRequest.objects.filter(user__username='newuser').exists())

    def test_request_otp(self):
        self.user.is_approved = True
        self.user.save()
        url = reverse('request-otp')
        data = {'email': 'test@example.com'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(OTPToken.objects.filter(user=self.user).exists())

    def test_verify_otp(self):
        self.user.is_approved = True
        self.user.save()
        otp = OTPToken.objects.create(
            user=self.user,
            token='123456',
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        url = reverse('verify-otp')
        data = {
            'email': 'test@example.com',
            'token': '123456'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)


class AccessRequestAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin123',
            is_staff=True
        )
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.access_request = AccessRequest.objects.create(
            user=self.user,
            status='pending'
        )

    def test_list_access_requests(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('list-access-requests')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_approve_access_request(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('approve-access-request', args=[self.access_request.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.access_request.refresh_from_db()
        self.assertEqual(self.access_request.status, 'approved')
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_approved)


class ReportsAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            is_approved=True
        )
        self.unit = Unit.objects.create(name='Test Unit')
        Profile.objects.create(user=self.user, unit=self.unit, role='user')

    def test_create_report(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('create-report')
        data = {
            'date': timezone.now().date().isoformat(),
            'status': 'available',
            'notes': 'Test notes'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(AvailabilityReport.objects.filter(user=self.user).exists())

    def test_list_reports(self):
        AvailabilityReport.objects.create(
            user=self.user,
            date=timezone.now().date(),
            status='available'
        )
        self.client.force_authenticate(user=self.user)
        url = reverse('list-reports')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

