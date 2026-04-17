from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./hcp_crm.db"
    GROQ_API_KEY: str = ""
    GROQ_MODEL_PRIMARY: str = "gemma2-9b-it"
    GROQ_MODEL_SECONDARY: str = "llama-3.3-70b-versatile"
    SECRET_KEY: str = "change_this_in_production"
    CORS_ORIGINS: str = "http://localhost:5173"
    DEBUG: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
