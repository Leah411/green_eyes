from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator


class User(AbstractUser):
    """Custom User model with approval workflow"""
    is_approved = models.BooleanField(default=False, help_text="User must be approved by admin to access system")
    phone = models.CharField(
        max_length=30, 
        blank=True,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.username} ({self.email})"


class Unit(models.Model):
    """Organizational unit with tree structure (Unit → Branch → Section → Team)"""
    UNIT_TYPE_CHOICES = [
        ('unit', 'Unit'),
        ('branch', 'Branch'),
        ('section', 'Section'),
        ('team', 'Team'),
    ]
    
    name = models.CharField(max_length=200, db_index=True)
    name_he = models.CharField(max_length=200, blank=True, help_text="Hebrew name")
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    unit_type = models.CharField(max_length=20, choices=UNIT_TYPE_CHOICES, default='unit')
    code = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="Unique organizational code")
    order_number = models.IntegerField(default=0, help_text="Order for sorting siblings")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Unit"
        verbose_name_plural = "Units"
        ordering = ['order_number', 'name']
        indexes = [
            models.Index(fields=['parent', 'unit_type']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_unit_type_display()})"
    
    def get_ancestors(self):
        """Get all ancestor units"""
        ancestors = []
        current = self.parent
        while current:
            ancestors.append(current)
            current = current.parent
        return ancestors
    
    def get_descendants(self):
        """Get all descendant units"""
        descendants = []
        for child in self.children.all():
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants


class Profile(models.Model):
    """Extended user profile with organizational role and unit assignment"""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('team_manager', 'Team Manager'),
        ('section_manager', 'Section Manager'),
        ('branch_manager', 'Branch Manager'),
        ('unit_manager', 'Unit Manager'),
        ('admin', 'Admin'),
        ('system_manager', 'System Manager'),
    ]
    
    SERVICE_TYPE_CHOICES = [
        ('חובה', 'חובה'),
        ('קבע', 'קבע'),
        ('יועץ', 'יועץ'),
        ('אעצ', 'אעצ'),
        ('מילואים', 'מילואים'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    unit = models.ForeignKey(Unit, null=True, blank=True, on_delete=models.SET_NULL, related_name='members')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='user')
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES, blank=True, help_text="סוג שירות")
    address = models.CharField(max_length=200, blank=False, help_text="כתובת מגורים")
    city = models.ForeignKey('Location', null=False, blank=False, on_delete=models.PROTECT, related_name='residents', help_text="עיר מגורים")
    contact_name = models.CharField(max_length=100, blank=True, help_text="שם איש קשר")
    contact_phone = models.CharField(max_length=20, blank=True, help_text="טלפון איש קשר")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profiles"
        indexes = [
            models.Index(fields=['unit', 'role']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()} @ {self.unit.name if self.unit else 'No Unit'}"
    
    def is_manager(self):
        """Check if user has any manager role"""
        return self.role in ['team_manager', 'section_manager', 'branch_manager', 'unit_manager', 'admin', 'system_manager']


class Location(models.Model):
    """Cities, towns, and settlements in Israel"""
    LOCATION_TYPE_CHOICES = [
        ('city', 'עיר'),
        ('town', 'ישוב'),
        ('kibbutz', 'קיבוץ'),
        ('moshav', 'מושב'),
    ]
    
    name = models.CharField(max_length=200, db_index=True, help_text="שם העיר/הישוב")
    name_he = models.CharField(max_length=200, blank=True, help_text="שם בעברית")
    location_type = models.CharField(max_length=20, choices=LOCATION_TYPE_CHOICES, default='city')
    region = models.CharField(max_length=100, blank=True, help_text="אזור (צפון, מרכז, דרום וכו')")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "מיקום"
        verbose_name_plural = "מיקומים"
        ordering = ['name']
        indexes = [
            models.Index(fields=['name', 'location_type']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_location_type_display()})"


class AvailabilityReport(models.Model):
    """User availability report submission"""
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('unavailable', 'Unavailable'),
        ('partial', 'Partial Availability'),
        ('pending', 'Pending'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='availability_reports')
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    location = models.ForeignKey(Location, null=True, blank=True, on_delete=models.SET_NULL, related_name='reports', help_text="מיקום (עיר/ישוב/קיבוץ)")
    location_text = models.CharField(max_length=200, blank=True, help_text="מיקום טקסטואלי (בסיס, בית, או מיקום אחר)")
    notes = models.TextField(blank=True, help_text="Additional notes or comments")
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Availability Report"
        verbose_name_plural = "Availability Reports"
        ordering = ['-date', '-submitted_at']
        unique_together = [['user', 'date']]  # One report per user per day
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['date', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.get_status_display()}"


class AccessRequest(models.Model):
    """User access request requiring admin approval"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='access_requests')
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    approved_by = models.ForeignKey(
        User, 
        null=True, 
        blank=True, 
        related_name='approved_requests', 
        on_delete=models.SET_NULL
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending', db_index=True)
    rejection_reason = models.TextField(blank=True, help_text="Reason for rejection if applicable")
    
    class Meta:
        verbose_name = "Access Request"
        verbose_name_plural = "Access Requests"
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['status', 'submitted_at']),
        ]
    
    def __str__(self):
        return f"Access Request #{self.id} - {self.user.username} - {self.get_status_display()}"
    
    def approve(self, approver):
        """Approve the access request"""
        self.status = 'approved'
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.save()
        # Update user approval status
        self.user.is_approved = True
        self.user.save()
    
    def reject(self, approver, reason=''):
        """Reject the access request"""
        self.status = 'rejected'
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.rejection_reason = reason
        self.save()


class OTPToken(models.Model):
    """OTP token for email verification and login"""
    PURPOSE_CHOICES = [
        ('login', 'Login'),
        ('email_confirm', 'Email Confirmation'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_tokens')
    token = models.CharField(max_length=6, db_index=True)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='login')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    used = models.BooleanField(default=False, db_index=True)
    
    class Meta:
        verbose_name = "OTP Token"
        verbose_name_plural = "OTP Tokens"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'used', 'expires_at']),
            models.Index(fields=['token', 'used']),
        ]
    
    def __str__(self):
        return f"OTP {self.token} for {self.user.username} ({self.get_purpose_display()})"
    
    def is_valid(self):
        """Check if OTP is still valid (not used and not expired)"""
        return not self.used and self.expires_at > timezone.now()
    
    def mark_as_used(self):
        """Mark OTP as used"""
        self.used = True
        self.save()
