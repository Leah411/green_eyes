from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import AccessRequest


@receiver(pre_save, sender=AccessRequest)
def send_otp_on_approval(sender, instance, **kwargs):
    """
    Signal to automatically send OTP when AccessRequest status changes to 'approved'.
    """
    if instance.pk:  # Only for existing instances (updates)
        try:
            old_instance = AccessRequest.objects.get(pk=instance.pk)
            # Check if status is changing to 'approved'
            if old_instance.status != 'approved' and instance.status == 'approved' and instance.approved_by:
                # Import here to avoid circular import
                from core.api.views import generate_otp_token, send_otp_email, check_otp_rate_limit
                from core.models import OTPToken
                from django.utils import timezone
                from datetime import timedelta
                from django.conf import settings
                
                # Check rate limit
                if check_otp_rate_limit(instance.user):
                    # Generate OTP
                    otp_token = generate_otp_token()
                    expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
                    
                    # Create OTP record
                    OTPToken.objects.create(
                        user=instance.user,
                        token=otp_token,
                        purpose='login',
                        expires_at=expires_at
                    )
                    
                    # Send email (ignore errors in signal to avoid breaking the approval process)
                    email_sent, error_msg = send_otp_email(instance.user, otp_token, purpose='login')
                    if not email_sent:
                        import logging
                        logger = logging.getLogger('core')
                        logger.error(f"Failed to send OTP email in signal: {error_msg}")
        except AccessRequest.DoesNotExist:
            pass

