# backend/config.py
import os
from dotenv import load_dotenv
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM = os.getenv("RESEND_FROM", "Baral AI <onboarding@resend.dev>")
# Solo pruebas: si esta seteada, todos los emails se redirigen a esta direccion.
TEST_EMAIL_OVERRIDE = os.getenv("TEST_EMAIL_OVERRIDE")
# Tope de emails por ejecucion (protege el limite diario gratuito de Resend).
MAX_EMAILS_PER_RUN = int(os.getenv("MAX_EMAILS_PER_RUN", "25"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Solo para PRUEBAS: DeepSeek es compatible con el SDK de OpenAI (base_url distinto).
# Si DEEPSEEK_API_KEY esta seteada, el pipeline la usa primero. No cambia el plan real.
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")