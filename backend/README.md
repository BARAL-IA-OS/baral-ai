# 🤖 Baral AI — Backend Engine

> El módulo ADN del negocio, catálogo, recursos privados y Clientes 360 se documenta en
> [`doc/BUSINESS_DNA_CONTRACT.md`](../doc/BUSINESS_DNA_CONTRACT.md). Antes de usarlo se deben
> aplicar, en orden, las migraciones de `supabase/migrations`.

Motor de ejecución de acciones de negocio con IA para **Baral AI**. FastAPI + `uv`.
**Backend Fase 1 (Prioridades 1-4): completo y probado contra servicios reales.**

---

## 🛠 Stack

* **Lenguaje:** Python 3.14+
* **Framework:** FastAPI + Pydantic v2
* **Entorno:** `uv` (Astral)
* **IA (texto):** OpenAI `gpt-4o-mini` (primario) → Anthropic `claude-haiku-4-5` (fallback)
* **Email:** Resend
* **Base de datos / Auth:** Supabase (PostgreSQL + RLS, SDK de Python)

> Si no hay API keys de IA, el pipeline usa un **fallback determinista local** (`provider: "stub"`, costo 0) para que el flujo funcione igual.

---

## 🔐 Autenticación

Todos los endpoints bajo `/api/*` están protegidos. El frontend debe enviar el
access_token de Supabase:

```
Authorization: Bearer <access_token>
```

La dependencia `get_current_user` (`dependencies/auth.py`) valida el token contra
Supabase Auth y expone `user.id` / `user.email`. El `user_id` sale del JWT — **no** se
pasa por query param. Como el backend usa `SUPABASE_SERVICE_KEY` (bypassa RLS), cada
query filtra por `user_id` manualmente.

---

## ⚙️ Variables de entorno (`backend/.env`)

```env
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# IA (plan real). Vacías = fallback determinista local.
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM=Baral AI <onboarding@resend.dev>

# Imagen (OpenAI Images). Usa OPENAI_API_KEY. Defaults economicos:
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=low

# CORS
FRONTEND_URL=http://localhost:5173

# --- Solo PRUEBAS (opcional) ---
# DeepSeek: compatible con el SDK de OpenAI; si está seteada, el pipeline la usa
# PRIMERO (no cambia el plan real OpenAI+Anthropic).
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
# Redirige TODOS los emails a un correo (evita spamear clientes reales).
TEST_EMAIL_OVERRIDE=
# Tope de emails por ejecución (protege el límite diario gratuito de Resend).
MAX_EMAILS_PER_RUN=25
```

Nunca subir `.env`, `.venv`, `__pycache__` ni `*.pyc`.

> ⚠️ **Resend sin dominio verificado** solo entrega al correo de la cuenta. Para enviar
> a clientes reales, verifica un dominio en resend.com/domains y cambia `RESEND_FROM`.

---

## 🚀 Puesta en marcha

```bash
cd backend
uv run fastapi dev
```

Servidor en `http://localhost:8000` · Docs: `http://localhost:8000/docs`

Verificación rápida:

```bash
curl http://localhost:8000/health
```

---

## 📡 Endpoints (reales, no mock)

| Método | Ruta | Auth | Descripción |
| --- | --- | :---: | --- |
| `GET`  | `/health` | — | Estado + `supabase_configured` |
| `GET`  | `/api/me` | ✅ | Usuario del JWT (verifica el token) |
| `POST` | `/api/onboarding/import-clients` | ✅ | Sube CSV (multipart), inserta en `clients` |
| `POST` | `/api/recipes/run` | ✅ | Pipeline de 3 agentes → crea tarea `PENDING_APPROVAL` |
| `GET`  | `/api/tasks?limit=20` | ✅ | Campañas del usuario |
| `GET`  | `/api/tasks/{id}` | ✅ | Detalle de una campaña (para el Preview) |
| `POST` | `/api/tasks/{id}/approve` | ✅ | Envía la campaña (Resend) → `COMPLETED`. Acepta `draft_content` editado (Human Gate): lo persiste y lo usa para el envío |
| `POST` | `/api/tasks/{id}/regenerate` | ✅ | Regenera UN campo del email (asunto/saludo/cuerpo/cta) con el pipeline, conservando el resto |
| `GET`  | `/api/analytics/summary` | ✅ | KPIs agregados (contrato `AnalyticsSummary`) |
| `GET`/`POST`/`DELETE` | `/api/strategies[/{id}]` | ✅ | Feature A: guardar/listar/eliminar estrategias (tabla `saved_strategies`) |
| `POST` | `/api/content/generate` | ✅ | Estudio: genera texto por canal (email/whatsapp/instagram/facebook/tiktok) desde el prompt + Brand Brain |
| `POST` | `/api/content/image` | ✅ | Estudio: genera UNA imagen (OpenAI `gpt-image-1`) bajo demanda. La guarda en Supabase Storage y devuelve `image_url` + costo real |
| `POST` | `/api/brand/extract-url` | ✅ | Brand Brain: extrae y estructura info desde la URL de la empresa |
| `POST` | `/api/brand/extract-file` | ✅ | Brand Brain: idem desde un archivo (PDF/DOCX/MD/TXT) |
| `GET`  | `/api/usage/summary` | ✅ | Gasto de generación del usuario (texto + imagen). Requiere la tabla `usage_events` (ver `doc/sql_usage_events.sql`) |

---

## 🧠 Pipeline de IA (`services/` + `prompts/`)

1. **Orquestador** — filtra clientes de la DB según la receta (dias_inactivo / postventa / registro).
2. **Copywriter** — genera el email plantilla con marcadores `{{nombre}}`/`{{producto}}`.
3. **Revisor** — puntúa 0-10 y verifica prohibiciones del Brand Brain; regenera 1 vez si score < 7.

`llm_service.py` maneja el orden de proveedores: **DeepSeek (pruebas) → OpenAI → Anthropic → stub**,
con registro de `tokens` y `cost_usd` por llamada.

---

## 📂 Estructura

```text
backend/
├── main.py                 # FastAPI + CORS + routers
├── config.py               # variables de entorno
├── dependencies/auth.py    # verificación JWT (get_current_user)
├── routers/                # health, auth, onboarding, recipes, tasks, analytics
├── services/               # db_service, llm_service, agent_pipeline, email_service
└── prompts/                # copywriter, reviewer, orchestrator
```
