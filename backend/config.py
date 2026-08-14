# backend/config.py
import os
from dotenv import load_dotenv
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

# Generacion de imagenes (OpenAI Images). Defaults economicos para cuidar el saldo.
OPENAI_IMAGE_MODEL = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1")
OPENAI_IMAGE_SIZE = os.getenv("OPENAI_IMAGE_SIZE", "1024x1024")
OPENAI_IMAGE_QUALITY = os.getenv("OPENAI_IMAGE_QUALITY", "low")
RESEND_FROM = os.getenv("RESEND_FROM", "Baral AI <onboarding@resend.dev>")
# Solo pruebas: si esta seteada, todos los emails se redirigen a esta direccion.
TEST_EMAIL_OVERRIDE = os.getenv("TEST_EMAIL_OVERRIDE")
# Tope de emails por ejecucion (protege el limite diario gratuito de Resend).
MAX_EMAILS_PER_RUN = int(os.getenv("MAX_EMAILS_PER_RUN", "25"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Origen publico del frontend, sin slash final (por ejemplo, https://app.vercel.app).
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

# Solo para PRUEBAS: DeepSeek es compatible con el SDK de OpenAI (base_url distinto).
# Si DEEPSEEK_API_KEY esta seteada, el pipeline la usa primero. No cambia el plan real.
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
