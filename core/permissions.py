from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.contrib.auth import get_user_model

User = get_user_model()


class IsApproved(BasePermission):
    """
    Permission class to check if user is authenticated and approved.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.is_approved
        )


class IsRole(BasePermission):
    """
    Permission class to check if user has a specific role.
    Usage: permission_classes = [IsRole('unit_manager')]
    """
    def __init__(self, role_name):
        self.role_name = role_name
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'profile'):
            return False
        
        return request.user.profile.role == self.role_name


class IsManager(BasePermission):
    """
    Permission class to check if user has any manager role.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'profile'):
            return False
        
        return request.user.profile.is_manager()


class IsUnitManager(BasePermission):
    """
    Permission class to check if user is a unit manager or admin.
    Also checks if user manages the specific unit (for object-level permissions).
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'profile'):
            return False
        
        profile = request.user.profile
        return profile.role in ['unit_manager', 'admin', 'system_manager'] or request.user.is_superuser
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user manages the unit associated with the object.
        For AvailabilityReport, check if user manages the report's user's unit.
        For Unit, check if user manages that unit or its parent.
        """
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'profile'):
            return False
        
        profile = request.user.profile
        
        # Admin, system_manager and superuser have access to everything
        if profile.role in ['admin', 'system_manager'] or request.user.is_superuser:
            return True
        
        # Unit managers can access their unit and all descendants
        if profile.role == 'unit_manager' and profile.unit:
            user_unit = profile.unit
            
            # If object is a Unit, check if it's the user's unit or a descendant
            if hasattr(obj, 'unit_type'):
                return obj == user_unit or obj in user_unit.get_descendants()
            
            # If object has a user (like AvailabilityReport), check user's unit
            if hasattr(obj, 'user') and hasattr(obj.user, 'profile'):
                obj_unit = obj.user.profile.unit
                if obj_unit:
                    return obj_unit == user_unit or obj_unit in user_unit.get_descendants()
            
            # If object has a unit field directly
            if hasattr(obj, 'unit'):
                obj_unit = obj.unit
                if obj_unit:
                    return obj_unit == user_unit or obj_unit in user_unit.get_descendants()
        
        return False


class IsBranchManager(BasePermission):
    """
    Permission class for branch managers.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'profile'):
            return False
        
        profile = request.user.profile
        return profile.role in ['branch_manager', 'unit_manager', 'admin', 'system_manager'] or request.user.is_superuser


class IsSectionManager(BasePermission):
    """
    Permission class for section managers.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'profile'):
            return False
        
        profile = request.user.profile
        return profile.role in ['section_manager', 'branch_manager', 'unit_manager', 'admin', 'system_manager'] or request.user.is_superuser


class IsTeamManager(BasePermission):
    """
    Permission class for team managers.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'profile'):
            return False
        
        profile = request.user.profile
        return profile.role in ['team_manager', 'section_manager', 'branch_manager', 'unit_manager', 'admin', 'system_manager'] or request.user.is_superuser

