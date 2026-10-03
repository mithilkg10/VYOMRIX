from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, Any
import os
from urllib.parse import quote_plus

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vyomrix Enterprise Security Platform"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # Runtime Configuration
    VYOMRIX_RUNTIME: str = "production"  # 'production' or 'local'
    VYOMRIX_SANDBOX: bool = False
    REPORTS_DIR: str = "/app/data/reports"
    
    # Explicit owner and isolated demo accounts
    ADMIN_EMAIL: Optional[str] = None
    ADMIN_PASSWORD_HASH: Optional[str] = None
    DEMO_PASSWORD: Optional[str] = None
    DEMO_DATA_ONLY: bool = False
    
    # Security
    SECRET_KEY: str = ""
    CSRF_SECRET: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    
    # Postgres
    POSTGRES_USER: str = "vyomrix"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5433"
    POSTGRES_DB: str = "vyomrix"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    
    # RabbitMQ
    RABBITMQ_USER: str = "guest"
    RABBITMQ_PASS: str = ""
    RABBITMQ_HOST: str = "localhost"
    RABBITMQ_PORT: int = 5672
    
    @property
    def RABBITMQ_URI(self) -> str:
        return f"amqp://{self.RABBITMQ_USER}:{self.RABBITMQ_PASS}@{self.RABBITMQ_HOST}:{self.RABBITMQ_PORT}/"
    
    # AI Providers
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Wazuh integration
    WAZUH_MANAGER_URL: Optional[str] = None
    WAZUH_MANAGER_USER: Optional[str] = None
    WAZUH_MANAGER_PASSWORD: Optional[str] = None
    WAZUH_INDEXER_URL: Optional[str] = None
    WAZUH_INDEXER_USER: Optional[str] = None
    WAZUH_INDEXER_PASSWORD: Optional[str] = None
    WAZUH_VERIFY_TLS: bool = True
    WAZUH_CA_BUNDLE: Optional[str] = None
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @model_validator(mode="before")
    @classmethod
    def load_secrets_from_files(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for key in ["SECRET_KEY", "CSRF_SECRET", "POSTGRES_PASSWORD", "REDIS_PASSWORD", "RABBITMQ_PASSWORD", "WAZUH_MANAGER_PASSWORD", "WAZUH_INDEXER_PASSWORD", "RABBITMQ_PASS"]:
                file_key = f"{key}_FILE"
                file_path = data.get(file_key) or os.getenv(file_key)
                if file_path:
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            data[key] = f.read().strip()
                    except Exception as e:
                        raise ValueError(f"Could not read secret from {file_path}: {e}")
        return data

    @model_validator(mode="after")
    def validate_production_security(self):
        if len(self.SECRET_KEY) < 32 or len(self.CSRF_SECRET) < 32:
            raise ValueError("Set unique SECRET_KEY and CSRF_SECRET values of at least 32 characters.")
        if self.SECRET_KEY == self.CSRF_SECRET:
            raise ValueError("SECRET_KEY and CSRF_SECRET must differ.")
        if self.ENVIRONMENT.lower() == "production":
            if self.VYOMRIX_RUNTIME != "production":
                raise ValueError("VYOMRIX_RUNTIME must be 'production' when ENVIRONMENT is 'production'.")
            if self.VYOMRIX_SANDBOX is not False:
                raise ValueError("VYOMRIX_SANDBOX must be false in production.")
            if "localhost" in self.ALLOWED_ORIGINS or "127.0.0.1" in self.ALLOWED_ORIGINS:
                raise ValueError("ALLOWED_ORIGINS must not contain localhost in production.")
            if not self.POSTGRES_PASSWORD:
                raise ValueError("Production requires a secure POSTGRES_PASSWORD.")
            if not self.RABBITMQ_PASS or self.RABBITMQ_PASS == "guest":
                raise ValueError("Production requires a secure RABBITMQ_PASS.")
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.VYOMRIX_RUNTIME == "local":
            return "sqlite+aiosqlite:///./vyomrix-local.db"
        user = quote_plus(self.POSTGRES_USER)
        password = quote_plus(self.POSTGRES_PASSWORD)
        return f"postgresql+asyncpg://{user}:{password}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def REDIS_URI(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{quote_plus(self.REDIS_PASSWORD)}@{self.REDIS_HOST}:{self.REDIS_PORT}/0"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    @property
    def RABBITMQ_URI(self) -> str:
        user = quote_plus(self.RABBITMQ_USER)
        password = quote_plus(self.RABBITMQ_PASS)
        return f"amqp://{user}:{password}@{self.RABBITMQ_HOST}:{self.RABBITMQ_PORT}/"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")

settings = Settings()
