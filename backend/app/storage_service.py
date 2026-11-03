"""
storage_service.py — Supabase Storage client for PerformaCOS file uploads.
"""
from typing import Optional
from supabase import create_client, Client
from .config import settings

PUBLIC_BUCKETS = {"avatars", "dar-photos"}
PRIVATE_BUCKETS = {"loi-files", "fast-track-docs"}
BUCKETS = list(PUBLIC_BUCKETS | PRIVATE_BUCKETS)


def get_storage_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def ensure_buckets_exist():
    """Creates Storage buckets if they don't already exist. Called once on startup."""
    client = get_storage_client()
    existing = [b.name for b in client.storage.list_buckets()]
    for bucket in BUCKETS:
        is_public = bucket in PUBLIC_BUCKETS
        if bucket not in existing:
            client.storage.create_bucket(bucket, options={"public": is_public})
            print(f"[storage] Created bucket: {bucket} (public={is_public})")
        else:
            client.storage.update_bucket(bucket, options={"public": is_public})


def upload_file(
    bucket: str,
    path: str,
    file_bytes: bytes,
    content_type: str = "application/octet-stream",
) -> Optional[str]:
    """Upload bytes to a Supabase Storage bucket. Returns the file path or URL."""
    try:
        client = get_storage_client()
        client.storage.from_(bucket).upload(
            path=path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return path
    except Exception as e:
        print(f"[storage] Upload failed ({bucket}/{path}): {e}")
        return None


def get_file_url(bucket: str, path: str, expires_in: int = 86400 * 7) -> Optional[str]:
    """
    Returns public URL for public buckets (avatars, dar-photos)
    or a 7-day signed URL for private buckets (loi-files, fast-track-docs).
    """
    client = get_storage_client()
    try:
        if bucket in PUBLIC_BUCKETS:
            return client.storage.from_(bucket).get_public_url(path)
        else:
            result = client.storage.from_(bucket).create_signed_url(path, expires_in)
            return result.get("signedURL")
    except Exception as e:
        print(f"[storage] Error getting URL ({bucket}/{path}): {e}")
        return None


def delete_file(bucket: str, path: str) -> bool:
    try:
        client = get_storage_client()
        client.storage.from_(bucket).remove([path])
        return True
    except Exception as e:
        print(f"[storage] Delete failed ({bucket}/{path}): {e}")
        return False
