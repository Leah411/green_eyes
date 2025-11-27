from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone
from django.http import HttpResponse
import csv
from .models import User, Unit, Profile, Location, AvailabilityReport, AccessRequest, OTPToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone', 'is_approved', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_approved', 'is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone', 'is_approved')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('phone', 'is_approved')}),
    )
    actions = ['approve_users', 'export_users']
    
    @admin.action(description='Approve selected users')
    def approve_users(self, request, queryset):
        """Bulk approve users"""
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} users approved successfully.')
    
    @admin.action(description='Export selected users to CSV')
    def export_users(self, request, queryset):
        """Export users to CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="users_export.csv"'
        writer = csv.writer(response)
        writer.writerow(['Username', 'Email', 'First Name', 'Last Name', 'Phone', 'Is Approved', 'Date Joined'])
        for user in queryset:
            writer.writerow([
                user.username, user.email, user.first_name, user.last_name,
                user.phone, user.is_approved, user.date_joined
            ])
        return response


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_he', 'unit_type', 'parent', 'code', 'created_at')
    list_filter = ('unit_type', 'parent', 'created_at')
    search_fields = ('name', 'name_he', 'code')
    raw_id_fields = ('parent',)
    readonly_fields = ('created_at', 'updated_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('parent')


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_he', 'location_type', 'region', 'created_at')
    list_filter = ('location_type', 'region', 'created_at')
    search_fields = ('name', 'name_he', 'region')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'unit', 'role', 'id_number', 'created_at')
    list_filter = ('role', 'unit', 'created_at')
    search_fields = ('user__username', 'user__email', 'id_number')
    raw_id_fields = ('user', 'unit')
    readonly_fields = ('created_at', 'updated_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'unit')


@admin.register(AvailabilityReport)
class AvailabilityReportAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'status', 'location', 'submitted_at', 'updated_at')
    list_filter = ('status', 'date', 'location', 'submitted_at')
    search_fields = ('user__username', 'user__email', 'notes', 'location__name')
    date_hierarchy = 'date'
    readonly_fields = ('submitted_at', 'updated_at')
    raw_id_fields = ('user', 'location')
    actions = ['export_reports']
    
    @admin.action(description='Export selected reports to CSV')
    def export_reports(self, request, queryset):
        """Export reports to CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="reports_export.csv"'
        writer = csv.writer(response)
        writer.writerow(['User', 'Email', 'Date', 'Status', 'Notes', 'Submitted At'])
        for report in queryset:
            writer.writerow([
                report.user.username, report.user.email, report.date,
                report.get_status_display(), report.notes, report.submitted_at
            ])
        return response
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(AccessRequest)
class AccessRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'submitted_at', 'approved_by', 'approved_at')
    list_filter = ('status', 'submitted_at', 'approved_at')
    search_fields = ('user__username', 'user__email', 'rejection_reason')
    date_hierarchy = 'submitted_at'
    readonly_fields = ('submitted_at',)
    raw_id_fields = ('user', 'approved_by')
    actions = ['approve_requests', 'reject_requests']
    
    @admin.action(description='Approve selected access requests')
    def approve_requests(self, request, queryset):
        """Bulk approve access requests"""
        from core.api.views import send_approval_notification, generate_otp_token, send_otp_email
        from datetime import timedelta
        from django.conf import settings
        
        count = 0
        for access_request in queryset.filter(status='pending'):
            access_request.approve(request.user)
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
            if not email_sent:
                import logging
                logger = logging.getLogger('core')
                logger.error(f"Failed to send OTP email to {access_request.user.email}: {error_msg}")
            count += 1
        
        self.message_user(request, f'{count} access requests approved successfully.')
    
    @admin.action(description='Reject selected access requests')
    def reject_requests(self, request, queryset):
        """Bulk reject access requests"""
        count = queryset.filter(status='pending').update(
            status='rejected',
            approved_by=request.user,
            approved_at=timezone.now()
        )
        self.message_user(request, f'{count} access requests rejected.')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'approved_by')


@admin.register(OTPToken)
class OTPTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'purpose', 'created_at', 'expires_at', 'used', 'is_valid_display')
    list_filter = ('used', 'purpose', 'created_at', 'expires_at')
    search_fields = ('user__username', 'user__email', 'token')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    raw_id_fields = ('user',)
    
    def is_valid_display(self, obj):
        """Display if OTP is still valid"""
        return obj.is_valid()
    is_valid_display.boolean = True
    is_valid_display.short_description = 'Is Valid'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
