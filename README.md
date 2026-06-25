# Baral AI - Fase 1

Prototipo local de Baral AI: una plataforma de accion para configurar una empresa, cargar clientes, elegir recetas de marketing con IA, revisar contenido generado y ejecutar campanas por email.

## Equipo y Responsables

| Integrante | Rol | Responsabilidades |
|---|---|---|
| Omar Quispe | Tech Lead & Full Stack | Arquitectura, Supabase, Auth, Brand Brain, contratos, code review |
| Jhamil | Frontend Developer | UI/UX, onboarding, dashboard, recetas, preview, historial, analiticas |
| Saul | Backend & IA Developer | FastAPI, Supabase backend, CSV parser, agentes IA, Resend, analytics |

## Stack Actual

| Capa | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript 6 |
| Routing | React Router |
| Estilos | CSS vanilla |
| Auth | Supabase Auth |
| Base de datos | Supabase PostgreSQL + RLS |
| Backend | FastAPI + Python |
| IA | OpenAI principal, Claude fallback |
| Email | Resend |
| Deploy | Vercel frontend, Railway/backend pendiente |

## Estructura

```text
baral-ai/
+-- frontend/
|   +-- src/components/
|   +-- src/pages/
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

### Omar - Tech Lead

- [x] Proyecto Supabase creado.
- [x] Variables frontend configuradas en `.env.local`.
- [x] Variables backend compartidas con Saul para `.env`.
- [x] Tablas creadas: `brand_brain`, `clients`, `tasks`.
- [x] RLS activado en tablas principales.
- [x] Auth por email habilitado.
- [x] Frontend conectado a Supabase.
- [x] Tipos base creados en `frontend/src/types/index.ts`.
- [x] API wrapper base creado en `frontend/src/lib/api.ts`.
- [x] `brand_brain.user_id` limpiado para evitar duplicados.
- [x] Restriccion unica `brand_brain_user_id_unique` preparada/validada en Supabase.
- [x] Onboarding redirige a dashboard si Brand Brain ya existe.
- [x] Guardado de Brand Brain actualiza el registro existente.
- [ ] Probar flujo completo Auth -> Brand Brain -> Dashboard en limpio.
- [ ] Documentar contratos definitivos con Saul cuando existan endpoints reales.
- [ ] Agregar `website_url` opcional a Brand Brain.
- [ ] Coordinar endpoint futuro de analisis de URL con Saul.

### Jhamil - Frontend

- [x] Login visual implementado.
- [x] Sidebar y layout base implementados.
- [x] Dashboard visual con cards y metricas base.
- [x] Onboarding visual implementado.
- [x] Formulario Brand Brain integrado visualmente.
- [x] CSV upload con drag/drop y preview basico.
- [x] Paginas base: Dashboard, Onboarding, Recipe, Preview, History, Analytics.
- [x] `npm.cmd run lint` pasa.
- [x] `npm.cmd run build` pasa.
- [ ] Corregir textos con encoding roto si aparecen en UI.
- [ ] Ocultar o deshabilitar botones OAuth si no se implementan.
- [ ] Conectar CSV upload a backend cuando Saul entregue endpoint.
- [ ] Conectar historial y analytics a endpoints reales.
- [ ] Pulir estados vacios, errores y loading.

### Saul - Backend e IA

- [x] Carpeta backend creada.
- [x] Estructura base creada: `routers`, `services`, `models`, `prompts`.
- [x] FastAPI inicial con CORS.
- [x] Dependencias base agregadas.
- [x] `.env` backend preparado localmente.
- [ ] Implementar `GET /health`.
- [ ] Actualizar README del backend con setup real.
- [ ] Implementar verificacion JWT de Supabase.
- [ ] Conectar backend a Supabase usando `SUPABASE_SERVICE_KEY`.
- [ ] Implementar `POST /api/onboarding/import-clients`.
- [ ] Implementar `POST /api/recipes/run`.
- [ ] Implementar `GET /api/tasks`.
- [ ] Implementar `POST /api/tasks/{id}/approve`.
- [ ] Implementar `GET /api/analytics/summary`.
- [ ] Implementar pipeline de 3 agentes.
- [ ] Implementar envio real con Resend.
- [ ] Implementar endpoint futuro `POST /api/brand/analyze-url`.

## Contratos Frontend/Backend

La fuente actual de contratos TypeScript esta en:

```text
frontend/src/types/index.ts
```

Contratos actuales:

- `RecipeType`
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

- [ ] Saul: cerrar `GET /health`.
- [ ] Saul: entregar endpoints mock para desbloquear integracion.
- [ ] Omar: validar contratos contra respuestas reales del backend.
- [ ] Jhamil: conectar UI a endpoints reales.
- [ ] Omar/Jhamil: probar Brand Brain guardado en una cuenta nueva.
- [ ] Omar/Saul: definir contrato de CSV import.
- [ ] Omar/Saul: definir `website_url` y analisis automatico de pagina.

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
- [ ] Usuario aprueba envio.
- [ ] Resend envia emails reales.
- [ ] Historial muestra tareas.
- [ ] Analytics muestra KPIs reales.
- [ ] Frontend desplegado en Vercel.
- [ ] Backend desplegado o listo para demo local.
