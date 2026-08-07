from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vyomrix Enterprise Security Platform"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # Security
    SECRET_KEY: str = "development-only-secret-change-before-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    
    # Postgres
    POSTGRES_USER: str = "vyomrix"
    POSTGRES_PASSWORD: str = "vyomrix_secret"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5433"
    POSTGRES_DB: str = "vyomrix"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    # RabbitMQ
    RABBITMQ_USER: str = "guest"
    RABBITMQ_PASS: str = "guest"
    RABBITMQ_HOST: str = "localhost"
    RABBITMQ_PORT: int = 5672
    
    # AI Providers
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Wazuh integration (must be configured explicitly; no development fallback data)
    WAZUH_MANAGER_URL: Optional[str] = None
    WAZUH_MANAGER_USER: Optional[str] = None
    WAZUH_MANAGER_PASSWORD: Optional[str] = None
    WAZUH_INDEXER_URL: Optional[str] = None
    WAZUH_INDEXER_USER: Optional[str] = None
    WAZUH_INDEXER_PASSWORD: Optional[str] = None
    WAZUH_VERIFY_TLS: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @model_validator(mode="after")
    def validate_production_security(self):
        if self.ENVIRONMENT.lower() == "production" and (self.SECRET_KEY == "development-only-secret-change-before-production" or len(self.SECRET_KEY) < 32):
            raise ValueError("Production requires a unique SECRET_KEY of at least 32 characters.")
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
    @property
    def RABBITMQ_URI(self) -> str:
        return f"amqp://{self.RABBITMQ_USER}:{self.RABBITMQ_PASS}@{self.RABBITMQ_HOST}:{self.RABBITMQ_PORT}/"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")

settings = Settings()
