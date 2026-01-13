"""
Helper functions for Supabase operations.
This module provides wrapper functions to use Supabase Client SDK instead of Django ORM.
"""
import logging
from typing import Optional, Dict, List, Any
from core.supabase_client import get_supabase_client

logger = logging.getLogger('core')


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Get user by email using Supabase Client SDK.
    Returns user dict or None if not found.
    """
    try:
        client = get_supabase_client()
        result = client.table('core_user').select('*').eq('email', email).limit(1).execute()
        
        if result.data and len(result.data) > 0:
            user = result.data[0]
            logger.debug(f"[SUPABASE] User found: {user.get('email')}, ID: {user.get('id')}")
            return user
        else:
            logger.debug(f"[SUPABASE] User not found with email: {email}")
            return None
    except Exception as e:
        logger.error(f"[SUPABASE] Error getting user by email {email}: {e}", exc_info=True)
        return None


def get_all_users(limit: int = 100) -> List[Dict[str, Any]]:
    """
    Get all users using Supabase Client SDK.
    Returns list of user dicts.
    """
    try:
        client = get_supabase_client()
        result = client.table('core_user').select('*').limit(limit).execute()
        
        users = result.data if result.data else []
        logger.debug(f"[SUPABASE] Found {len(users)} users")
        return users
    except Exception as e:
        logger.error(f"[SUPABASE] Error getting all users: {e}", exc_info=True)
        return []


def create_user(user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Create user using Supabase Client SDK.
    Returns created user dict or None if failed.
    """
    try:
        client = get_supabase_client()
        result = client.table('core_user').insert(user_data).execute()
        
        if result.data and len(result.data) > 0:
            user = result.data[0]
            logger.info(f"[SUPABASE] User created: {user.get('email')}, ID: {user.get('id')}")
            return user
        else:
            logger.error(f"[SUPABASE] User creation returned no data")
            return None
    except Exception as e:
        logger.error(f"[SUPABASE] Error creating user: {e}", exc_info=True)
        return None


def update_user(user_id: int, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update user using Supabase Client SDK.
    Returns updated user dict or None if failed.
    """
    try:
        client = get_supabase_client()
        result = client.table('core_user').update(user_data).eq('id', user_id).execute()
        
        if result.data and len(result.data) > 0:
            user = result.data[0]
            logger.info(f"[SUPABASE] User updated: {user.get('email')}, ID: {user.get('id')}")
            return user
        else:
            logger.error(f"[SUPABASE] User update returned no data")
            return None
    except Exception as e:
        logger.error(f"[SUPABASE] Error updating user {user_id}: {e}", exc_info=True)
        return None


def count_users() -> int:
    """
    Count users using Supabase Client SDK.
    Returns count of users.
    """
    try:
        client = get_supabase_client()
        # Supabase doesn't have direct count, so we select and count
        result = client.table('core_user').select('id', count='exact').execute()
        count = result.count if hasattr(result, 'count') else len(result.data) if result.data else 0
        logger.debug(f"[SUPABASE] User count: {count}")
        return count
    except Exception as e:
        logger.error(f"[SUPABASE] Error counting users: {e}", exc_info=True)
        return 0

