# 🤖 Baral AI — Backend Engine

Motor de ejecución de acciones de negocio e inteligencia artificial para la plataforma **Baral AI**. Desarrollado con FastAPI y optimizado para ejecutarse mediante `uv`.

---

## 🛠 Stack Tecnológico

* **Lenguaje:** Python v3.14+
* **Framework:** FastAPI v0.136+
* **Gestor de Entorno:** `uv` (Astral)
* **Orquestación IA:** OpenAI SDK (GPT-4o-mini) + Anthropic SDK (Claude Haiku como fallback)
* **Proveedor Email:** Resend API
* **Base de Datos:** Supabase (PostgreSQL + Auth SDK)
* **Validación:** Pydantic v2

---

## ⚙️ Variables de Entorno (`.env`)


```env
# Supabase (Base de Datos)
SUPABASE_URL
SUPABASE_SERVICE_KEY

# LLM Providers (IA)
OPENAI_API_KEY
ANTHROPIC_API_KEY

# Email Service
RESEND_API_KEY

# CORS / Clientes permitidos
FRONTEND_URL
```
---

## 🚀 Puesta en Marcha (Desarrollo Local)

### Opción A: Flujo moderno con `uv` (Recomendado)

`uv` gestiona el entorno virtual, resuelve dependencias e instala todo automáticamente en milisegundos.

1. Entra al directorio del servidor:
```bash
cd backend

```


2. Levanta el servidor con recarga en caliente:
```bash
uv run fastapi dev

```



---

### Opción B: Flujo clásico (`venv` + `pip`)

1. Posiciónate en la carpeta y crea el entorno virtual:
```bash
cd backend
python -m venv venv

```


2. Activa el entorno en Windows (`venv\Scripts\activate`) o en Mac/Linux (`source venv/bin/activate`).
3. Instala las dependencias y corre el servidor:
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

```



---

## 🧪 Verificación del Sistema (Smoke Tests)

El servidor correrá por defecto en `http://localhost:8000`.

* **Swagger UI (Docs interactivas):** [http://localhost:8000/docs](https://www.google.com/search?q=http://localhost:8000/docs)
* **Comprobación de salud por terminal:**
```bash
curl http://localhost:8000/health

```



### Endpoints Base (Fase Mock)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health` | Devuelve el latido, versión y entorno del motor. |
| `POST` | `/api/recipes/run` | Simula la generación de draft del pipeline de 3 agentes. |
| `GET` | `/api/tasks` | Devuelve el array simulado de campañas recientes. |
| `POST` | `/api/tasks/{id}/approve` | Simula la aprobación humana y gatillo de envío. |
| `GET` | `/api/analytics/summary` | Entrega los KPIs agregados del dashboard superior. |

---
