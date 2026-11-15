import os
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union


class Settings(BaseSettings):
    APP_NAME: str = "PerformaCOS Backend API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SQL_ECHO: bool = False
    APP_FRONTEND_URL: str = "https://localhost:5173"

    # Database
    DATABASE_URL: str = ""
    DATABASE_POOLER_URL: str = ""

    # Legacy secret key (kept for backward compat)
    SECRET_KEY: str = "performa-cos-super-secret-key-change-in-production-2026"

    # JWT (preferred)
    JWT_SECRET_KEY: str = "performa-cos-jwt-secret-change-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24

    # Legacy JWT fields (derived from JWT_* above for backward compat)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "https://localhost:5173",
        "https://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            clean_v = v.strip()
            if not clean_v:
                return []
            if clean_v.startswith("[") and clean_v.endswith("]"):
                try:
                    parsed = json.loads(clean_v)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [origin.strip() for origin in clean_v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        return []

    # Geofence — EVSU Main Campus
    EVSU_MAIN_LATITUDE: float = 11.0065
    EVSU_MAIN_LONGITUDE: float = 124.6075
    EVSU_MAIN_RADIUS_METERS: float = 500.0

    # Geofence — EVSU Luna Campus
    EVSU_LUNA_LATITUDE: float = 11.0607
    EVSU_LUNA_LONGITUDE: float = 124.6137
    EVSU_LUNA_RADIUS_METERS: float = 500.0

    # Legacy geofence aliases
    EVSU_LATITUDE: float = 11.0065
    EVSU_LONGITUDE: float = 124.6075
    GEOFENCE_RADIUS_METERS: float = 500.0

    # SMTP Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "EVSU PerformaCOS"
    SMTP_FROM_EMAIL: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False

    # Supabase Storage
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""

    # OTP
    OTP_EXPIRE_MINUTES: int = 10

    # Google Gemini API
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=(
            os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
            os.path.join(os.path.dirname(__file__), "..", ".env"),
            ".env",
        ),
        extra="ignore",
    )

    @property
    def frontend_base_url(self) -> str:
        """Return APP_FRONTEND_URL without trailing whitespace or slash for clean link joins."""
        raw = (self.APP_FRONTEND_URL or "https://localhost:5173").strip()
        return raw.rstrip("/")


settings = Settings()
