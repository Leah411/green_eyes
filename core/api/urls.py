from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    # Authentication
    register_view,
    login_view,
    request_otp_view,
    verify_otp_view,
    # Access Requests
    list_access_requests_view,
    approve_access_request_view,
    reject_access_request_view,
    # Reports
    list_reports_view,
    create_report_view,
    export_reports_view,
    # Alerts
    send_alert_view,
    # Health
    health_check_view,
    # ViewSets
    UserViewSet,
    ProfileViewSet,
    UnitViewSet,
    LocationViewSet,
    AvailabilityReportViewSet,
    AccessRequestViewSet,
)

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')
router.register('profiles', ProfileViewSet, basename='profile')
router.register('units', UnitViewSet, basename='unit')
router.register('locations', LocationViewSet, basename='location')
router.register('reports', AvailabilityReportViewSet, basename='report')
router.register('access-requests', AccessRequestViewSet, basename='access-request')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', register_view, name='register'),
    path('auth/login/', login_view, name='login'),
    path('auth/request-otp/', request_otp_view, name='request-otp'),
    path('auth/verify-otp/', verify_otp_view, name='verify-otp'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Access Request endpoints
    path('access-requests/', list_access_requests_view, name='list-access-requests'),
    path('access-requests/<int:request_id>/approve/', approve_access_request_view, name='approve-access-request'),
    path('access-requests/<int:request_id>/reject/', reject_access_request_view, name='reject-access-request'),
    
    # Reports endpoints
    path('reports/', list_reports_view, name='list-reports'),
    path('reports/create/', create_report_view, name='create-report'),
    path('reports/export/', export_reports_view, name='export-reports'),
    
    # Alerts endpoint
    path('alerts/send/', send_alert_view, name='send-alert'),
    
    # Health check
    path('health/', health_check_view, name='health-check'),
    
    # Router URLs (ViewSets)
    path('', include(router.urls)),
]
