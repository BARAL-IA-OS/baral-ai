# Baral AI - Fase 1

Prototipo local de Baral AI: una plataforma de accion para configurar una empresa, cargar clientes, generar contenido de marketing con IA (email + redes), revisar una vista previa realista y ejecutar campanas por email.

> Documentacion completa en `doc/`:
> - `doc/PLAN_GENERAL.md` - vision, arquitectura, schema, cronograma.
> - `doc/FEATURES_INDEX.md` - indice de features (incluye Seccion 7: multicanal + Estudio).
> - `doc/DISTRIBUCION_TAREAS.md` - **tareas asignadas (empezar por aqui)**.

## Equipo y Responsables


| Integrante | Rol | Responsabilidades |
|---|---|---|
| Omar Quispe | Tech Lead & Full Stack | Arquitectura, Supabase, Auth, Brand Brain, todo el backend FastAPI, pipeline de IA, generacion de contenido, Resend, contratos, code review |
| Jhamil | Frontend Developer | UI/UX, onboarding, dashboard, recetas, Estudio multicanal, preview, historial, analiticas; integra endpoints conforme Omar los entrega |

## Stack Actual

| Capa | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript 6 |
| Routing | React Router |
| Estilos | CSS vanilla (modo oscuro) |
| Iconos | lucide-react |
| Auth | Supabase Auth |
| Base de datos | Supabase PostgreSQL + RLS |
| Backend | FastAPI + Python |
| IA texto | OpenAI principal, Claude fallback |
| IA imagen | Modelo de imagen (gpt-image-1 / DALL-E / Flux) - pendiente |
| Email | Resend |
| Deploy | Vercel frontend, Railway/backend pendiente |

## Estructura

```text
baral-ai/
+-- doc/                         # PLAN_GENERAL, FEATURES_INDEX, DISTRIBUCION_TAREAS
+-- frontend/
|   +-- src/components/
|   |   +-- layout/              # Sidebar (con seccion CUENTA), Layout (sin TopBar)
|   |   +-- dashboard/           # ActionCard, MetricsPanel, RecentTasks
|   |   +-- preview/             # ChannelMocks, SocialPreview (Estudio)
|   |   +-- onboarding/ ui/ recipes/ history/
|   +-- src/pages/              # Login, Onboarding, Dashboard, Recipe, Preview, History, Analytics, Studio
|   +-- src/hooks/
|   +-- src/lib/
|   +-- src/types/
+-- backend/
    +-- routers/
    +-- services/
    +-- models/
    +-- prompts/
```

## Estado Actual

### Omar - Tech Lead & Full Stack

Hecho:

- [x] Proyecto Supabase creado, variables frontend en `.env.local`.
- [x] Tablas `brand_brain`, `clients`, `tasks` con RLS y politicas por `auth.uid()`.
- [x] Auth por email habilitado; frontend conectado a Supabase.
- [x] Tipos base en `frontend/src/types/index.ts` (+ `ChannelType`, `SocialDraft`).
- [x] API wrapper base en `frontend/src/lib/api.ts`.
- [x] `brand_brain.user_id` unico; onboarding hace upsert (no duplica).
- [x] `GET /health` (reporta `supabase_configured`).
- [x] Middleware JWT: `get_current_user` valida token Supabase (`dependencies/auth.py`) + `GET /api/me`.
- [x] Conexion a Supabase con `SUPABASE_SERVICE_KEY` (`services/db_service.py`).
- [x] `POST /api/onboarding/import-clients` (parser CSV stdlib, inserta en `clients`).
- [x] `GET /api/tasks` y `GET /api/analytics/summary` (reales, filtrados por JWT).
- [x] Pipeline de 3 agentes (`llm_service.py`, `agent_pipeline.py`, prompts) + `POST /api/recipes/run`.
      OpenAI `gpt-4o-mini` -> fallback Claude Haiku 4.5; fallback determinista sin keys.
- [x] `email_service.py` (Resend) + `POST /api/tasks/{id}/approve` — envio real, probado E2E.
- [x] `POST /api/content/generate` (Estudio) — texto por canal desde prompt + Brand Brain (una sola llamada LLM). Contrato tipado listo en `api.ts` (`generateContent`).

**Backend Fase 1 (Prioridades 1-4): COMPLETO.**

Pendiente:
- [ ] Modelo de imagen para el Estudio (hoy `content/generate` devuelve `media_alt`, la descripcion; falta generar la imagen).
- [ ] Agregar `website_url` opcional a Brand Brain.
- [ ] Verificar un dominio en Resend para enviar a clientes reales (hoy solo entrega al correo de la cuenta).
- [ ] Desplegar backend + integrar con el frontend.

### Jhamil - Frontend

Hecho:

- [x] Login, sidebar y layout base.
- [x] Onboarding visual + formulario Brand Brain + CSV upload con drag/drop y preview.
- [x] Paginas base: Dashboard, Onboarding, Recipe, Preview, History, Analytics.
- [x] Rediseno a modo oscuro + iconos lucide-react.
- [x] Sidebar: items Dashboard / Estudio / Historial / Analiticas + seccion CUENTA (Notificaciones, Configuracion, Cerrar sesion). TopBar eliminado.
- [x] Estudio (`/studio`): prompt + lista "Mis campanas" (scroll propio) + preview celular full-height.
- [x] Mockups de preview por canal: Email, WhatsApp, Instagram, Facebook, TikTok (selector dropdown).
- [x] **Integracion con el backend real:** CSV upload (`importClients`), recetas con stepper de pipeline
      (`useRecipeRunner`), Preview con detalle de tarea (`useTask` + `getTask`), aprobar y enviar,
      historial y analytics conectados.
- [x] **Human Gate:** el draft editado en el Preview se envia y se persiste (via `approveTask(id, draft)`).
- [x] `npm run lint` y `npm run build` pasan.

Pendiente:

- [ ] Cargar Brand Brain real en los mockups del Estudio (hoy usan datos de ejemplo "Studio Foto").
- [ ] Renderizar la imagen real generada en el preview del Estudio (hoy placeholder).
- [ ] Conectar "Generar campana" a `POST /api/content/generate`.
- [ ] Agrupar el Dashboard en las 2 familias (Mensajes a clientes / Contenido para redes).
- [ ] Pulir estados vacios, errores y loading.

> Detalle accionable y orden de trabajo en `doc/DISTRIBUCION_TAREAS.md`.

## Contratos Frontend/Backend

La fuente actual de contratos TypeScript esta en:

```text
frontend/src/types/index.ts
```

Contratos actuales:

- `RecipeType`
- `ChannelType`
- `SocialDraft`
- `TaskStatus`
- `BrandBrain`
- `Client`
- `Task`
- `RunRecipeRequest`
- `RunRecipeResponse`
- `ApproveTaskResponse`
- `ImportClientsResponse`
- `AnalyticsSummary`

> `frontend/src/lib/api.ts` ya esta alineado con las respuestas reales del backend y manda el
> JWT de Supabase (`Authorization: Bearer`). Funciones listas: `importClients`, `runRecipe`,
> `getTasks`, `approveTask`, `getAnalytics`. El `user_id` sale del JWT (ya no se pasa por query).

Endpoints esperados:

```text
GET  /health
GET  /api/me
POST /api/onboarding/import-clients
POST /api/recipes/run
GET  /api/tasks
GET  /api/tasks/{taskId}             # detalle (para el Preview)
POST /api/tasks/{taskId}/approve     # acepta draft_content editado (Human Gate)
GET  /api/analytics/summary
POST /api/content/generate          # texto por canal (Estudio) — LISTO (imagen pendiente)
POST /api/strategies                # Feature A: Mis Estrategias (Sprint 2) — PENDIENTE
GET  /api/strategies
DELETE /api/strategies/{id}
```

## Variables de Entorno

### Frontend

Archivo local:

```text
frontend/.env.local
```

Contenido:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_URL=http://localhost:8000
```

### Backend

Archivo local:

```text
backend/.env
```

Contenido:

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
RESEND_FROM=Baral AI <onboarding@resend.dev>
FRONTEND_URL=http://localhost:5173

# Solo PRUEBAS (opcional): DeepSeek, compatible con el SDK de OpenAI.
# Si esta seteada, el pipeline la usa primero; no cambia el plan real (OpenAI+Anthropic).
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
# Solo PRUEBAS: redirige TODOS los emails a un correo; tope de envios por ejecucion.
TEST_EMAIL_OVERRIDE=
MAX_EMAILS_PER_RUN=25
```

> ⚠️ Resend sin dominio verificado solo entrega al correo de la cuenta. Ver `backend/README.md`.

Nunca subir `.env`, `.env.local`, `.venv`, `__pycache__` ni `*.pyc`.

## Setup Local

### Frontend

```bash
cd frontend
npm install
npm.cmd run dev -- --host 127.0.0.1
```

URL:

```text
http://localhost:5173
```

Verificacion:

```bash
npm.cmd run lint
npm.cmd run build
```

### Backend

```bash
cd backend
uv run fastapi dev main.py
```

URL esperada:

```text
http://localhost:8000
```

Docs esperados:

```text
http://localhost:8000/docs
```

## Supabase

Tablas actuales:

- [x] `brand_brain`
- [x] `clients`
- [x] `tasks`
- [ ] `saved_strategies` (Feature A, Sprint 2)

Seguridad:

- [x] RLS habilitado en las 3 tablas.
- [x] Politicas por `auth.uid() = user_id`.
- [x] `brand_brain.user_id` unico por usuario.

SQL util para verificar duplicados:

```sql
SELECT user_id, COUNT(*)
FROM brand_brain
GROUP BY user_id
HAVING COUNT(*) > 1;
```

## Pendientes Prioritarios

> Backend Fase 1 (Prioridades 1-4) COMPLETO y probado contra servicios reales. Sigue:

- [ ] Jhamil: conectar la UI a los endpoints reales (contratos ya listos en `lib/api.ts`).
- [ ] Omar: `POST /api/content/generate` + modelo de imagen (Estudio multicanal).
- [ ] Omar: campo `website_url` opcional en Brand Brain.
- [ ] Omar: verificar dominio en Resend para enviar a clientes reales (hoy solo al correo de la cuenta).
- [ ] Omar/Jhamil: correr todo local end-to-end y probar en el navegador.
- [ ] Deploy: frontend en Vercel + backend (Railway o similar).

## Idea Propuesta: Website URL

Agregar un campo opcional al Brand Brain:

```text
website_url
```

Objetivo:

- Extraer contexto de marca desde la web del cliente.
- Detectar logo, colores, propuesta de valor y tono.
- Usar ese contexto para mejorar prompts y campanas.

Implementacion recomendada:

- Frontend: campo opcional en onboarding.
- Supabase: columna `website_url TEXT`.
- Backend: endpoint `POST /api/brand/analyze-url`.
- Resultado futuro: guardar un `brand_snapshot JSONB` con logo, paleta, textos y metadata.

## Definition of Done - Fase 1

- [ ] Usuario puede registrarse/iniciar sesion.
- [ ] Usuario completa Brand Brain.
- [ ] Usuario puede subir clientes CSV.
- [ ] Dashboard muestra recetas funcionales.
- [ ] Receta genera preview con IA.
- [ ] Estudio genera contenido multicanal con preview por red.
- [ ] Usuario aprueba envio.
- [ ] Resend envia emails reales.
- [ ] Historial muestra tareas.
- [ ] Analytics muestra KPIs reales.
- [ ] Frontend desplegado en Vercel.
- [ ] Backend desplegado o listo para demo local.
