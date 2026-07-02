# Distribucion de Tareas — Baral AI Fase 1
> Equipo actual: Omar Quispe (Tech Lead & Full Stack) + Jhamil (Frontend Developer)
> Saul salio del equipo. Sus tareas pendientes quedan reasignadas a Omar.
> Actualizado: 2026-06-30

---

## Estado de Partida

### Lo que ya esta hecho (no se toca)

**Omar:**
- [x] Proyecto Supabase creado y variables de entorno configuradas
- [x] Tablas `brand_brain`, `clients`, `tasks` creadas con RLS activo
- [x] Auth por email habilitado en Supabase
- [x] Frontend conectado a Supabase
- [x] Tipos TypeScript en `frontend/src/types/index.ts`
- [x] API wrapper base en `frontend/src/lib/api.ts`
- [x] Onboarding redirige a dashboard si Brand Brain ya existe
- [x] Guardado de Brand Brain hace upsert (no duplica)

**Jhamil:**
- [x] Login visual implementado
- [x] Sidebar y layout base implementados
- [x] Dashboard visual con cards y metricas base
- [x] Onboarding visual implementado con formulario Brand Brain
- [x] CSV upload con drag/drop y preview basico
- [x] Paginas base: Dashboard, Onboarding, Recipe, Preview, History, Analytics
- [x] `npm run lint` pasa limpio
- [x] `npm run build` pasa sin errores

**Saul (entregado antes de salir):**
- [x] Estructura base del backend: `routers/`, `services/`, `models/`, `prompts/`
- [x] `main.py` con FastAPI + CORS configurado
- [x] Dependencias instaladas en `.venv`
- [x] `.env` backend preparado localmente

---

## OMAR QUISPE — Tech Lead & Full Stack

### Prioridad 1 — Backend: Infraestructura Base ✅ (2026-07-01)
> El frontend esta bloqueado hasta que estos endpoints respondan.

- [x] `GET /health` — devuelve `{ status, service, version, supabase_configured }` (`routers/health.py`)
- [x] Middleware JWT — dependencia `get_current_user` valida el token de Supabase (`dependencies/auth.py`)
      · Endpoint de prueba `GET /api/me` protegido (`routers/auth.py`)
      · El frontend debe mandar `Authorization: Bearer <access_token de Supabase>`
- [x] Conectar backend a Supabase con `SUPABASE_SERVICE_KEY` en `services/db_service.py`
      (cliente singleton; usa service_role = BYPASSA RLS → filtrar por `user_id` en cada query)
      · Dependencia agregada al proyecto uv: `supabase==2.31.0`

### Prioridad 2 — Backend: Endpoints Core
> Implementar en este orden, de menos a mas complejo.

- [ ] `POST /api/onboarding/import-clients` — parsear CSV con Pandas, insertar filas en tabla `clients`, retornar conteo
- [ ] `GET /api/tasks` — listar tareas del usuario autenticado (filtrar por `user_id` del JWT)
- [ ] `GET /api/analytics/summary` — agregar datos de `tasks`: total, completadas, costo total, score promedio

### Prioridad 3 — Backend: Pipeline de IA
> El nucleo del producto. Implementar en `services/`.

- [ ] `llm_service.py` — clase `LLMService` con:
  - Llamada a OpenAI `gpt-4o-mini` (temperatura 0.3, output JSON)
  - Fallback automatico a Claude Haiku si OpenAI retorna 429/500
  - Logging de `tokens_used` y `cost_usd` por llamada
- [ ] `agent_pipeline.py` — orquestar los 3 agentes en secuencia:
  1. Orquestador: interpreta receta + filtra clientes de DB segun parametros
  2. Copywriter: genera email personalizado por cliente (asunto, saludo, cuerpo, CTA)
  3. Revisor: verifica prohibiciones del Brand Brain, puntua 0-10, regenera si score < 7
- [ ] Completar system prompts en `prompts/orchestrator.py`, `prompts/copywriter.py`, `prompts/reviewer.py`
- [ ] `POST /api/recipes/run` — endpoint que:
  - Crea tarea en DB con status `CREATED`
  - Ejecuta pipeline de agentes (status → `PROCESSING` → `PENDING_APPROVAL`)
  - Retorna `{ task_id, status, draft_content, recipients, cost_usd }`

### Prioridad 4 — Backend: Ejecucion Real
- [ ] `email_service.py` — integrar Resend API para envio real de emails
- [ ] `POST /api/tasks/{id}/approve` — endpoint que:
  - Verifica que la tarea pertenece al usuario (ownership check)
  - Cambia status a `APPROVED` → `EXECUTING`
  - Llama a `email_service` para enviar emails a todos los destinatarios
  - Actualiza status a `COMPLETED` o `FAILED` con detalle en `error_log`

### Prioridad 5 — Full Stack: Features Propios Pendientes
- [ ] Probar flujo completo Auth → Brand Brain → Dashboard en cuenta nueva/limpia
- [ ] Agregar campo opcional `website_url` al Brand Brain:
  - Supabase: columna `website_url TEXT` en tabla `brand_brain`
  - Frontend: campo opcional al final del formulario de onboarding
- [ ] Validar contratos de API contra respuestas reales del backend una vez implementados
- [ ] Endpoint futuro `POST /api/brand/analyze-url` (segunda ronda, no bloquea MVP)

### Prioridad 6 — Feature A: "Mis Estrategias" — Backend (Sprint 2)
> Implementar despues de que el flujo de recetas completo este funcionando.

- [ ] Crear tabla `saved_strategies` en Supabase con RLS activo:
  ```sql
  CREATE TABLE saved_strategies (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES auth.users(id) NOT NULL,
    name         TEXT NOT NULL,
    recipe_type  TEXT NOT NULL,
    params       JSONB NOT NULL,
    times_used   INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] `POST /api/strategies` — guardar estrategia (name, recipe_type, params del task_id)
- [ ] `GET /api/strategies` — listar estrategias del usuario autenticado
- [ ] `DELETE /api/strategies/{id}` — eliminar (verificar ownership)

---

## JHAMIL — Frontend Developer

### Prioridad 1 — Integracion con Backend (desbloquea cuando Omar entregue endpoints)
> Reemplazar datos mock/estaticos con llamadas reales a la API.

- [ ] Conectar CSV upload (`CSVUpload.tsx`) al endpoint `POST /api/onboarding/import-clients`
  - Mostrar conteo real de clientes importados: "X clientes importados correctamente"
  - Manejar errores de formato de CSV con mensaje claro al usuario
- [ ] Conectar flujo de Receta (`RecipeFlow.tsx` / `Recipe.tsx`) a `POST /api/recipes/run`
  - Mostrar mensajes de progreso mientras la IA procesa (CREATED → PROCESSING)
  - Navegar automaticamente a `/preview/:taskId` cuando retorna `PENDING_APPROVAL`
- [ ] Conectar pagina Preview (`Preview.tsx`) a los datos reales del `task_id`
  - Mostrar `draft_content` editable (asunto, saludo, cuerpo, CTA)
  - Mostrar lista de destinatarios (`recipients`)
  - Mostrar costo estimado (`cost_usd`) y score del revisor (`agent_score`)
  - Boton "Aprobar y Enviar" conectado a `POST /api/tasks/{id}/approve`
- [ ] Conectar historial (`History.tsx` / `TaskList.tsx`) a `GET /api/tasks`
- [ ] Conectar analytics (`Analytics.tsx`) a `GET /api/analytics/summary`

### Prioridad 2 — Pulir UI/UX
- [ ] Corregir textos con caracteres de encoding roto que aparezcan en la UI
- [ ] Ocultar o deshabilitar botones de OAuth (Google, etc.) si no se van a implementar
- [ ] Pulir estados vacios en todas las paginas (cuando no hay clientes, no hay tareas, etc.)
- [ ] Pulir estados de error con mensajes claros al usuario
- [ ] Pulir estados de loading con skeleton o spinner consistente

### Prioridad 3 — UX del Flujo de Aprobacion
- [ ] Badge animado de estado de tarea visible en Dashboard y en Preview
- [ ] Confirmacion visual post-envio: "X emails enviados · $X.XX USD · Campana guardada"
- [ ] Opcion de regenerar secciones del email desde la pantalla Preview

### Prioridad 4 — Feature B: Email Preview Visual (Sprint 2)
> Componente puro de frontend, sin dependencias de backend nuevo.
> Implementar cuando el flujo de aprobacion basico este funcional.

- [ ] Componente `EmailPreviewMock.tsx` — simula visualmente como se ve el email en un cliente de correo
  - Usa datos de `draft_content` (asunto, saludo, cuerpo, CTA) del task actual
  - Muestra nombre real del primer destinatario de `recipients[]`
  - Muestra nombre de empresa de `brand_brain` como remitente
- [ ] Toggle "Editar / Preview" en la pantalla Preview (`/preview/:taskId`)
- [ ] Toggle de vista: [Escritorio] / [Movil] (importante — +60% emails en LATAM se abren en movil)

### Prioridad 5 — Feature A: "Mis Estrategias" (Sprint 2)
> Requiere que Omar entregue los 3 endpoints de estrategias.
> Implementar despues de que el flujo completo de recetas funcione.

- [ ] Seccion "Mis Estrategias" en el Dashboard — lista de estrategias guardadas del usuario
- [ ] Boton "Guardar como estrategia" en la pantalla de confirmacion post-campana (COMPLETED)
  - Modal con input para nombrar la estrategia (ej. "Reactivacion 60 dias - Verano")
  - Llamada a `POST /api/strategies`
- [ ] Card de estrategia guardada: nombre, recipe_type, veces ejecutada, ultima vez usada
- [ ] Clic en card → pre-carga parametros en la receta correspondiente y navega a `/recipe/:type`
- [ ] Boton eliminar estrategia (llamada a `DELETE /api/strategies/{id}`)

---

## 🆕 ESTUDIO MULTICANAL Y GENERACION DE CONTENIDO (añadido 2026-06-30)

> Baral pasa de "solo email" a generar contenido para varios canales.
> Dos familias: **Mensajes a clientes** (Email se ENVIA, WhatsApp luego) y
> **Contenido para redes** (Instagram/Facebook/TikTok: solo generar + preview, no publica aun).
> Detalle completo en `FEATURES_INDEX.md` Seccion 7.

### YA HECHO en esta sesion (base lista, NO rehacer)
- [x] Pagina **Estudio** `/studio` con layout 2 columnas (genera+lista | preview fija)
- [x] Mockups realistas por red en `components/preview/ChannelMocks.tsx`:
      Email (Gmail), WhatsApp, Instagram, Facebook, TikTok (9:16)
- [x] `components/preview/SocialPreview.tsx` — **selector de canal tipo dropdown** + **vista celular a pantalla completa** (solo movil, sin scroll, tamaño unico que siempre cabe)
- [x] `pages/Studio.tsx` — prompt (fijo arriba) + lista "Mis campañas" **con scroll propio** (crear varias / eliminar) + preview fija full-height a la derecha
- [x] Tipos `ChannelType` y `SocialDraft` en `types/index.ts`
- [x] Sidebar: nuevo item **Estudio**; arreglado bug de "Configuracion" (apuntaba a /analytics → ahora deshabilitado "Pronto")
- [x] **TopBar eliminado** (ocupaba espacio): campana (Notificaciones) y "Cerrar sesion" movidos al **sidebar** (seccion CUENTA)

### JHAMIL — Pendiente (sobre la base ya creada)
- [ ] Cargar el **Brand Brain real** en los mockups (nombre, handle, iniciales) en vez de "Studio Foto" fijo
      (hoy en `SocialPreview.tsx` const `SAMPLE` y en `Studio.tsx` const `BRAND`)
- [ ] Cuando el backend genere imagen, renderizarla real en `GeneratedMedia` (hoy es placeholder)
- [ ] Conectar el boton **"Generar campaña"** al endpoint de generacion (ver Omar abajo)
- [ ] Listar/persistir las **campañas reales** del usuario (hoy viven solo en estado local)
- [ ] Agrupar el **Dashboard** en las 2 familias (Mensajes a clientes / Contenido para redes),
      con cards que naveguen al Estudio con el canal preseleccionado
- [ ] (Opcional) edicion inline del texto generado antes de ver el preview

### OMAR — Backend de generacion (desbloquea lo de Jhamil)
- [ ] `POST /api/content/generate` — recibe `{ prompt, channels[], brand_brain }` y devuelve por canal
      `{ texto, hashtags, cta, imagen_url }`
- [ ] Integrar **modelo de imagen** (gpt-image-1 / DALL·E 3 / Flux) para imagenes e infografias
      (~$0.01–0.04 por imagen; NO video IA en esta fase)
- [ ] Persistencia de campañas: tabla `campaigns` (o reutilizar `tasks` con columna `channel`)
- [ ] Email se mantiene como el unico canal que se **ENVIA** de verdad (Resend); el resto = generar + preview

---

## Orden de Trabajo Recomendado

```
Semana actual:
  Omar:   Prioridad 1 backend (health + JWT + Supabase)
  Jhamil: Prioridad 2 UI/UX (pulir lo que ya existe)

Cuando Omar entregue /health y /tasks mock:
  Omar:   Prioridad 2 backend (import-clients, tasks, analytics)
  Jhamil: Prioridad 1 integracion (historial + analytics primero)

Cuando Omar entregue /recipes/run:
  Omar:   Prioridad 3 (pipeline IA)
  Jhamil: Prioridad 1 integracion (recipe flow + preview)

Cierre:
  Omar:   Prioridad 4 (Resend + approve endpoint)
  Jhamil: Prioridad 1 integracion (approve button + confirmacion)
  Ambos:  Pruebas end-to-end + demo
```

---

## Definition of Done — Fase 1 (sin cambios)

- [ ] Usuario puede registrarse e iniciar sesion
- [ ] Usuario completa Brand Brain y queda guardado
- [ ] Usuario puede subir clientes desde CSV
- [ ] Dashboard muestra las 5 recetas funcionales
- [ ] Al menos 1 receta genera preview con IA real
- [ ] Usuario aprueba y el email se envia via Resend
- [ ] Historial muestra tareas con su estado
- [ ] Analytics muestra KPIs reales
- [ ] Frontend desplegado en Vercel
- [ ] Backend corre localmente para la demo

---

## Fuente de Verdad de Contratos

```text
frontend/src/types/index.ts
```

Tipos actuales: `RecipeType`, `TaskStatus`, `BrandBrain`, `Client`, `Task`,
`RunRecipeRequest`, `RunRecipeResponse`, `AnalyticsSummary`

Omar actualiza este archivo cada vez que un endpoint cambia su contrato.
Jhamil no modifica los tipos — consulta a Omar si necesita un campo nuevo.
