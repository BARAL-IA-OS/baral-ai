# Distribucion de Tareas — Baral AI Fase 1
> Equipo actual: Omar Quispe (Tech Lead & Full Stack) + Jhamil (Frontend Developer)
> Saul salio del equipo. Sus tareas pendientes quedan reasignadas a Omar.
> Actualizado: 2026-07-03

---

## 🎨 Rediseño de interfaz ✅ (2026-07-03, Omar)

- [x] **Modo Light** (`useTheme` + `data-theme`, default light, persistido; toggle en dropdown de cuenta).
- [x] **Pagina de bienvenida** `/welcome` (`useWelcomeSeen`, integrada en `HomeRedirect`).
- [x] **Sidebar colapsable** (solo iconos + tooltips; estado persistido).
- [x] **Cuenta como dropdown**: Notificaciones, Configuracion→/profile, toggle tema, **barra de uso de tokens**
      (`TokenUsageBar` lee `getUsage()`), Cerrar sesion.
- [x] **Brand Brain con modal por campo** (`InfoUploadModal`, estilo `doc/subir_info.png`): cada campo es un boton.
- [x] Campo opcional **`website_url`** + boton "Solicitar mi pagina".
- [x] **Perfil `/profile`** (editar nombre, empresa, logo local).
- [x] **Estudio conectado** al backend (`generateContent` + `generateImage`), dictado por voz.
- [x] **Persistencia de campañas del Estudio** en Supabase (`studio_campaigns`) con RLS.
- [x] **Historial unificado**: muestra recetas (`tasks`) + campañas generadas en Estudio (`studio_campaigns`).
- [x] Cards interactivos; `MetricsPanel` y `RecentTasks` con datos reales.

> ⚠️ **PENDIENTE OMAR (bloqueante):** correr `doc/sql_website_url.sql` en Supabase
> (`ALTER TABLE brand_brain ADD COLUMN website_url TEXT`). Sin esto, **guardar el Brand Brain falla**.
>
> Pendientes menores: inyectar Brand Brain real en el preview del Estudio (hoy usa datos de ejemplo);
> voz-a-texto en `InfoUploadModal` (placeholder).
> SQL nuevo ya ejecutado por Omar: `doc/sql_studio_campaigns.sql`.

---

## 🧠 Ingestión del Brand Brain (URL / documento) ✅ (2026-07-03, Omar)

> Autocompletar el Brand Brain desde la web de la empresa o un documento.

**Backend:**
- [x] `services/brand_extract_service.py` — URL (`httpx` + `trafilatura`, fallback BeautifulSoup) o
      archivo (PDF `pypdf`, DOCX `python-docx`, MD/TXT) → texto → `llm_service` estructura los campos.
- [x] `POST /api/brand/extract-url` (JSON `{ url }`) y `POST /api/brand/extract-file` (multipart).
      Devuelven `{ fields: {industria, propuesta, tono, audiencia, diferenciador}, raw_text, chars }`.
      Registran el gasto en `usage_events`.
- [x] Deps uv: `trafilatura`, `beautifulsoup4`, `pypdf`, `python-docx`.
- [x] Probado real: extrajo resend.com (~$0.0008) y un .md; llenó los 5 campos.

**Frontend:**
- [x] `BrandExtractModal.tsx` — tabs URL / Documento → extrae → **editor de campos** (revisar/editar) → aplicar.
- [x] **Card de URL como primero** en `BrandBrainForm` ("Autocompletar con tu página web").
- [x] Contrato tipado: `extractBrandFromUrl` / `extractBrandFromFile` + `BrandExtractResponse`.

> Notas: sitios 100% JS pueden devolver poco (degradar a manual); `prohibiciones` NO se autocompleta
> (la define el usuario). No auto-guarda: aplica al form y el usuario confirma antes de "Guardar Brand Brain".

**Ajustes (2026-07-03):**
- [x] La extracción ahora saca **primero el nombre de la empresa** (`nombre_empresa`) → se guarda en
      `user_metadata.company_name` (misma fuente que el Perfil). El **Dashboard saluda con ese nombre**
      (antes usaba `industria`, por eso salía el texto largo). Sin nueva columna: NO requiere SQL.
- [x] Se **quitó la caja manual "URL de tu página web"** del form (redundante con el card de arriba).
      La URL analizada se guarda en `website_url`. El botón **"Solicitar mi página"** se movió al modal
      (pestaña URL: "¿No tienes página web? Solicita la tuya").

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

### Prioridad 2 — Backend: Endpoints Core ✅ (2026-07-01)
> Todos protegidos con JWT; el `user_id` sale del token (ya NO se pasa por query param).

- [x] `POST /api/onboarding/import-clients` — recibe CSV (multipart `file`), parsea con stdlib `csv`
      (mapeo flexible de encabezados, valida nombre+email, normaliza fechas), inserta en `clients`
      con `user_id`. Devuelve `{ imported, skipped, columns_detected, errors }`.
      · Nota: se uso `csv` de la stdlib en vez de Pandas (mas liviano, sin dependencia pesada).
- [x] `GET /api/tasks?limit=20` — tareas del usuario (filtra por `user_id` del JWT, orden desc).
- [x] `GET /api/analytics/summary` — agrega `tasks`: `{ total_tasks, completed_tasks, total_cost_usd, average_agent_score }` (contrato `AnalyticsSummary`).
> Probado contra Supabase real: queries + insert/delete E2E OK.
> **Para Jhamil:** estos endpoints requieren `Authorization: Bearer <access_token>`; ya NO mandar `?user_id=`.

### Prioridad 3 — Backend: Pipeline de IA ✅ (2026-07-01)
> El nucleo del producto. Implementado en `services/` + `prompts/`.

- [x] `llm_service.py` — `LLMService.complete_json()`:
  - OpenAI `gpt-4o-mini` (JSON mode, temperatura configurable) como primario.
  - Fallback automatico a **Claude Haiku 4.5** (`claude-haiku-4-5`) si OpenAI falla (429/500/red/parseo).
  - Registra `tokens` y `cost_usd` por llamada (precios por 1M tokens).
- [x] `agent_pipeline.py` — 3 agentes en secuencia:
  1. Orquestador: filtra clientes en codigo segun receta (dias_inactivo / dias_postventa / dias_registro).
  2. Copywriter: genera email plantilla con marcadores `{{nombre}}`/`{{producto}}`.
  3. Revisor: puntua 0-10 y verifica prohibiciones; **regenera 1 vez si score < 7** (cap de costo).
- [x] System prompts en `prompts/copywriter.py`, `prompts/reviewer.py`, `prompts/orchestrator.py`.
- [x] `POST /api/recipes/run` — crea tarea `PROCESSING`, corre pipeline, guarda draft/recipients/tokens/cost/score, pasa a `PENDING_APPROVAL`. Devuelve `{ task_id, status, draft_content, recipients, tokens_used, cost_usd, agent_score, provider }`.
> **Sin API keys aun:** el pipeline usa un fallback determinista local (`provider: "stub"`, costo 0) para que el flujo funcione. Al setear `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` en `backend/.env`, usa IA real automaticamente.
> Probado contra Supabase real: filtro de clientes, revisor de prohibiciones, y persistencia de `tasks` E2E OK.
> Dependencias uv agregadas: `openai`, `anthropic`.
> **Proveedor de PRUEBAS (DeepSeek):** si `DEEPSEEK_API_KEY` esta en `backend/.env`, el pipeline lo usa primero (compatible con el SDK de OpenAI, `base_url=https://api.deepseek.com`) para no gastar en OpenAI/Anthropic durante desarrollo. NO cambia el plan real (OpenAI primario + Anthropic fallback): con la key vacia, ese orden vuelve a aplicar. Probado E2E con IA real (`deepseek-chat`): borrador en tono de marca, score 9, ~$0.0004/tarea.

### Prioridad 4 — Backend: Ejecucion Real ✅ (2026-07-02)
- [x] `email_service.py` — `send_campaign()` con Resend:
  - Personaliza cada email ({{nombre}}/{{producto}}) y arma HTML.
  - Sin `RESEND_API_KEY`: modo dry-run (marca enviado sin enviar).
  - `TEST_EMAIL_OVERRIDE`: redirige TODO a un correo (evita spamear clientes).
  - Tope `MAX_EMAILS_PER_RUN` (default 25) para proteger el limite diario.
- [x] `POST /api/tasks/{id}/approve` — ownership check por JWT, solo desde `PENDING_APPROVAL`,
  `EXECUTING` -> envia -> `COMPLETED` (o `FAILED` si todo falla) con `completed_at`.
  Devuelve `{ status, emails_sent, emails_failed, provider, errors }`.
> Probado con envio REAL vía Resend: 1 email entregado; flujo approve E2E `PENDING_APPROVAL -> COMPLETED` OK.
> Dependencia uv: `resend`.
> ⚠️ **Limite de Resend sin dominio:** solo entrega al correo de la cuenta (`juanrammamani105@gmail.com`).
>   Para enviar a clientes reales o a otro correo, **verificar un dominio** en resend.com/domains y
>   cambiar `RESEND_FROM` a ese dominio. Por eso `TEST_EMAIL_OVERRIDE=juanrammamani105@gmail.com` por ahora.
  - Actualiza status a `COMPLETED` o `FAILED` con detalle en `error_log`

### Prioridad 5 — Full Stack: Features Propios Pendientes
- [ ] Probar flujo completo Auth → Brand Brain → Dashboard en cuenta nueva/limpia
- [ ] Agregar campo opcional `website_url` al Brand Brain:
  - Supabase: columna `website_url TEXT` en tabla `brand_brain`
  - Frontend: campo opcional al final del formulario de onboarding
- [ ] Validar contratos de API contra respuestas reales del backend una vez implementados
- [ ] Endpoint futuro `POST /api/brand/analyze-url` (segunda ronda, no bloquea MVP)

### Prioridad 6 — Feature A: "Mis Estrategias" — Backend ✅ (2026-07-02, Jhamil)
- [x] Tabla `saved_strategies` creada en Supabase con RLS.
- [x] `POST /api/strategies` — guardar estrategia (`{ name, task_id }`).
- [x] `GET /api/strategies` — listar estrategias del usuario.
- [x] `DELETE /api/strategies/{id}` — eliminar (ownership check).
- [x] Router `strategies` registrado en `main.py`.

### Extra de Jhamil — Regenerar campo del email con IA ✅ (2026-07-02)
- [x] `POST /api/tasks/{id}/regenerate` — regenera UN campo (asunto/saludo/cuerpo/cta) con el
      pipeline, conservando las demas ediciones. Suma costo/tokens y actualiza score.
- [x] Frontend: boton "Regenerar con IA" por campo en el Preview (`regenerateTaskField` en `api.ts`).

---

## JHAMIL — Frontend Developer

### Prioridad 1 — Integracion con Backend ✅ (2026-07-02, Jhamil)
> Datos mock reemplazados por llamadas reales a la API.

- [x] CSV upload (`CSVUpload.tsx`) → `POST /api/onboarding/import-clients` (conteo real, errores).
- [x] Flujo de Receta (`RecipeParams.tsx`) → `POST /api/recipes/run` con hook `useRecipeRunner`
      (stepper del pipeline + navegacion automatica a `/preview/:taskId`).
- [x] Preview (`Preview.tsx`) → detalle real via `useTask` + `getTask`: draft editable, destinatarios,
      costo y score. Boton "Aprobar y Enviar" → `POST /api/tasks/{id}/approve`.
- [x] Historial (`History.tsx`) → lee `GET /api/tasks` + `studio_campaigns` de Supabase.
- [x] Analytics (`Analytics.tsx`) → `GET /api/analytics/summary`.
- [x] **Human Gate real:** el draft editado se envia y persiste (`approveTask(id, draft)`).

> **Correcciones de Omar sobre este avance (2026-07-02):**
> - Lint roto en `Onboarding.tsx` (setState sincrono en effect) → arreglado.
> - Desajuste de parametro: el front enviaba `{ dias }` y el orquestador leia `dias_inactivo`;
>   el backend ahora acepta `dias` generico como fallback (el valor del usuario ya se respeta).
> - Endpoint nuevo `GET /api/tasks/{id}` (detalle) + `approve` acepta `draft_content` editado.

### Prioridad 2 — Pulir UI/UX
- [ ] Corregir textos con caracteres de encoding roto que aparezcan en la UI
- [ ] Ocultar o deshabilitar botones de OAuth (Google, etc.) si no se van a implementar
- [ ] Pulir estados vacios en todas las paginas (cuando no hay clientes, no hay tareas, etc.)
- [ ] Pulir estados de error con mensajes claros al usuario
- [ ] Pulir estados de loading con skeleton o spinner consistente

### Prioridad 3 — UX del Flujo de Aprobacion ✅ (2026-07-02, Jhamil)
- [x] Badge de estado de tarea (`TaskStatusBadge`) en Dashboard, Historial y Preview.
- [x] Confirmacion visual post-envio (success card: correos enviados, costo, guardar estrategia).
- [x] Regenerar secciones del email con IA por campo desde el Preview.

### Prioridad 4 — Feature B: Email Preview Visual ✅ (2026-07-02, Jhamil)
- [x] `EmailPreviewMock.tsx` — simula el email (asunto, saludo, cuerpo, CTA, remitente del Brand Brain).
- [x] Layout split en el Preview: editor a la izquierda, preview en vivo a la derecha.
- [x] Toggle de vista Escritorio / Movil (con bezel de celular).

### Prioridad 5 — Feature A: "Mis Estrategias" — UI ✅ (2026-07-02, Jhamil)
- [x] Componente `SavedStrategies.tsx` en el Dashboard (lista de estrategias del usuario).
- [x] Boton "Guardar como estrategia" + modal para nombrarla en la confirmacion post-campana.
- [x] Card de estrategia; clic → pre-carga params y navega a `/recipe/:type` (via `location.state`).
- [x] Boton eliminar estrategia (`DELETE /api/strategies/{id}`).

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
- [x] Renderizar imagen real en `GeneratedMedia` cuando `generateImage` devuelve `image_url` o `image_b64`
- [x] Conectar el boton **"Generar campaña"** al endpoint de generacion (`generateContent` + `generateImage`).
- [x] Listar/persistir las **campañas reales** del usuario en `studio_campaigns`.
- [x] Historial incluye acciones del Estudio junto a recetas ejecutadas.
- [ ] Agrupar el **Dashboard** en las 2 familias (Mensajes a clientes / Contenido para redes),
      con cards que naveguen al Estudio con el canal preseleccionado
- [ ] (Opcional) edicion inline del texto generado antes de ver el preview

### OMAR — Backend de generacion (desbloquea lo de Jhamil)
- [x] `POST /api/content/generate` ✅ (2026-07-02) — recibe `{ prompt, channels[] }`, usa el Brand Brain
      del usuario y devuelve `items[]` por canal con `{ channel, subject?, caption, hashtags?, cta, media_alt }`.
      Una sola llamada LLM para todos los canales (respeta el cap de costo); fallback stub sin keys.
      Probado real con DeepSeek (5 canales, ~$0.0006).
      **Para Jhamil:** contrato tipado listo en `frontend/src/lib/api.ts` → `generateContent({ prompt, channels? })`
      y tipos `ContentItem` / `GenerateContentResponse` en `types/index.ts`. Solo conectar la UI del Estudio.
- [x] **Modelo de imagen** ✅ (2026-07-02) — `POST /api/content/image` con OpenAI `gpt-image-1`
      (calidad `low`), **bajo demanda** (una a la vez) para cuidar el saldo. Probado real: **$0.011/imagen**.
      - La imagen se **guarda en Supabase Storage** (bucket publico `content-images`) → devuelve `image_url`.
      - **Costo real** calculado desde `usage` (tokens), no estimado.
      - Decision documentada en `doc/llm_image.md`.
      **Para Jhamil:** `generateImage(mediaAlt)` en `api.ts` → mostrar `image_url` en el mockup del Estudio.
- [x] **Registro de gasto** ✅ — `usage_service` registra cada generacion (texto + imagen) en `usage_events`.
      `GET /api/usage/summary` (`getUsage`) devuelve el total gastado y desglose por tipo.
      ⚠️ **Pendiente Omar:** correr `doc/sql_usage_events.sql` en Supabase para activar el registro
      (hasta entonces degrada silencioso: no rompe nada, pero no acumula). Para Jhamil: `getUsage()` para
      mostrar "gastado en generacion" en la plataforma.
- [x] Persistencia de campañas: tabla `studio_campaigns` con RLS (`doc/sql_studio_campaigns.sql`).
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
- [x] Historial muestra recetas y campañas del Estudio con cards, filtros y metadata
- [ ] Analytics muestra KPIs reales
- [ ] Frontend desplegado en Vercel
- [ ] Backend corre localmente para la demo

---

## Fuente de Verdad de Contratos

```text
frontend/src/types/index.ts
```

Tipos actuales: `RecipeType`, `ChannelType`, `SocialDraft`, `TaskStatus`, `BrandBrain`, `Client`,
`Task`, `RunRecipeRequest`, `RunRecipeResponse`, `ApproveTaskResponse`, `ImportClientsResponse`,
`AnalyticsSummary`

Omar actualiza este archivo cada vez que un endpoint cambia su contrato.
Jhamil no modifica los tipos — consulta a Omar si necesita un campo nuevo.

### ✅ Contratos alineados con el backend real (2026-07-02)
`frontend/src/lib/api.ts` ya coincide con las respuestas reales del backend y manda el JWT
de Supabase automaticamente. Funciones listas para que Jhamil las use:

- `importClients(file)` → `POST /api/onboarding/import-clients` (multipart) → `{ imported, skipped, columns_detected, errors }`
- `runRecipe({ recipe_type, params })` → `{ task_id, status, draft_content, recipients, tokens_used, cost_usd, agent_score }`
- `getTasks(limit?)` → `Task[]` (desenvuelve el `{ tasks }` del backend)
- `approveTask(id)` → `{ status, emails_sent, emails_failed, errors }`
- `getAnalytics()` → `AnalyticsSummary`

> Ya NO se pasa `user_id`: sale del JWT. Todas requieren sesion Supabase activa.
