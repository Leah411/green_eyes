"""
Supabase Client initialization and helper functions.
This module provides a singleton Supabase client instance.
"""
import os
import logging
from supabase import create_client, Client

logger = logging.getLogger('core')

# Global Supabase client instance
_supabase_client: Client = None


def get_supabase_client() -> Client:
    """
    Get or create Supabase client instance (singleton pattern).
    Uses SUPABASE_URL and SUPABASE_KEY from environment variables.
    """
    global _supabase_client
    
    if _supabase_client is None:
        supabase_url = os.getenv('SUPABASE_URL', 'https://fhikehkuookglfjomxen.supabase.co')
        supabase_key = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoaWtlaGt1b29rZ2xmam9teGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODgzMjQsImV4cCI6MjA3OTQ2NDMyNH0.0bWareYYdHxMh2VCZNbO3He3OoGg1K4QLZtjbgFM55g')
        
        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY must be set in environment variables. "
                f"Got URL: {supabase_url}, Key: {'*' * len(supabase_key) if supabase_key else 'None'}"
            )
        
        try:
            _supabase_client = create_client(supabase_url, supabase_key)
            logger.info(f"[SUPABASE] Client initialized successfully with URL: {supabase_url}")
        except Exception as e:
            logger.error(f"[SUPABASE] Failed to create client: {e}")
            raise
    
    return _supabase_client


def test_connection():
    """
    Test Supabase connection by making a simple query.
    """
    try:
        client = get_supabase_client()
        # Try to query a table (this will fail if connection is bad)
        # We'll use a simple query to test
        result = client.table('core_user').select('id').limit(1).execute()
        logger.info(f"[SUPABASE] Connection test successful")
        return True
    except Exception as e:
        logger.error(f"[SUPABASE] Connection test failed: {e}")
        return False

