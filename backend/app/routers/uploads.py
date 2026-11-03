"""
routers/uploads.py — Secure file uploads to Supabase Storage buckets for PerformaCOS.
"""
import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from .. import models, schemas
from ..auth import get_current_user
from ..storage_service import upload_file, get_file_url

router = APIRouter(prefix="/api/uploads", tags=["File Uploads"])

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_DOC_SIZE = 25 * 1024 * 1024    # 25 MB

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_DOC_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


async def _handle_upload(
    file: UploadFile,
    bucket: str,
    user_id: int,
    allowed_types: set,
    max_size: int,
) -> schemas.FileUploadResponse:
    content_type = file.content_type or "application/octet-stream"
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{content_type}'. Allowed: {', '.join(allowed_types)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size ({max_size // (1024 * 1024)} MB).",
        )

    # Sanitize and randomize path: {user_id}/{uuid}_{clean_filename}
    clean_name = file.filename.replace(" ", "_") if file.filename else "file"
    storage_path = f"{user_id}/{uuid.uuid4().hex[:12]}_{clean_name}"

    uploaded = upload_file(bucket, storage_path, file_bytes, content_type)
    if not uploaded:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file to storage bucket '{bucket}'.",
        )

    url = get_file_url(bucket, storage_path)
    return schemas.FileUploadResponse(url=url or "", path=storage_path, bucket=bucket)


@router.post("/dar-photo", response_model=schemas.FileUploadResponse)
async def upload_dar_photo(
    file: UploadFile = File(...),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Uploads photo evidence for a Daily Accomplishment Report (public dar-photos bucket)."""
    return await _handle_upload(
        file=file,
        bucket="dar-photos",
        user_id=current_user.id,
        allowed_types=ALLOWED_IMAGE_TYPES,
        max_size=MAX_IMAGE_SIZE,
    )


@router.post("/avatar", response_model=schemas.FileUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Uploads profile picture avatar (public avatars bucket)."""
    return await _handle_upload(
        file=file,
        bucket="avatars",
        user_id=current_user.id,
        allowed_types=ALLOWED_IMAGE_TYPES,
        max_size=MAX_IMAGE_SIZE,
    )


@router.post("/loi", response_model=schemas.FileUploadResponse)
async def upload_loi(
    file: UploadFile = File(...),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Uploads Letter of Intent (LOI) file (private loi-files bucket)."""
    return await _handle_upload(
        file=file,
        bucket="loi-files",
        user_id=current_user.id,
        allowed_types=ALLOWED_DOC_TYPES,
        max_size=MAX_DOC_SIZE,
    )


@router.post("/fast-track", response_model=schemas.FileUploadResponse)
async def upload_fast_track_doc(
    file: UploadFile = File(...),
    current_user: models.UserAccount = Depends(get_current_user),
):
    """Uploads fast-track misconduct supporting document (private fast-track-docs bucket)."""
    return await _handle_upload(
        file=file,
        bucket="fast-track-docs",
        user_id=current_user.id,
        allowed_types=ALLOWED_DOC_TYPES,
        max_size=MAX_DOC_SIZE,
    )
