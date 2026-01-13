"""
WSGI config for yirok_project project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os
import logging

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yirok_project.settings')

application = get_wsgi_application()

# Initialize logger after Django setup
logger = logging.getLogger('django')

# Test database connection at startup
logger.info("[STARTUP] ========================================")
logger.info("[STARTUP] Green Eyes API Server Starting...")
logger.info("[STARTUP] ========================================")

try:
    from django.db import connection
    from django.conf import settings
    
    # Log database configuration
    db_config = settings.DATABASES['default']
    logger.info(f"[STARTUP] Database Engine: {db_config.get('ENGINE', 'unknown')}")
    logger.info(f"[STARTUP] Database Host: {db_config.get('HOST', 'unknown')}")
    logger.info(f"[STARTUP] Database Port: {db_config.get('PORT', 'unknown')}")
    logger.info(f"[STARTUP] Database Name: {db_config.get('NAME', 'unknown')}")
    logger.info(f"[STARTUP] Database User: {db_config.get('USER', 'unknown')}")
    
    # Test basic connection
    logger.info("[STARTUP] Testing database connection...")
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        logger.info(f"[STARTUP] ✓ Database connection successful (test query returned: {result})")
        
        # Get PostgreSQL version
        cursor.execute("SELECT version()")
        pg_version = cursor.fetchone()
        if pg_version:
            version_str = pg_version[0].split(',')[0]  # Get first part
            logger.info(f"[STARTUP] Database Version: {version_str}")
        
        # Check if core tables exist
        try:
            cursor.execute("SELECT COUNT(*) FROM core_user")
            user_count = cursor.fetchone()[0]
            logger.info(f"[STARTUP] ✓ core_user table exists: {user_count} users")
            
            cursor.execute("SELECT COUNT(*) FROM core_profile")
            profile_count = cursor.fetchone()[0]
            logger.info(f"[STARTUP] ✓ core_profile table exists: {profile_count} profiles")
            
            cursor.execute("SELECT COUNT(*) FROM core_unit")
            unit_count = cursor.fetchone()[0]
            logger.info(f"[STARTUP] ✓ core_unit table exists: {unit_count} units")
            
            cursor.execute("SELECT COUNT(*) FROM core_otptoken")
            otp_count = cursor.fetchone()[0]
            logger.info(f"[STARTUP] ✓ core_otptoken table exists: {otp_count} tokens")
            
        except Exception as table_error:
            logger.warning(f"[STARTUP] Some tables may not exist yet: {table_error}")
            logger.warning("[STARTUP] This is normal if migrations haven't run yet")
    
    logger.info("[STARTUP] ========================================")
    logger.info("[STARTUP] ✓ API Server is READY and HEALTHY")
    logger.info("[STARTUP] ========================================")
    
except Exception as e:
    logger.error("[STARTUP] ========================================")
    logger.error(f"[STARTUP] ✗ Database connection FAILED: {e}")
    logger.error("[STARTUP] ========================================")
    logger.error(f"[STARTUP] Error type: {type(e).__name__}")
    logger.error(f"[STARTUP] Error details: {str(e)}")
    
    # Log additional debug info
    try:
        from django.conf import settings
        db_config = settings.DATABASES['default']
        logger.error(f"[STARTUP] Attempted connection to: {db_config.get('USER')}@{db_config.get('HOST')}:{db_config.get('PORT')}/{db_config.get('NAME')}")
    except:
        pass
    
    logger.error("[STARTUP] Server will start but database operations will fail")
    logger.error("[STARTUP] Please check environment variables and database credentials")
    logger.error("[STARTUP] ========================================")
