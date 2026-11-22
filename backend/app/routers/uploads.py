"""
routers/uploads.py — Secure file uploads to Supabase Storage buckets for PerformaCOS.
"""
import os
import re
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
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_DOC_EXTENSIONS = {".pdf", ".doc", ".docx"}


def _validate_magic_bytes(file_bytes: bytes, bucket: str) -> None:
    """Inspects raw binary header bytes to prevent MIME/extension spoofing (SEC-02)."""
    if len(file_bytes) < 4:
        raise HTTPException(status_code=400, detail="Corrupt or invalid file content.")

    if bucket in ["dar-photos", "avatars"]:
        is_jpeg = file_bytes[:3] == b"\xff\xd8\xff"
        is_png = file_bytes[:8] == b"\x89PNG\r\n\x1a\n"
        is_webp = file_bytes[:4] == b"RIFF" and len(file_bytes) >= 12 and file_bytes[8:12] == b"WEBP"
        if not (is_jpeg or is_png or is_webp):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content signature does not match allowed image formats (JPEG, PNG, WEBP).",
            )
    elif bucket in ["fast-track-docs", "loi-files"]:
        is_pdf = file_bytes[:5] == b"%PDF-"
        is_docx = file_bytes[:4] == b"PK\x03\x04"
        is_doc = file_bytes[:4] == b"\xd0\xcf\x11\xe0"
        if not (is_pdf or is_docx or is_doc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document content signature does not match allowed document formats (PDF, DOCX).",
            )


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
            detail=f"Invalid MIME content type '{content_type}'. Allowed: {', '.join(allowed_types)}",
        )

    # SEC-02: Sanitize filename with os.path.basename and enforce extension whitelist
    raw_name = os.path.basename(file.filename or "upload")
    name_root, ext = os.path.splitext(raw_name)
    ext = ext.lower()

    allowed_exts = ALLOWED_IMAGE_EXTENSIONS if bucket in ["dar-photos", "avatars"] else ALLOWED_DOC_EXTENSIONS
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '{ext}'. Allowed extensions: {', '.join(sorted(allowed_exts))}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size ({max_size // (1024 * 1024)} MB).",
        )

    # SEC-02: Validate binary magic bytes signature
    _validate_magic_bytes(file_bytes, bucket)

    # Sanitize and randomize path: {user_id}/{uuid}_{clean_filename}
    clean_base = re.sub(r"[^a-zA-Z0-9_\.-]", "_", name_root)[:40]
    clean_name = f"{clean_base}{ext}"
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
    """Uploads fast-track misconduct supporting document (private fast-track-docs bucket). Role-scoped (SEC-03)."""
    if current_user.role not in ["Department Head", "HR Personnel"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Department Heads and HR Personnel.",
        )

    return await _handle_upload(
        file=file,
        bucket="fast-track-docs",
        user_id=current_user.id,
        allowed_types=ALLOWED_DOC_TYPES,
        max_size=MAX_DOC_SIZE,
    )
