# 🎨 Baral AI — Frontend

SPA de **Baral AI**: bienvenida, onboarding, dashboard de recetas, estudio multicanal,
preview, historial, analíticas y perfil. React + Vite + TypeScript, **modo claro/oscuro**.

---

## 🛠 Stack

* **React 19 + Vite 8 + TypeScript 6**
* **React Router 7** (navegación SPA)
* **CSS vanilla** con **temas claro/oscuro** (`data-theme`, `useTheme`)
* **lucide-react** (iconos)
* **Supabase JS** (Auth + sesión)

## 🎛 UI destacada

* **Modo claro/oscuro** (`useTheme`, default claro, persistido; toggle en el dropdown de cuenta).
* **Sidebar colapsable** (solo iconos + tooltips; estado persistido).
* **Dropdown de cuenta** (`AccountDropdown`): notificaciones, configuración, tema, **barra de uso de
  tokens** (`TokenUsageBar` ← `getUsage()`), cerrar sesión.
* **Brand Brain con modal por campo** (`InfoUploadModal`) + campo `website_url`.
* **Estudio** conectado a `generateContent`/`generateImage` con dictado por voz (Web Speech API).
* Páginas nuevas: `/welcome`, `/profile`.

---

## ⚙️ Variables de entorno (`frontend/.env.local`)

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_URL=http://localhost:8000
```

`VITE_API_URL` apunta al backend FastAPI. Nunca subir `.env.local`.

---

## 🚀 Puesta en marcha

```bash
cd frontend
npm install
npm run dev
```

App en `http://localhost:5173`. Requiere el backend corriendo en `VITE_API_URL`.

Verificación:

```bash
npm run lint
npm run build
```

---

## 🔌 Capa de API (`src/lib/api.ts`)

Todas las llamadas mandan el JWT de Supabase automáticamente (`Authorization: Bearer …`)
y están alineadas con el backend real:

| Función | Endpoint | Devuelve |
| --- | --- | --- |
| `importClients(file)` | `POST /api/onboarding/import-clients` | `{ imported, skipped, columns_detected, errors }` |
| `runRecipe({ recipe_type, params })` | `POST /api/recipes/run` | draft + recipients + tokens/costo/score |
| `getTasks(limit?)` | `GET /api/tasks` | `Task[]` |
| `getTask(id)` | `GET /api/tasks/{id}` | `Task` (detalle para el Preview) |
| `approveTask(id, draft?)` | `POST /api/tasks/{id}/approve` | `{ status, emails_sent, emails_failed, errors }` |
| `regenerateTaskField(id, field, draft)` | `POST /api/tasks/{id}/regenerate` | `RegenerateTaskResponse` |
| `getAnalytics()` | `GET /api/analytics/summary` | `AnalyticsSummary` |
| `getStrategies()` / `createStrategy(name, taskId)` / `deleteStrategy(id)` | `/api/strategies` | Feature A: Mis Estrategias |
| `generateContent({ prompt, channels? })` | `POST /api/content/generate` | `{ items: ContentItem[], tokens_used, cost_usd }` — Estudio |
| `generateImage(prompt)` | `POST /api/content/image` | `{ image_url, image_b64, cost_usd, tokens }` — usa `image_url` (Supabase Storage) |
| `getUsage()` | `GET /api/usage/summary` | `{ total_cost_usd, by_kind, ... }` — gasto de generación |
| `extractBrandFromUrl(url)` / `extractBrandFromFile(file)` | `POST /api/brand/extract-*` | `BrandExtractResponse` — autocompletar Brand Brain |

`approveTask` acepta el draft editado (Human Gate): si se pasa, el backend lo persiste y envía eso.

Los contratos TypeScript están en `src/types/index.ts` (fuente de verdad; la mantiene Omar).

**Hooks de integración / UI:**
- `useRecipeRunner` — ejecuta una receta, hace polling del estado y navega al Preview.
- `useTask(id)` — carga el detalle de una campaña.
- `useTasks` — lista de campañas para el historial.
- `useTheme` — tema claro/oscuro (`data-theme`, persistido).
- `useWelcomeSeen` — marca si ya se vio la pantalla de bienvenida.

---

## 📂 Estructura

```text
frontend/src/
├── pages/            # Login, Welcome, Onboarding, Dashboard, Recipe, Preview, History, Analytics, Studio, Profile
├── components/
│   ├── layout/       # Sidebar (colapsable), AccountDropdown, TokenUsageBar, Layout
│   ├── dashboard/    # ActionCard, MetricsPanel, RecentTasks, SavedStrategies, InfoUploadModal
│   ├── preview/      # ChannelMocks, SocialPreview (mockups por red del Estudio)
│   ├── onboarding/   # BrandBrainForm (modal por campo + website_url), CSVUpload, SetupProgress
│   ├── recipes/ history/ ui/
├── hooks/            # useAuth, useBrandBrain, useTasks, useTask, useRecipeRunner, useTheme, useWelcomeSeen
├── lib/              # supabase.ts, api.ts
└── types/            # index.ts (contratos)
```

---

## 🗺️ Flujo de la app

```
Login → Onboarding (Brand Brain + CSV) → Dashboard (recetas)
      → Receta (params) → IA genera → Preview editable
      → Aprobar y Enviar → Historial / Analíticas
```

El **Estudio** (`/studio`) genera contenido multicanal y muestra un preview realista
en formato celular por red (Email, WhatsApp, Instagram, Facebook, TikTok).
