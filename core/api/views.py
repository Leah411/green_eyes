from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.http import HttpResponse, JsonResponse
from datetime import timedelta
import random
import pandas as pd
from io import BytesIO
from django.db.models import Q, Count, Prefetch
from django.contrib.auth import get_user_model

from core.models import (
    User, Profile, Unit, Location, AvailabilityReport, 
    AccessRequest, OTPToken
)
from core.permissions import (
    IsApproved, IsManager, IsUnitManager,
    IsBranchManager, IsSectionManager, IsTeamManager
)
from core.api.serializers import (
    UserSignupSerializer,
    UserLoginSerializer,
    UserSerializer,
    ProfileSerializer,
    UnitSerializer,
    LocationSerializer,
    OTPSerializer,
    OTPVerifySerializer,
    AvailabilityReportSerializer,
    AccessRequestSerializer,
    AlertSendSerializer
)
from django.conf import settings

User = get_user_model()


# ==================== Helper Functions ====================

def generate_otp_token():
    """Generate a 6-digit OTP token"""
    return str(random.randint(100000, 999999))


def check_otp_rate_limit(user):
    """Check if user has exceeded OTP rate limit"""
    cache_key = f'otp_rate_limit_{user.id}'
    count = cache.get(cache_key, 0)
    
    if count >= settings.OTP_RATE_LIMIT:
        return False
    
    cache.set(cache_key, count + 1, 3600)  # 1 hour expiry
    return True


def send_otp_email(user, otp_token, purpose='login'):
    """Send OTP email to user"""
    import logging
    import threading
    logger = logging.getLogger('core')
    
    def _send_email():
        try:
            # Try to load HTML template, fallback to plain text
            try:
                template_name = 'otp_login.html'
                html_message = render_to_string(template_name, {
                    'user': user,
                    'otp_code': otp_token,
                    'expiry_minutes': settings.OTP_EXPIRY_MINUTES,
                })
                message = None
            except Exception as e:
                logger.warning(f"Template error: {e}")
                html_message = None
                message = f'''
                Hello {user.get_full_name() or user.username},
                
                Your OTP code for account verification is: {otp_token}
                
                This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.
                
                If you did not request this code, please ignore this email.
                
                Best regards,
                Yirok Team
                '''
            
            # Use simple from email format (Gmail requires exact match with EMAIL_HOST_USER)
            result = send_mail(
                subject='Your OTP Code for Account Verification',
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,  # Changed to False to see actual errors
            )
            if result:
                logger.info(f"OTP email sent successfully to {user.email}")
            else:
                logger.warning(f"OTP email sending returned False for {user.email}")
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error sending OTP email to {user.email}: {error_msg}", exc_info=True)
    
    # Send email in background thread to prevent blocking
    try:
        thread = threading.Thread(target=_send_email, daemon=True)
        thread.start()
        # Give it a moment to start, but don't wait for completion
        return True, None
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error starting email thread: {error_msg}")
        return False, error_msg


def send_approval_notification(user):
    """Send approval notification email"""
    try:
        try:
            html_message = render_to_string('approval_notification.html', {
                'user': user,
            })
            message = None
        except:
            html_message = None
            message = f'''
            Hello {user.get_full_name() or user.username},
            
            Your access request has been approved!
            
            You can now log in to the system using your credentials.
            
            Best regards,
            Yirok Team
            '''
        
        send_mail(
            subject='Access Request Approved',
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending approval notification: {e}")
        return False


# ==================== Authentication Endpoints ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    User registration endpoint.
    Creates a new user account (is_active=True but is_approved=False) + AccessRequest.
    """
    serializer = UserSignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Get the created access request
        access_request = AccessRequest.objects.filter(user=user).latest('submitted_at')
        
        return Response({
            'message': 'User created successfully. Waiting for admin approval.',
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'access_request_id': access_request.id,
            'status': 'pending'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def request_otp_view(request):
    """
    Request OTP endpoint.
    Creates OTPToken (6-digit code), rate-limited per user (5 per hour), sends via email.
    """
    import logging
    logger = logging.getLogger('core')
    
    logger.info(f"OTP request received: {request.data}")
    
    serializer = OTPSerializer(data=request.data)
    if not serializer.is_valid():
        logger.warning(f"OTP request validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            'error': 'User with this email does not exist.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user is approved (serializer should catch this, but double-check)
    if not user.is_approved:
        return Response({
            'error': 'User account is not approved yet. Please wait for admin approval.',
            'status': 'pending'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Check rate limit
    if not check_otp_rate_limit(user):
        return Response({
            'error': 'Rate limit exceeded. Please try again later.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    # Generate OTP
    otp_token = generate_otp_token()
    expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    
    # Create OTP record
    otp = OTPToken.objects.create(
        user=user,
        token=otp_token,
        purpose='login',
        expires_at=expires_at
    )
    
    # Send OTP via email (non-blocking)
    # Start email sending in background, but don't wait for it
    send_otp_email(user, otp_token, purpose='login')
    
    # Return response immediately - email will be sent in background
    # In development mode, also return the OTP code for testing
    response_data = {
        'message': 'OTP sent to your email address.',
        'expires_in_minutes': settings.OTP_EXPIRY_MINUTES
    }
    
    # Only include OTP in debug mode for development/testing
    if settings.DEBUG:
        response_data['otp_code'] = otp_token
        response_data['debug_note'] = 'OTP code included in response for development. Check console/email in production.'
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    """
    Verify OTP endpoint.
    Validates token → returns JWT access + refresh tokens.
    """
    serializer = OTPVerifySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user = serializer.validated_data['user']
    otp = serializer.validated_data['otp']
    
    # Mark OTP as used
    otp.mark_as_used()
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    return Response({
        'message': 'OTP verified successfully.',
        'access': access_token,
        'refresh': refresh_token,
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint (email + password).
    Note: After approval, users should use request-otp + verify-otp flow.
    This endpoint is for backward compatibility or direct login without OTP.
    """
    serializer = UserLoginSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user = serializer.validated_data['user']
    
    # Check if user is approved
    if not user.is_approved:
        return Response({
            'error': 'Your account is pending admin approval.',
            'status': 'pending'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    return Response({
        'message': 'Login successful',
        'access': access_token,
        'refresh': refresh_token,
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK)


# ==================== Access Request Endpoints ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_access_requests_view(request):
    """
    List access requests.
    Managers can see pending requests in their unit.
    Admins can see all requests.
    """
    if not (request.user.is_staff or hasattr(request.user, 'profile') and request.user.profile.is_manager()):
        return Response({
            'error': 'Only staff members and managers can view access requests.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    queryset = AccessRequest.objects.select_related('user', 'approved_by').all()
    
    # Filter by status
    status_filter = request.query_params.get('status', None)
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    # System managers and unit managers see all requests (no unit filter)
    # Other managers see only requests from their unit based on role
    if hasattr(request.user, 'profile'):
        user_role = request.user.profile.role
        # system_manager and unit_manager see all requests (no filtering)
        if user_role not in ['system_manager', 'unit_manager'] and not request.user.is_staff:
            if request.user.profile.unit:
                user_unit = request.user.profile.unit
                
                if user_role == 'section_manager':
                    # Section manager sees only requests from their section (not descendants)
                    unit_user_ids = Profile.objects.filter(unit=user_unit).values_list('user_id', flat=True)
                elif user_role == 'team_manager':
                    # Team manager sees only requests from their team (not descendants)
                    unit_user_ids = Profile.objects.filter(unit=user_unit).values_list('user_id', flat=True)
                else:
                    # Other managers (branch_manager) see their unit and descendants
                    descendant_units = user_unit.get_descendants()
                    all_units = [user_unit] + descendant_units
                    unit_user_ids = Profile.objects.filter(unit__in=all_units).values_list('user_id', flat=True)
                
                # Also include users without a unit (unit=None) for pending requests
                queryset = queryset.filter(
                    Q(user_id__in=unit_user_ids) | 
                    Q(user__profile__unit__isnull=True, status='pending')
                )
    
    # Filter by unit_id query param
    unit_id = request.query_params.get('unit', None)
    if unit_id:
        try:
            unit = Unit.objects.get(id=unit_id)
            descendant_units = unit.get_descendants()
            all_units = [unit] + descendant_units
            unit_user_ids = Profile.objects.filter(unit__in=all_units).values_list('user_id', flat=True)
            queryset = queryset.filter(user_id__in=unit_user_ids)
        except Unit.DoesNotExist:
            pass
    
    serializer = AccessRequestSerializer(queryset.order_by('-submitted_at'), many=True)
    return Response({
        'count': len(serializer.data),
        'results': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_access_request_view(request, request_id):
    """
    Approve access request.
    Admin/manager approves → sets user.is_approved=True and sends approval email & OTP.
    Can also set role and unit_id for the user.
    """
    if not (request.user.is_staff or hasattr(request.user, 'profile') and request.user.profile.is_manager()):
        return Response({
            'error': 'Only staff members and managers can approve access requests.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        access_request = AccessRequest.objects.select_related('user').get(id=request_id)
    except AccessRequest.DoesNotExist:
        return Response({
            'error': 'Access request not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if access_request.status == 'approved':
        return Response({
            'error': 'Access request already approved.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Approve the request
    access_request.approve(request.user)
    
    # Get the user and profile (profile was already created during registration with all data)
    # All registration data (user fields: first_name, last_name, phone, email, and profile fields: id_number, address, city, unit)
    # is already saved in the database from the registration process
    user = access_request.user
    profile, created = Profile.objects.get_or_create(user=user)
    
    # Admin can optionally update role and unit during approval
    # If not provided, the registration data is preserved
    if 'role' in request.data:
        profile.role = request.data['role']
    
    if 'unit_id' in request.data:
        unit_id = request.data.get('unit_id')
        if unit_id:
            try:
                unit = Unit.objects.get(id=unit_id)
                profile.unit = unit
            except Unit.DoesNotExist:
                pass  # Invalid unit_id, keep existing unit from registration
        else:
            profile.unit = None
    
    # Admin can optionally update profile details during approval
    # If not provided, the registration data is preserved
    if 'id_number' in request.data:
        profile.id_number = request.data['id_number']
    if 'address' in request.data:
        profile.address = request.data['address']
    if 'city_id' in request.data:
        city_id = request.data.get('city_id')
        if city_id:
            try:
                city = Location.objects.get(id=city_id)
                profile.city = city
            except Location.DoesNotExist:
                pass  # Invalid city_id, keep existing city from registration
        else:
            profile.city = None
    
    # Admin can optionally update user fields during approval
    # If not provided, the registration data is preserved
    if 'first_name' in request.data:
        user.first_name = request.data['first_name']
    if 'last_name' in request.data:
        user.last_name = request.data['last_name']
    if 'phone' in request.data:
        user.phone = request.data['phone']
    if 'email' in request.data:
        user.email = request.data['email']
    
    user.save()
    profile.save()
    
    # Send approval notification
    send_approval_notification(access_request.user)
    
    # Generate and send OTP
    otp_token = generate_otp_token()
    expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    otp = OTPToken.objects.create(
        user=access_request.user,
        token=otp_token,
        purpose='login',
        expires_at=expires_at
    )
    email_sent, error_msg = send_otp_email(access_request.user, otp_token, purpose='login')
    
    response_data = {
        'message': 'Access request approved.',
        'access_request': AccessRequestSerializer(access_request).data
    }
    
    if email_sent:
        response_data['message'] = 'Access request approved. OTP sent to user email.'
    else:
        response_data['warning'] = f'Access request approved but OTP email failed to send: {error_msg or "Check email configuration."}'
        if settings.DEBUG:
            response_data['otp_code'] = otp_token
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_access_request_view(request, request_id):
    """
    Reject access request.
    """
    if not (request.user.is_staff or hasattr(request.user, 'profile') and request.user.profile.is_manager()):
        return Response({
            'error': 'Only staff members and managers can reject access requests.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        access_request = AccessRequest.objects.get(id=request_id)
    except AccessRequest.DoesNotExist:
        return Response({
            'error': 'Access request not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    reason = request.data.get('reason', '')
    access_request.reject(request.user, reason=reason)
    
    return Response({
        'message': 'Access request rejected.',
        'access_request': AccessRequestSerializer(access_request).data
    }, status=status.HTTP_200_OK)


# ==================== Reports Endpoints ====================

@api_view(['GET'])
@permission_classes([IsApproved])
def list_reports_view(request):
    """
    List availability reports.
    RBAC applied: users see their own, managers see their unit's reports.
    """
    queryset = AvailabilityReport.objects.select_related('user').all()
    
    # Regular users see only their own reports
    if not (request.user.is_staff or hasattr(request.user, 'profile') and request.user.profile.is_manager()):
        queryset = queryset.filter(user=request.user)
    else:
        # Managers see reports from their unit based on role
        if hasattr(request.user, 'profile') and request.user.profile.unit:
            user_role = request.user.profile.role
            user_unit = request.user.profile.unit
            
            # System manager and unit manager see all reports (no filtering)
            if user_role in ['system_manager', 'unit_manager']:
                # No filtering - see all reports
                pass
            elif user_role == 'section_manager':
                # Section manager sees only reports from their section (not descendants)
                unit_user_ids = Profile.objects.filter(unit=user_unit).values_list('user_id', flat=True)
                queryset = queryset.filter(user_id__in=unit_user_ids)
            elif user_role == 'team_manager':
                # Team manager sees only reports from their team (not descendants)
                unit_user_ids = Profile.objects.filter(unit=user_unit).values_list('user_id', flat=True)
                queryset = queryset.filter(user_id__in=unit_user_ids)
            else:
                # Other managers (branch_manager) see their unit and descendants
                descendant_units = user_unit.get_descendants()
                all_units = [user_unit] + descendant_units
                unit_user_ids = Profile.objects.filter(unit__in=all_units).values_list('user_id', flat=True)
                queryset = queryset.filter(user_id__in=unit_user_ids)
    
    # Filter by unit
    unit_id = request.query_params.get('unit', None)
    if unit_id:
        try:
            unit = Unit.objects.get(id=unit_id)
            descendant_units = unit.get_descendants()
            all_units = [unit] + descendant_units
            unit_user_ids = Profile.objects.filter(unit__in=all_units).values_list('user_id', flat=True)
            queryset = queryset.filter(user_id__in=unit_user_ids)
        except Unit.DoesNotExist:
            pass
    
    # Filter by date
    date_filter = request.query_params.get('date', None)
    if date_filter:
        queryset = queryset.filter(date=date_filter)
    
    # Filter by date range
    date_from = request.query_params.get('from', None)
    date_to = request.query_params.get('to', None)
    if date_from:
        queryset = queryset.filter(date__gte=date_from)
    if date_to:
        queryset = queryset.filter(date__lte=date_to)
    
    serializer = AvailabilityReportSerializer(queryset.order_by('-date', '-submitted_at'), many=True)
    return Response({
        'count': len(serializer.data),
        'results': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsApproved])
def create_report_view(request):
    """
    Create availability report.
    """
    serializer = AvailabilityReportSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        report = serializer.save()
        return Response(
            AvailabilityReportSerializer(report).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsApproved])
def export_reports_view(request):
    """
    Export availability reports to Excel.
    RBAC applied: users export their own, managers export their unit's reports.
    """
    queryset = AvailabilityReport.objects.select_related('user', 'user__profile', 'user__profile__unit').all()
    
    # Apply same filters as list_reports_view
    if not (request.user.is_staff or hasattr(request.user, 'profile') and request.user.profile.is_manager()):
        queryset = queryset.filter(user=request.user)
    else:
        if hasattr(request.user, 'profile') and request.user.profile.unit:
            user_unit = request.user.profile.unit
            descendant_units = user_unit.get_descendants()
            all_units = [user_unit] + descendant_units
            unit_user_ids = Profile.objects.filter(unit__in=all_units).values_list('user_id', flat=True)
            queryset = queryset.filter(user_id__in=unit_user_ids)
    
    # Filter by unit
    unit_id = request.query_params.get('unit', None)
    if unit_id:
        try:
            unit = Unit.objects.get(id=unit_id)
            descendant_units = unit.get_descendants()
            all_units = [unit] + descendant_units
            unit_user_ids = Profile.objects.filter(unit__in=all_units).values_list('user_id', flat=True)
            queryset = queryset.filter(user_id__in=unit_user_ids)
        except Unit.DoesNotExist:
            pass
    
    # Filter by date range
    date_from = request.query_params.get('from', None)
    date_to = request.query_params.get('to', None)
    if date_from:
        queryset = queryset.filter(date__gte=date_from)
    if date_to:
        queryset = queryset.filter(date__lte=date_to)
    
    # Prepare data for Excel
    data = []
    for report in queryset:
        unit_name = report.user.profile.unit.name if hasattr(report.user, 'profile') and report.user.profile.unit else 'N/A'
        data.append({
            'User': report.user.username,
            'Email': report.user.email,
            'Unit': unit_name,
            'Date': report.date,
            'Status': report.get_status_display(),
            'Notes': report.notes,
            'Submitted At': report.submitted_at,
        })
    
    # Create Excel file
    df = pd.DataFrame(data)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Availability Reports')
    
    output.seek(0)
    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="availability_reports_{timezone.now().date()}.xlsx"'
    return response


# ==================== Alerts Endpoint ====================

@api_view(['POST'])
@permission_classes([IsManager])
def send_alert_view(request):
    """
    Send email alerts to users/managers in a unit.
    RBAC: only manager roles can send alerts.
    """
    serializer = AlertSendSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    unit_id = serializer.validated_data.get('unit_id')
    subject = serializer.validated_data['subject']
    message = serializer.validated_data['message']
    send_to = serializer.validated_data['send_to']
    
    # Determine recipients
    recipients = []
    if unit_id:
        unit = Unit.objects.get(id=unit_id)
        descendant_units = unit.get_descendants()
        all_units = [unit] + descendant_units
        
        if 'all' in send_to or 'users' in send_to:
            user_profiles = Profile.objects.filter(unit__in=all_units)
            recipients.extend([p.user.email for p in user_profiles if p.user.email])
        
        if 'all' in send_to or 'managers' in send_to:
            manager_profiles = Profile.objects.filter(
                unit__in=all_units,
                role__in=['team_manager', 'section_manager', 'branch_manager', 'unit_manager', 'admin']
            )
            recipients.extend([p.user.email for p in manager_profiles if p.user.email])
    else:
        # Send to all users/managers (system_manager, unit_manager, or admin only)
        user_role = None
        if hasattr(request.user, 'profile'):
            user_role = request.user.profile.role
        
        if not (request.user.is_staff or user_role in ['system_manager', 'unit_manager', 'admin']):
            return Response({
                'error': 'Only system managers, unit managers, or admins can send alerts to all users.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if 'all' in send_to or 'users' in send_to:
            recipients.extend([u.email for u in User.objects.filter(is_approved=True, email__isnull=False).exclude(email='')])
        
        if 'all' in send_to or 'managers' in send_to:
            manager_profiles = Profile.objects.filter(
                role__in=['team_manager', 'section_manager', 'branch_manager', 'unit_manager', 'admin']
            )
            recipients.extend([p.user.email for p in manager_profiles if p.user.email])
    
    # Remove duplicates
    recipients = list(set(recipients))
    
    # Generate personalized link token (simple approach: use user's ID + timestamp hash)
    # In production, use a more secure token generation
    from hashlib import md5
    from datetime import datetime
    
    sent_count = 0
    for email in recipients:
        try:
            user = User.objects.get(email=email)
            # Generate a simple token for one-click login (in production, use proper JWT or signed token)
            token = md5(f"{user.id}{datetime.now().isoformat()}{settings.SECRET_KEY}".encode()).hexdigest()[:16]
            
            # Link to home page
            home_link = f"{request.build_absolute_uri('/')}home"
            
            try:
                html_message = render_to_string('alert_email.html', {
                    'user': user,
                    'subject': subject,
                    'message': message,
                    'home_link': home_link,
                })
                plain_message = f"{message}\n\nקישור לעמוד הבית: {home_link}"
            except:
                html_message = None
                plain_message = f"{message}\n\nקישור לעמוד הבית: {home_link}"
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            sent_count += 1
        except Exception as e:
            print(f"Error sending alert to {email}: {e}")
    
    return Response({
        'message': f'Alert sent to {sent_count} recipients.',
        'recipients_count': sent_count,
        'total_recipients': len(recipients)
    }, status=status.HTTP_200_OK)


# ==================== Health Check ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check_view(request):
    """
    Health check endpoint.
    """
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)

# ==================== ViewSets ====================

class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User model"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Regular users see only themselves
        if not (self.request.user.is_staff or hasattr(self.request.user, 'profile') and self.request.user.profile.is_manager()):
            queryset = queryset.filter(id=self.request.user.id)
        return queryset
    
    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Get current user's profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='approved')
    def approved(self, request):
        """List all approved users"""
        if not (request.user.is_staff or hasattr(request.user, 'profile') and request.user.profile.is_manager()):
            return Response({
                'error': 'Only staff members and managers can view approved users.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        users = User.objects.filter(is_approved=True).select_related('profile', 'profile__unit')
        
        # Filter by role and unit hierarchy
        if hasattr(request.user, 'profile') and request.user.profile.unit and not request.user.is_staff:
            user_role = request.user.profile.role
            user_unit = request.user.profile.unit
            
            # System manager and unit manager see all users (no filtering)
            if user_role in ['system_manager', 'unit_manager']:
                # No filtering - see all users
                pass
            elif user_role == 'section_manager':
                # Section manager sees only users in their section (not descendants)
                unit_user_ids = Profile.objects.filter(unit=user_unit).values_list('user_id', flat=True)
                users = users.filter(id__in=unit_user_ids)
            elif user_role == 'team_manager':
                # Team manager sees only users in their team (not descendants)
                unit_user_ids = Profile.objects.filter(unit=user_unit).values_list('user_id', flat=True)
                users = users.filter(id__in=unit_user_ids)
            else:
                # Other managers (branch_manager) see their unit and descendants
                descendant_units = user_unit.get_descendants()
                all_units = [user_unit] + descendant_units
                unit_user_ids = Profile.objects.filter(unit__in=all_units).values_list('user_id', flat=True)
                users = users.filter(id__in=unit_user_ids)
        
        serializer = UserSerializer(users.order_by('-date_joined'), many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['patch'], url_path='update-permissions')
    def update_permissions(self, request, pk=None):
        """Update user permissions (role and unit)"""
        if not (request.user.is_staff or hasattr(request.user, 'profile') and request.user.profile.is_manager()):
            return Response({
                'error': 'Only staff members and managers can update user permissions.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = self.get_object()
        except User.DoesNotExist:
            return Response({
                'error': 'User not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create profile
        profile, created = Profile.objects.get_or_create(user=user)
        
        # Update role if provided
        if 'role' in request.data:
            profile.role = request.data['role']
        
        # Update unit if provided
        if 'unit_id' in request.data:
            unit_id = request.data['unit_id']
            if unit_id:
                try:
                    unit = Unit.objects.get(id=unit_id)
                    profile.unit = unit
                except Unit.DoesNotExist:
                    return Response({
                        'error': 'Unit does not exist.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                profile.unit = None
        
        profile.save()
        
        serializer = UserSerializer(user)
        return Response({
            'message': 'User permissions updated successfully.',
            'user': serializer.data
        }, status=status.HTTP_200_OK)


class ProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for Profile model"""
    queryset = Profile.objects.select_related('user', 'unit').all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Regular users see only their own profile
        if not (self.request.user.is_staff or hasattr(self.request.user, 'profile') and self.request.user.profile.is_manager()):
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    def perform_update(self, serializer):
        profile = serializer.instance
        user = profile.user
        
        # Update user fields from request data if present
        user_data = self.request.data
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        if 'phone' in user_data:
            user.phone = user_data['phone']
        if 'email' in user_data:
            user.email = user_data['email']
        user.save()
        
        serializer.save()


class UnitViewSet(viewsets.ModelViewSet):
    """ViewSet for Unit model"""
    queryset = Unit.objects.prefetch_related('children', 'members').all()
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of a unit"""
        unit = self.get_object()
        members = Profile.objects.filter(unit=unit).select_related('user')
        serializer = ProfileSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='by-parent')
    def by_parent(self, request):
        """Get units by parent ID and/or unit type"""
        parent_id = request.query_params.get('parent_id', None)
        unit_type = request.query_params.get('unit_type', None)
        
        queryset = Unit.objects.all()
        
        # Filter by parent
        if parent_id == '' or parent_id is None:
            # Get root units (no parent)
            queryset = queryset.filter(parent__isnull=True)
        elif parent_id:
            try:
                parent_id_int = int(parent_id)
                queryset = queryset.filter(parent_id=parent_id_int)
            except ValueError:
                return Response({
                    'error': 'Invalid parent_id parameter'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Filter by unit type
        if unit_type:
            queryset = queryset.filter(unit_type=unit_type)
        
        # Order by order_number and name
        queryset = queryset.order_by('order_number', 'name')
        
        serializer = UnitSerializer(queryset, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        }, status=status.HTTP_200_OK)


class LocationPagination(PageNumberPagination):
    """Custom pagination for locations - allows large page sizes"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 10000  # Allow up to 10,000 locations per page


class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Location model (cities, towns, kibbutzim)"""
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [AllowAny]  # Anyone can view locations
    pagination_class = LocationPagination  # Use custom pagination
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Optional filtering by type
        location_type = self.request.query_params.get('type', None)
        if location_type:
            queryset = queryset.filter(location_type=location_type)
        # Optional search by name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(name_he__icontains=search))
        # Order by Hebrew name for better user experience
        return queryset.order_by('name_he', 'name')


class AvailabilityReportViewSet(viewsets.ModelViewSet):
    """ViewSet for AvailabilityReport model"""
    queryset = AvailabilityReport.objects.select_related('user').all()
    serializer_class = AvailabilityReportSerializer
    permission_classes = [IsApproved]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Regular users see only their own reports
        if not (self.request.user.is_staff or hasattr(self.request.user, 'profile') and self.request.user.profile.is_manager()):
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AccessRequestViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for AccessRequest model (read-only, use custom actions for approve/reject)"""
    queryset = AccessRequest.objects.select_related('user', 'approved_by').all()
    serializer_class = AccessRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if not (self.request.user.is_staff or hasattr(self.request.user, 'profile') and self.request.user.profile.is_manager()):
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve access request"""
        return approve_access_request_view(request, pk)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject access request"""
        return reject_access_request_view(request, pk)

