# 🎨 Baral AI — Frontend

SPA de **Baral AI**: onboarding, dashboard de recetas, estudio multicanal, preview,
historial y analíticas. React + Vite + TypeScript, modo oscuro.

---

## 🛠 Stack

* **React 19 + Vite 8 + TypeScript 6**
* **React Router 7** (navegación SPA)
* **CSS vanilla** (modo oscuro, sin framework de UI)
* **lucide-react** (iconos)
* **Supabase JS** (Auth + sesión)

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
| `approveTask(id)` | `POST /api/tasks/{id}/approve` | `{ status, emails_sent, emails_failed, errors }` |
| `getAnalytics()` | `GET /api/analytics/summary` | `AnalyticsSummary` |

Los contratos TypeScript están en `src/types/index.ts` (fuente de verdad; la mantiene Omar).

---

## 📂 Estructura

```text
frontend/src/
├── pages/            # Login, Onboarding, Dashboard, Recipe, Preview, History, Analytics, Studio
├── components/
│   ├── layout/       # Sidebar (sección CUENTA), Layout
│   ├── dashboard/    # ActionCard, MetricsPanel, RecentTasks
│   ├── preview/      # ChannelMocks, SocialPreview (mockups por red del Estudio)
│   ├── onboarding/   # BrandBrainForm, CSVUpload, SetupProgress
│   ├── recipes/ history/ ui/
├── hooks/            # useAuth, useBrandBrain, useTasks
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
