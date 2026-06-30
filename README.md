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

Pendiente (backend reasignado de Saul):

- [ ] `GET /health`.
- [ ] Verificacion JWT de Supabase + conexion con `SUPABASE_SERVICE_KEY`.
- [ ] `POST /api/onboarding/import-clients` (parser CSV).
- [ ] `GET /api/tasks`, `GET /api/analytics/summary`.
- [ ] Pipeline de 3 agentes (Orquestador, Copywriter, Revisor) + prompts.
- [ ] `POST /api/recipes/run`.
- [ ] `email_service.py` con Resend + `POST /api/tasks/{id}/approve`.
- [ ] `POST /api/content/generate` (texto + imagen por canal) para el Estudio.
- [ ] Modelo de imagen para imagenes/infografias (sin video IA en esta fase).
- [ ] Agregar `website_url` opcional a Brand Brain.

### Jhamil - Frontend

Hecho:

- [x] Login, sidebar y layout base.
- [x] Onboarding visual + formulario Brand Brain + CSV upload con drag/drop y preview.
- [x] Paginas base: Dashboard, Onboarding, Recipe, Preview, History, Analytics.
- [x] Rediseno a modo oscuro + iconos lucide-react.
- [x] Sidebar: items Dashboard / Estudio / Historial / Analiticas + seccion CUENTA (Notificaciones, Configuracion, Cerrar sesion). TopBar eliminado.
- [x] Estudio (`/studio`): prompt + lista "Mis campanas" (scroll propio) + preview celular full-height.
- [x] Mockups de preview por canal: Email, WhatsApp, Instagram, Facebook, TikTok (selector dropdown).
- [x] `npm.cmd run lint` y `npm.cmd run build` pasan.

Pendiente:

- [ ] Conectar CSV upload, recetas, preview, historial y analytics a endpoints reales.
- [ ] Cargar Brand Brain real en los mockups (hoy usan datos de ejemplo "Studio Foto").
- [ ] Renderizar la imagen real generada en el preview (hoy placeholder).
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
- `AnalyticsSummary`

Endpoints esperados:

```text
GET  /health
POST /api/onboarding/import-clients
POST /api/recipes/run
GET  /api/tasks
POST /api/tasks/{taskId}/approve
GET  /api/analytics/summary
POST /api/content/generate          # texto + imagen por canal (Estudio)
POST /api/strategies                # Feature A: Mis Estrategias (Sprint 2)
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
FRONTEND_URL=http://localhost:5173
```

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

- [ ] Omar: cerrar `GET /health` + JWT + conexion Supabase.
- [ ] Omar: entregar endpoints (import-clients, tasks, analytics) para desbloquear integracion.
- [ ] Omar: pipeline de IA + `POST /api/recipes/run`.
- [ ] Omar: Resend + `POST /api/tasks/{id}/approve`.
- [ ] Omar: `POST /api/content/generate` + modelo de imagen (Estudio).
- [ ] Jhamil: conectar UI a endpoints reales conforme se entreguen.
- [ ] Omar/Jhamil: probar Brand Brain guardado en una cuenta nueva.

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
