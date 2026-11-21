import os\nimport secrets
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent
DB_FILE = BASE_DIR / "pos_saas.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "OmniFlow Cloud POS & ERP SaaS"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY") or secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Absolute database file path for consistency across execution contexts
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DB_FILE.as_posix()}")
    
    class Config:
        case_sensitive = True

settings = Settings()

