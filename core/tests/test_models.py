from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from core.models import Unit, Profile, AvailabilityReport, AccessRequest, OTPToken

User = get_user_model()


class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_user_creation(self):
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertFalse(self.user.is_approved)

    def test_user_str(self):
        self.assertEqual(str(self.user), 'testuser (test@example.com)')


class UnitModelTest(TestCase):
    def setUp(self):
        self.unit = Unit.objects.create(
            name='Test Unit',
            name_he='יחידת בדיקה',
            unit_type='unit',
            code='TEST-001'
        )

    def test_unit_creation(self):
        self.assertEqual(self.unit.name, 'Test Unit')
        self.assertEqual(self.unit.unit_type, 'unit')

    def test_unit_hierarchy(self):
        branch = Unit.objects.create(
            name='Test Branch',
            parent=self.unit,
            unit_type='branch'
        )
        self.assertEqual(branch.parent, self.unit)
        self.assertIn(branch, self.unit.get_descendants())


class ProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com'
        )
        self.unit = Unit.objects.create(name='Test Unit')
        self.profile = Profile.objects.create(
            user=self.user,
            unit=self.unit,
            role='user'
        )

    def test_profile_creation(self):
        self.assertEqual(self.profile.user, self.user)
        self.assertEqual(self.profile.unit, self.unit)
        self.assertEqual(self.profile.role, 'user')

    def test_is_manager(self):
        self.assertFalse(self.profile.is_manager())
        self.profile.role = 'unit_manager'
        self.profile.save()
        self.assertTrue(self.profile.is_manager())


class AccessRequestModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com'
        )
        self.access_request = AccessRequest.objects.create(
            user=self.user,
            status='pending'
        )

    def test_access_request_creation(self):
        self.assertEqual(self.access_request.status, 'pending')
        self.assertIsNone(self.access_request.approved_by)

    def test_approve_method(self):
        admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            is_staff=True
        )
        self.access_request.approve(admin)
        self.assertEqual(self.access_request.status, 'approved')
        self.assertEqual(self.access_request.approved_by, admin)
        self.assertTrue(self.user.is_approved)

    def test_reject_method(self):
        admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            is_staff=True
        )
        self.access_request.reject(admin, reason='Test rejection')
        self.assertEqual(self.access_request.status, 'rejected')
        self.assertEqual(self.access_request.rejection_reason, 'Test rejection')


class OTPTokenModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com'
        )
        self.otp = OTPToken.objects.create(
            user=self.user,
            token='123456',
            expires_at=timezone.now() + timedelta(minutes=10)
        )

    def test_otp_creation(self):
        self.assertEqual(self.otp.token, '123456')
        self.assertFalse(self.otp.used)

    def test_is_valid(self):
        self.assertTrue(self.otp.is_valid())
        self.otp.used = True
        self.otp.save()
        self.assertFalse(self.otp.is_valid())

    def test_mark_as_used(self):
        self.otp.mark_as_used()
        self.assertTrue(self.otp.used)


class AvailabilityReportModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com'
        )
        self.report = AvailabilityReport.objects.create(
            user=self.user,
            date=timezone.now().date(),
            status='available'
        )

    def test_report_creation(self):
        self.assertEqual(self.report.user, self.user)
        self.assertEqual(self.report.status, 'available')

