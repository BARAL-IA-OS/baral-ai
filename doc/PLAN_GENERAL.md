# 🚀 Baral AI — Plan General Fase 1: Prototipo Local

---

## 🎯 Visión del Producto

> **"Baral AI no es otro chat. Es una plataforma de ACCIÓN."**

El usuario no escribe prompts. El usuario **ejecuta acciones reales de negocio**.
La IA trabaja en segundo plano. El resultado sale al mundo real.

| Lo que NO somos | Lo que SÍ somos |
|---|---|
| ❌ Otro ChatGPT / Claude | ✅ Motor de ejecución de acciones de negocio |
| ❌ "Chatea con un agente" | ✅ "Ejecuta una campaña en 3 clics" |
| ❌ El usuario copia el texto a otro lado | ✅ La plataforma envía el email directamente |
| ❌ Prompt vacío, sin guía | ✅ Onboarding obligatorio + flujo guiado |
| ❌ Lista confusa de sub-agentes | ✅ Dashboard de acciones claras tipo card |

**Objetivo del prototipo:** Demostrar el flujo completo — empresa configurada → cliente seleccionado → IA genera → usuario aprueba → email enviado — **sin que el usuario necesite usar ningún otro software**.

---

## 👥 Equipo y Roles

| Integrante | Rol | Responsabilidad principal |
|---|---|---|
| **Omar Quispe** | 🎯 Tech Lead & Full Stack | Arquitectura, Supabase, Auth, Brand Brain, todo el backend FastAPI, pipeline de IA, Resend |
| **Jhamil** | 🎨 Frontend Developer | Toda la UI/UX: onboarding, dashboard, recetas, preview, historial. Integra endpoints conforme Omar los entrega |

> ⚠️ El equipo es de 2 personas. La distribución detallada de tareas está en [`DISTRIBUCION_TAREAS.md`](./DISTRIBUCION_TAREAS.md).

---

## 🗺️ Secuencia del Usuario — Flujo Completo

> Cada pantalla tiene una sola acción posible. El usuario nunca se pregunta "¿qué hago aquí?"

```
╔══════════════════════════════════════════════════════════════╗
║  PASO 1 — REGISTRO / LOGIN                                   ║
║  Supabase Auth. Email + contraseña. Simple.                  ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │ (primer ingreso)
                               ▼
╔══════════════════════════════════════════════════════════════╗
║  PASO 2 — ONBOARDING OBLIGATORIO                             ║
║  "Antes de usar Baral, cuéntanos sobre tu empresa"           ║
║                                                              ║
║  2A. Perfil de Empresa (Brand Brain)                         ║
║      → Industria, tono de voz, audiencia, prohibiciones      ║
║      → Progress bar: 0% → 50% → 100% completado             ║
║                                                              ║
║  2B. Importar Base de Clientes (CSV)                         ║
║      → Subir archivo con nombre, email, última compra        ║
║      → Vista previa de los datos antes de confirmar          ║
║      → "43 clientes importados correctamente ✅"             ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │ (setup completo)
                               ▼
╔══════════════════════════════════════════════════════════════╗
║  PASO 3 — DASHBOARD DE ACCIONES                              ║
║  No una lista. No un chat. Cards visuales de acciones.       ║
║                                                              ║
║  [Reactivar Inactivos] [Bienvenida] [Post-Venta]             ║
║  [Lanzamiento]         [Propuesta Comercial]                 ║
║                                                              ║
║  + Métricas rápidas: clientes · campañas · costo IA          ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │ (elige una acción)
                               ▼
╔══════════════════════════════════════════════════════════════╗
║  PASO 4 — CONFIGURAR LA RECETA                               ║
║  El usuario completa 2-4 campos específicos.                 ║
║  Ejemplo: "Clientes inactivos hace más de [60] días"         ║
║  Baral muestra: "Encontré 23 clientes que cumplen esto"      ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │
                               ▼
╔══════════════════════════════════════════════════════════════╗
║  PASO 5 — IA PROCESANDO (visible para el usuario)            ║
║  "🧠 Baral está analizando tus 23 clientes inactivos..."     ║
║  "✍️ Generando email personalizado para María García..."      ║
║  Estado en DB: CREATED → PROCESSING                          ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │
                               ▼
╔══════════════════════════════════════════════════════════════╗
║  PASO 6 — PREVIEW EDITABLE (Human Gate)                      ║
║  La IA propone. El humano decide.                            ║
║                                                              ║
║  Asunto: [editable] ─────────────────────────               ║
║  Saludo: [editable] ─────────────────────────               ║
║  Cuerpo: [editable] ─────────────────────────               ║
║  CTA:    [editable] ─────────────────────────               ║
║                                                              ║
║  [Ver lista de 23 destinatarios] [Regenerar sección]         ║
║  Costo estimado: ~$0.004 USD                                 ║
║  Estado: PENDING_APPROVAL                                    ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │ (clic en "Aprobar y Enviar")
                               ▼
╔══════════════════════════════════════════════════════════════╗
║  PASO 7 — EJECUCIÓN REAL                                     ║
║  Baral envía los emails directamente vía Resend API.         ║
║  Estado: APPROVED → EXECUTING → COMPLETED                    ║
║                                                              ║
║  "✅ 23 emails enviados · $0.004 USD · Campaña guardada"     ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │
                               ▼
╔══════════════════════════════════════════════════════════════╗
║  PASO 8 — HISTORIAL Y ANALÍTICAS                             ║
║  Todas las campañas ejecutadas con su estado y resultado.    ║
║  Exportar como PDF o CSV.                                    ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🏗️ Arquitectura Completa — Fase 1

### Diagrama por Capas

```
╔══════════════════════════════════════════════════════════════╗
║  CAPA 0 — ONBOARDING                                         ║
║  Responsable: Omar (backend) + Jhamil (UI)                   ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │  Brand Brain Form → Supabase tabla brand_brain        │   ║
║  │  CSV Upload → Parser → Supabase tabla clients         │   ║
║  └──────────────────────────────────────────────────────┘   ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │
╔══════════════════════════════════════════════════════════════╗
║  CAPA 1 — FRONTEND SPA                                       ║
║  Responsable: Jhamil                                         ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │  React v19 + Vite v8 + TypeScript v6                 │   ║
║  │  Páginas: /onboarding · /dashboard · /receta/:id     │   ║
║  │           /preview   · /historial  · /analiticas     │   ║
║  │  Componentes: ActionCard · BrandBrainForm · CSVUpload │   ║
║  │               RecipeFlow · PreviewEditor · TaskBadge  │   ║
║  └──────────────────────────────────────────────────────┘   ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │  POST /api/recipes/run
╔══════════════════════════════════════════════════════════════╗
║  CAPA 2 — BACKEND API                                        ║
║  Responsable: Omar                                           ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │  FastAPI v0.136 + Python v3.14                        │   ║
║  │  Endpoints:                                           │   ║
║  │    GET  /health                                       │   ║
║  │    POST /api/onboarding/brand-brain                   │   ║
║  │    POST /api/onboarding/import-clients                │   ║
║  │    POST /api/recipes/run      (ejecutar receta)       │   ║
║  │    POST /api/tasks/{id}/approve  (aprobar)            │   ║
║  │    GET  /api/tasks            (historial)             │   ║
║  │    GET  /api/analytics/summary                        │   ║
║  └──────────────────────────────────────────────────────┘   ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │  orchestrate()
╔══════════════════════════════════════════════════════════════╗
║  CAPA 3 — PIPELINE DE 3 AGENTES                              ║
║  Responsable: Omar                                           ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │  Agente 1: Orquestador                               │   ║
║  │    → Lee la Receta + Brand Brain + parámetros        │   ║
║  │    → Filtra clientes de la DB según criterio          │   ║
║  │    → Prepara el contexto para el Copywriter          │   ║
║  │                                                      │   ║
║  │  Agente 2: Copywriter                                │   ║
║  │    → Genera email personalizado por cliente          │   ║
║  │    → Usa nombre real, producto real, historial real  │   ║
║  │    → Respeta tono y prohibiciones del Brand Brain    │   ║
║  │                                                      │   ║
║  │  Agente 3: Revisor                                   │   ║
║  │    → Verifica que no se violen prohibiciones         │   ║
║  │    → Califica calidad del copy (score 0-10)          │   ║
║  │    → Si score < 7: regenera automáticamente          │   ║
║  └──────────────────────────────────────────────────────┘   ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │  API call
╔══════════════════════════════════════════════════════════════╗
║  CAPA 4 — MODELO LLM                                         ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │  Principal: GPT-4o-mini (OpenAI)                     │   ║
║  │  Fallback:  Claude Haiku (Anthropic)                 │   ║
║  │  → Si OpenAI falla (429/500), cambia automático      │   ║
║  │  → El usuario nunca ve el error                      │   ║
║  └──────────────────────────────────────────────────────┘   ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │  aprobación del usuario
╔══════════════════════════════════════════════════════════════╗
║  CAPA 5 — MOTOR DE EJECUCIÓN                                 ║
║  Responsable: Omar                                           ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │  Resend API (email gratuito hasta 3,000/mes)          │   ║
║  │  → Envío real de emails a los destinatarios          │   ║
║  │  → Registro de éxito/fallo por destinatario          │   ║
║  └──────────────────────────────────────────────────────┘   ║
╚══════════════════════════════╦═══════════════════════════════╝
                               │
╔══════════════════════════════════════════════════════════════╗
║  CAPA 6 — BASE DE DATOS                                      ║
║  Responsable: Omar                                           ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │  Supabase (PostgreSQL v18) + RLS activo              │   ║
║  │                                                      │   ║
║  │  brand_brain       → perfil de la empresa            │   ║
║  │  clients           → base de clientes importada      │   ║
║  │  tasks             → campañas con estado completo    │   ║
║  │    CREATED → PROCESSING → PENDING_APPROVAL           │   ║
║  │    → APPROVED → EXECUTING → COMPLETED | FAILED       │   ║
║  └──────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════╝
```

### Schema de la Base de Datos

```sql
-- Perfil de empresa (Brand Brain)
CREATE TABLE brand_brain (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  industria   TEXT NOT NULL,
  propuesta   TEXT NOT NULL,     -- propuesta de valor
  tono        TEXT NOT NULL,     -- "Cercano, emotivo, sin tecnicismos"
  audiencia   TEXT NOT NULL,     -- "Madres 28-40, nivel medio-alto"
  diferenciador TEXT NOT NULL,
  prohibiciones TEXT NOT NULL,   -- "NUNCA decir: oferta, gratis, descuento"
  website_url TEXT,              -- URL del sitio web (opcional)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Base de clientes
CREATE TABLE clients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) NOT NULL,
  nombre         TEXT NOT NULL,
  email          TEXT NOT NULL,
  telefono       TEXT,
  ultima_compra  DATE,
  producto       TEXT,           -- último producto comprado
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Campañas / Tareas con ciclo de vida completo
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  recipe_type     TEXT NOT NULL,     -- 'reactivacion' | 'bienvenida' | 'postventa' | ...
  status          TEXT NOT NULL DEFAULT 'CREATED',
  params          JSONB,             -- parámetros de la receta (ej. dias_inactivo: 60)
  draft_content   JSONB,             -- preview generado por IA
  recipients      JSONB,             -- lista de clientes seleccionados
  tokens_used     INTEGER DEFAULT 0,
  cost_usd        DECIMAL(10,6) DEFAULT 0,
  agent_score     INTEGER,           -- score del Agente Revisor (0-10)
  error_log       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- Estrategias guardadas (Sprint 2)
CREATE TABLE saved_strategies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  name        TEXT NOT NULL,
  recipe_type TEXT NOT NULL,
  params      JSONB NOT NULL,
  times_used  INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📦 Índice Completo de Features — 6 Secciones

### Sección 1 — Onboarding

| # | Feature | Responsable |
|---|---|---|
| 1.1 | Perfil de Empresa / Brand Brain (formulario guiado) | Jhamil (UI) · Omar (BD + endpoint) |
| 1.2 | Importación de clientes via CSV con preview | Jhamil (UI) · Omar (parser + endpoint) |
| 1.3 | Progress bar de setup + confirmación "Listo" | Jhamil |
| 1.4 | Bloqueo de Recetas si onboarding incompleto | Jhamil (UI) · Omar (lógica) |

### Sección 2 — Dashboard de Acciones

| # | Feature | Responsable |
|---|---|---|
| 2.1 | Cards visuales por Receta (5 cards) | Jhamil |
| 2.2 | Panel de métricas (clientes, campañas, costo IA) | Jhamil (UI) · Omar (endpoint) |
| 2.3 | Estado de ejecuciones recientes con badge | Jhamil |

### Sección 3 — Recetas de Acción (5 Recetas)

| # | Receta | Responsable |
|---|---|---|
| 3.1 | Reactivar Clientes Inactivos | Omar (backend+IA) · Jhamil (UI) |
| 3.2 | Campaña de Bienvenida | Omar · Jhamil |
| 3.3 | Seguimiento Post-Venta | Omar · Jhamil |
| 3.4 | Lanzamiento de Producto / Servicio | Omar · Jhamil |
| 3.5 | Propuesta Comercial Express | Omar · Jhamil |

### Sección 4 — Flujo de Aprobación y Ejecución

| # | Feature | Responsable |
|---|---|---|
| 4.1 | Preview editable por secciones (asunto/cuerpo/CTA) | Jhamil |
| 4.2 | Selector y vista de destinatarios antes de enviar | Jhamil |
| 4.3 | Botón "Aprobar y Enviar" → ejecución real (Resend) | Omar (backend) · Jhamil (UI) |
| 4.4 | Confirmación visual post-envío con métricas | Jhamil (UI) · Omar (endpoint) |
| 4.5 | Ciclo de estados visible en UI (badge animado) | Jhamil |

### Sección 5 — Historial y Analíticas

| # | Feature | Responsable |
|---|---|---|
| 5.1 | Historial de campañas ejecutadas | Jhamil (UI) · Omar (BD) |
| 5.2 | Panel de analíticas: KPIs del negocio | Jhamil (UI) · Omar (endpoint) |
| 5.3 | Exportar campaña como PDF / CSV | Jhamil |

### Sección 6 — Diferenciadores de UX

| # | Feature | Responsable |
|---|---|---|
| 6.1 | Indicador de IA procesando (mensajes dinámicos) | Jhamil |
| 6.2 | Indicador de costo estimado antes de ejecutar | Jhamil (UI) · Omar (cálculo) |
| 6.3 | LLM Fallback automático (OpenAI → Claude Haiku) | Omar |
| 6.4 | Personalización 1:1 (email diferente por cliente) | Omar |

---

## 📅 Cronograma — 5 Días

### Día 1 — Fundamentos y Setup
| Tarea | Responsable | Estado |
|---|---|---|
| Repo GitHub + branches configurados | Omar | ✅ |
| Schema Supabase: brand_brain + clients + tasks + RLS | Omar | ✅ |
| Proyecto Vite + React + TS inicializado | Omar + Jhamil | ✅ |
| Supabase Auth (login/register) | Omar | ✅ |
| Design system CSS dark mode (tokens, fuentes, colores) | Jhamil | ✅ |
| FastAPI corriendo + `GET /health` | Omar | 🔄 |

### Día 2 — Onboarding + Core Backend
| Tarea | Responsable | Estado |
|---|---|---|
| Formulario Brand Brain (UI + guardado en BD) | Jhamil + Omar | ✅ |
| Upload CSV + parser + preview + guardado en BD | Jhamil (UI) · Omar (backend) | 🔄 |
| JWT middleware + Supabase connection en FastAPI | Omar | 🔄 |
| `POST /api/onboarding/import-clients` | Omar | 🔄 |
| `GET /api/tasks` (historial básico) | Omar | 🔄 |

### Día 3 — Pipeline de IA + Recetas
| Tarea | Responsable | Estado |
|---|---|---|
| `llm_service.py` con fallback OpenAI → Claude Haiku | Omar | 🔄 |
| `agent_pipeline.py` — 3 agentes (Orquestador, Copywriter, Revisor) | Omar | 🔄 |
| Prompts por receta (5 templates) | Omar | 🔄 |
| `POST /api/recipes/run` | Omar | 🔄 |
| Dashboard 5 ActionCards + métricas (UI) | Jhamil | ✅ |
| Flujo de cada Receta en UI (formulario → preview) | Jhamil | 🔄 |

### Día 4 — Ejecución + Historial + Analíticas
| Tarea | Responsable | Estado |
|---|---|---|
| `email_service.py` con Resend API | Omar | 🔄 |
| `POST /api/tasks/{id}/approve` | Omar | 🔄 |
| `GET /api/analytics/summary` | Omar | 🔄 |
| Preview editable por secciones + Email Preview Visual | Jhamil | 🔄 |
| Badge de estado animado | Jhamil | 🔄 |
| Página de historial de campañas | Jhamil | 🔄 |
| Panel de analíticas en UI | Jhamil | 🔄 |

### Día 5 — Polish, Testing y Demo
| Tarea | Responsable | Estado |
|---|---|---|
| Deploy frontend en Vercel | Omar | 🔄 |
| Pruebas end-to-end del flujo completo | Omar + Jhamil | 🔄 |
| Exportar campaña como PDF | Jhamil | 🔄 |
| Demo al equipo BARAL | Todos | 🔄 |

---

## 🔗 Branches de Git

```
main          → demo estable
dev           → integración diaria
feat/frontend → Jhamil
feat/backend  → Omar
feat/ai       → Omar
feat/db       → Omar
```

---

## ✅ Definición de "Fase 1 Completada"

- [ ] Usuario completa onboarding (Brand Brain + CSV de clientes)
- [ ] Dashboard muestra 5 ActionCards funcionales
- [ ] Al menos 2 Recetas ejecutan el flujo completo end-to-end
- [ ] La IA genera contenido personalizado por cliente (no genérico)
- [ ] Los emails se envían realmente vía Resend API
- [ ] El estado de la tarea es auditable en UI (CREATED → COMPLETED)
- [ ] El historial muestra campañas con costo en USD
- [ ] El panel de analíticas muestra KPIs reales
- [ ] El frontend está desplegado en Vercel

---

## 📂 Archivos de Tareas por Persona

| Archivo | Contenido |
|---|---|
| [`DISTRIBUCION_TAREAS.md`](./DISTRIBUCION_TAREAS.md) | Tareas asignadas a Omar y Jhamil, con prioridades, estados y features adicionales |

---

## 🆕 Features Adicionales — Agregados al Plan (2026-06-30)

> Inspirados en el análisis de SaleADS.ai como referencia de UX/producto.
> Estas funciones se suman al plan existente. Las de Fase 1 van al sprint actual;
> las de Fase 2 entran al roadmap de escalabilidad.

---

### Feature A — "Mis Estrategias" (Biblioteca de Recetas Guardadas)

**Qué es:** Una sección dentro del Dashboard donde el usuario puede guardar configuraciones
de recetas que le funcionaron bien, para reutilizarlas con un clic sin volver a configurar
los parámetros desde cero.

**Por qué lo agregamos:** SaleADS tiene "+20 estrategias profesionales" como diferenciador.
Baral AI debe tener su propia biblioteca — no de estrategias genéricas, sino de las
estrategias propias de cada empresa, personalizadas con su historial real.

**Diferencia con SaleADS:** Las estrategias de SaleADS son plantillas genéricas.
Las de Baral AI son estrategias tuyas — guardadas de campañas que ya ejecutaste,
con tus parámetros, tus clientes, tu tono. Eso no se puede replicar.

**Flujo:**
```
[Campaña COMPLETED] → botón "Guardar como estrategia"
                           ↓
                    Nombre la estrategia: "Reactivación 60 días - Verano"
                           ↓
                    Aparece en "Mis Estrategias" del Dashboard
                           ↓
                    Un clic → se pre-cargan todos los parámetros
                           ↓
                    Solo confirmar y ejecutar
```

**Datos a guardar por estrategia:**
- Nombre personalizado (editable por el usuario)
- recipe_type
- params usados (dias_inactivo, limite, etc.)
- Promedio de agent_score de campañas con esa estrategia
- Última vez usada
- Número de veces ejecutada

**Cambios técnicos necesarios:**

| Capa | Cambio | Responsable |
|---|---|---|
| Supabase | Nueva tabla `saved_strategies` (ver schema arriba) | Omar |
| Backend | `POST /api/strategies` · `GET /api/strategies` · `DELETE /api/strategies/{id}` | Omar |
| Frontend | Sección "Mis Estrategias" en Dashboard · botón "Guardar" en pantalla de confirmación post-campaña | Jhamil |

**Fase:** Fase 1 (Sprint 2 / segunda ronda de features)

---

### Feature B — Vista Previa Visual de Campaña (Email Preview Realista)

**Qué es:** En la pantalla de Preview (paso 6 del flujo), además de los campos editables
de texto, mostrar una simulación visual de cómo se verá el email en la bandeja de entrada
del destinatario — con nombre, asunto, logo y cuerpo renderizado.

**Por qué lo agregamos:** SaleADS muestra cómo se verá el anuncio en el feed de Instagram/Facebook
antes de publicar. Ese mismo concepto de "preview realista" genera confianza y reduce
la tasa de rechazo. Aplicado al email, el usuario ve exactamente lo que va a recibir
su cliente — no texto plano en un formulario.

**Dos vistas en la pantalla Preview:**

```
┌─────────────────────────────────────────────────────────┐
│  MODO EDICIÓN          │  MODO PREVIEW VISUAL            │
│                        │                                 │
│  Asunto: [editable]    │  ┌─────────────────────────┐   │
│  Saludo: [editable]    │  │ 📧 Gmail / Outlook       │   │
│  Cuerpo: [editable]    │  │─────────────────────────│   │
│  CTA:    [editable]    │  │ De: TuEmpresa            │   │
│                        │  │ Para: María García       │   │
│  [ Editar ] [ Preview ]│  │ Asunto: Hola María, te   │   │
│                        │  │ echamos de menos...      │   │
│                        │  │─────────────────────────│   │
│                        │  │  [Logo empresa]          │   │
│                        │  │                          │   │
│                        │  │  Hola María,             │   │
│                        │  │  Hace 67 días que no     │   │
│                        │  │  te vemos...             │   │
│                        │  │                          │   │
│                        │  │  [Ver tu sesión →]       │   │
│                        │  └─────────────────────────┘   │
│                        │  Vista: [Escritorio] [Móvil]    │
└─────────────────────────────────────────────────────────┘
```

**Datos que usa el preview:**
- `draft_content.asunto` → subject line del email simulado
- `draft_content.saludo` + `draft_content.cuerpo` + `draft_content.cta` → cuerpo renderizado
- Primer destinatario de `recipients[]` como ejemplo (nombre real)
- Nombre comercial de `brand_brain` como remitente

**Vista móvil:** Toggle para simular cómo se ve en celular (importante — +60% de emails
se abren en móvil en LATAM).

**Cambios técnicos necesarios:**

| Capa | Cambio | Responsable |
|---|---|---|
| Frontend | Componente `EmailPreviewMock.tsx` — renderiza el contenido del draft en un div estilizado que simula un cliente de correo. Toggle escritorio/móvil. Sin cambios en backend. | Jhamil |

**Fase:** Fase 1 (puede implementarse con los datos que ya retorna el backend)

---

### Feature C — Estudio Multicanal + Generación de Contenido

Baral incorpora un **Estudio** (`/studio`) donde el usuario describe una campaña con un
**prompt**, la IA genera **texto + imagen/infografía**, y se muestra una **vista previa
realista** de cómo quedaría en cada red. El usuario puede crear **varias campañas** y verlas
en una lista. (Detalle completo en `FEATURES_INDEX.md` Sección 7.)

**Dos familias de acciones:**

| Familia | Canales | Qué hace Baral | Fase |
|---|---|---|---|
| Mensajes a clientes (1:1) | **Email** | Genera + **ENVÍA** (Resend) | Fase 1 |
| | WhatsApp | Genera + envía | Fase 2 |
| Contenido para redes (público) | **Instagram · Facebook · TikTok** | Genera texto + imagen → **preview** (no publica aún) | Esta fase |

**Generación de multimedia:** texto (LLM, ya) + imágenes/infografías (modelo de imagen,
~$0.01–0.04 c/u). **Video IA NO** en esta fase — TikTok se muestra como carrusel 9:16.

**Cambios técnicos:**

| Capa | Cambio | Responsable |
|---|---|---|
| Frontend | Página Estudio, mockups por red (`ChannelMocks.tsx`), `SocialPreview.tsx`, prompt + lista + preview fija | Jhamil |
| Backend | `POST /api/content/generate` (texto + imagen por canal), modelo de imagen, persistencia de campañas | Omar |

**Estado:** base de frontend ya implementada (con datos de ejemplo); pendiente conectar al
pipeline de generación real. Ver tareas en `DISTRIBUCION_TAREAS.md`.

---

### Nota sobre Publicación Directa en Redes (Fase Futura)

Generar contenido y previsualizarlo (lo de arriba) es de **esta fase**. **Publicar
automáticamente** en las redes es distinto y queda para más adelante:

**Canales y requisitos de publicación directa:**
- Email (Resend) — Fase 1, ya planificado (único que se envía hoy)
- WhatsApp Business — Meta Cloud API (número verificado + plantillas aprobadas) — Fase 2
- Instagram/Facebook orgánico — Meta Graph API (cuenta Business + OAuth + App Review) — Fase 3+
- TikTok orgánico — TikTok Content Posting API (más restrictivo, audit) — Fase 3+
- Pauta paga (como SaleADS) — Meta/Google Ads API — fuera de alcance

**Por qué la publicación directa no es ahora:**
- Cada canal agrega OAuth, manejo de tokens, refresh, y App Review de la plataforma (semanas)
- La propuesta de valor core ya está validada con email
- Mientras tanto, "generar + preview" entrega valor sin esa complejidad

---

*Creado el 21 de junio de 2026 | Baral AI — BARAL*
*Actualizado el 30 de junio de 2026 — Equipo reducido a 2 personas (Omar + Jhamil). Referencias a Saul eliminadas. Features A, B, C agregados. Schema `saved_strategies` y campo `website_url` incluidos. Añadido el Estudio multicanal (generar + preview) y la distinción entre generar/previsualizar (ahora) vs publicar directo (fase futura).*
