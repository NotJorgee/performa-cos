import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "PerformaCOS Backend API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database Settings
    # Reads DATABASE_URL from .env (e.g. postgresql://...)
    DATABASE_URL: str = ""
    DATABASE_POOLER_URL: str = ""
    
    # JWT & Auth
    SECRET_KEY: str = "performa-cos-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS Origins (React Vite/Local dev)
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Campus Coordinates for Geofencing (EVSU Campus)
    EVSU_LATITUDE: float = 11.0065
    EVSU_LONGITUDE: float = 124.6075
    GEOFENCE_RADIUS_METERS: float = 500.0

    model_config = SettingsConfigDict(
        # Look for .env in current dir, or parent dir (root)
        env_file=(
            os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
            os.path.join(os.path.dirname(__file__), "..", ".env"),
            ".env"
        ),
        extra="ignore"
    )

settings = Settings()
