from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "ls-management-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = "sqlite:///./lsmanagement.db"
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]

    # Email / SMTP
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    OPERATOR_EMAIL: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
