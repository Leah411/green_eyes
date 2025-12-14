from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from datetime import timedelta
from core.models import (
    User, 
    Profile, 
    Unit, 
    Location,
    AvailabilityReport, 
    AccessRequest, 
    OTPToken
)
from django.conf import settings

User = get_user_model()


class LocationSerializer(serializers.ModelSerializer):
    """Serializer for Location model"""
    location_type_display = serializers.CharField(source='get_location_type_display', read_only=True)
    
    class Meta:
        model = Location
        fields = [
            'id', 'name', 'name_he', 'location_type', 'location_type_display',
            'region', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UnitSerializer(serializers.ModelSerializer):
    """Serializer for Unit model"""
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Unit
        fields = [
            'id', 'name', 'name_he', 'parent', 'parent_name',
            'unit_type', 'code', 'created_at', 'updated_at', 'children_count'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_children_count(self, obj):
        return obj.children.count()


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for Profile model"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_name_he = serializers.CharField(source='city.name_he', read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'user_username', 'user_email',
            'unit', 'unit_name', 'role', 'role_display',
            'id_number', 'address', 'city', 'city_name', 'city_name_he',
            'contact_name', 'contact_phone',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer"""
    profile = ProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'is_approved', 'is_staff', 'is_superuser',
            'date_joined', 'created_at', 'updated_at', 'profile'
        ]
        read_only_fields = [
            'id', 'is_approved', 'is_staff', 'is_superuser',
            'date_joined', 'created_at', 'updated_at'
        ]


class UserSignupSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True, 
        required=False,
        allow_blank=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=False,
        allow_blank=True,
        label='Confirm Password',
        style={'input_type': 'password'}
    )
    id_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    unit_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    role = serializers.ChoiceField(
        choices=Profile.ROLE_CHOICES,
        write_only=True,
        required=False,
        default='user'
    )
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    city_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    contact_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    contact_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone', 'id_number', 'unit_id', 'role',
            'address', 'city_id', 'contact_name', 'contact_phone'
        )
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'phone': {'required': False},
        }
    
    def validate_email(self, value):
        """Ensure email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, attrs):
        """Validate password match and unit exists"""
        password = attrs.get('password', '')
        password2 = attrs.get('password2', '')
        
        # Only validate password match if passwords are provided
        if password and password2 and password != password2:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        unit_id = attrs.get('unit_id')
        if unit_id:
            try:
                Unit.objects.get(id=unit_id)
            except Unit.DoesNotExist:
                raise serializers.ValidationError({"unit_id": "Unit does not exist."})
        
        city_id = attrs.get('city_id')
        if city_id:
            try:
                Location.objects.get(id=city_id)
            except Location.DoesNotExist:
                raise serializers.ValidationError({"city_id": "City does not exist."})
        
        return attrs
    
    def create(self, validated_data):
        """Create user, profile, and access request"""
        import secrets
        import string
        
        password = validated_data.pop('password', None)
        validated_data.pop('password2', None)
        id_number = validated_data.pop('id_number', '')
        unit_id = validated_data.pop('unit_id', None)
        role = validated_data.pop('role', 'user')
        address = validated_data.pop('address', '')
        city_id = validated_data.pop('city_id', None)
        contact_name = validated_data.pop('contact_name', '')
        contact_phone = validated_data.pop('contact_phone', '')
        
        # Get email and username
        email = validated_data.pop('email', '')
        username = validated_data.pop('username', None)
        if not username:
            # Use email prefix as username, or generate unique one
            username_base = email.split('@')[0]
            username = username_base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{username_base}{counter}"
                counter += 1
        
        # Generate random password if not provided
        if not password:
            # Generate a secure random password
            alphabet = string.ascii_letters + string.digits + string.punctuation
            password = ''.join(secrets.choice(alphabet) for i in range(16))
        
        # Create user with registration data
        # All data from registration form is saved here:
        # - User fields: first_name, last_name, phone, email
        user_data = {
            'username': username,
            'email': email,
            'password': password,
        }
        # Add other user fields from registration form
        for key in ['first_name', 'last_name', 'phone']:
            if key in validated_data:
                user_data[key] = validated_data[key]
        
        user = User.objects.create_user(**user_data)
        user.is_active = True
        user.is_approved = False  # Requires admin approval
        user.save()
        
        # Create profile with all registration data
        # All data from registration form is saved here:
        # - Profile fields: id_number, address, city, unit
        # These will be automatically transferred to the user's profile page after approval
        unit = Unit.objects.get(id=unit_id) if unit_id else None
        city = Location.objects.get(id=city_id) if city_id else None
        Profile.objects.create(
            user=user,
            unit=unit,
            role=role,
            id_number=id_number,
            address=address,
            city=city,
            contact_name=contact_name,
            contact_phone=contact_phone
        )
        
        # Create access request
        AccessRequest.objects.create(
            user=user,
            status='pending'
        )
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials.')
            
            user = authenticate(
                request=self.context.get('request'),
                username=user.username,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError('Invalid credentials.')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include "email" and "password".')
        
        return attrs


class OTPSerializer(serializers.Serializer):
    """Serializer for requesting OTP"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Ensure user exists and is approved"""
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        
        if not user.is_approved:
            raise serializers.ValidationError("User account is not approved yet.")
        
        return value


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for verifying OTP"""
    email = serializers.EmailField()
    token = serializers.CharField(max_length=6, min_length=6)
    
    def validate(self, attrs):
        email = attrs.get('email')
        token = attrs.get('token')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "User with this email does not exist."})
        
        # Find valid, unused OTP
        otp = OTPToken.objects.filter(
            user=user,
            token=token,
            used=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()
        
        if not otp:
            raise serializers.ValidationError({"token": "Invalid or expired OTP code."})
        
        attrs['user'] = user
        attrs['otp'] = otp
        return attrs


class AvailabilityReportSerializer(serializers.ModelSerializer):
    """Serializer for AvailabilityReport"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    
    class Meta:
        model = AvailabilityReport
        fields = [
            'id', 'user', 'user_username', 'user_email',
            'date', 'status', 'status_display', 'location', 'location_name',
            'location_text', 'notes', 'submitted_at', 'updated_at'
        ]
        read_only_fields = ['user', 'submitted_at', 'updated_at']
    
    def create(self, validated_data):
        """Set user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate_date(self, value):
        """Ensure date is not in the future"""
        if value > timezone.now().date():
            raise serializers.ValidationError("Date cannot be in the future.")
        return value


class AccessRequestSerializer(serializers.ModelSerializer):
    """Serializer for AccessRequest"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = AccessRequest
        fields = [
            'id', 'user', 'user_username', 'user_email',
            'user_first_name', 'user_last_name', 'user_phone',
            'submitted_at', 'status', 'status_display',
            'approved_by', 'approved_by_username',
            'approved_at', 'rejection_reason'
        ]
        read_only_fields = [
            'user', 'submitted_at', 'approved_by',
            'approved_at', 'status'
        ]


class AlertSendSerializer(serializers.Serializer):
    """Serializer for sending email alerts"""
    unit_id = serializers.IntegerField(required=False, allow_null=True)
    subject = serializers.CharField(max_length=200)
    message = serializers.CharField()
    send_to = serializers.ListField(
        child=serializers.ChoiceField(choices=['managers', 'users', 'all']),
        min_length=1
    )
    
    def validate_unit_id(self, value):
        """Ensure unit exists if provided"""
        if value:
            try:
                Unit.objects.get(id=value)
            except Unit.DoesNotExist:
                raise serializers.ValidationError("Unit does not exist.")
        return value
