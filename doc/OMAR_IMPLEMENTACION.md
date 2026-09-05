# Implementación de la suite creativa de Omar

Estado: implementada en el código local y validada con TypeScript, ESLint, build de Vite y pruebas backend.

## Módulos entregados

- `/campaigns`: entrada conversacional, dictado, producto, recursos, audiencia, formato, canales, sugerencias desde el ADN y brief editable.
- `/studio/:campaignId`: campaña persistida, identidad real, contenido independiente por canal, edición, regeneración parcial, versiones, costo, proveedor y estado.
- `/photoshoot`: sesión guiada o libre, referencias, escena, estilo, formato, variantes, prompt negativo, descarga y guardado privado.
- `/brand-book`: portada, 3–7 imágenes privadas, preview, versión y PDF generado desde datos estructurados.
- `/audit`: consentimiento versionado, motor Baral Audit integrado en FastAPI, validación anti-SSRF también en redirecciones, análisis HTML/SEO/accesibilidad/rendimiento/conversión, scores, P0–P3, roadmap y exportación JSON/PDF mediante impresión estructurada.

## Activación en infraestructura

1. Ejecutar `doc/sql_omar_creative_suite.sql` en Supabase SQL Editor.
2. Redesplegar backend y frontend. Auditoría no necesita una URL ni un despliegue externo: el motor vive en `backend/services/audit_engine.py`.
3. Verificar que `OPENAI_API_KEY` esté configurada para Photoshoot. Sin esa llave la UI devuelve indisponibilidad real y no simula una generación.

El bucket `content-images` queda privado y el backend emite URLs firmadas temporales. Las políticas RLS y todos los endpoints filtran por `user_id`.

## Dependencia con Jhamil

Los accesos de Catálogo y Recursos se muestran deshabilitados hasta incorporar las pantallas y contratos de ADN de Jhamil. Campañas ya degrada de forma segura usando productos existentes en Clientes y excluye registros `no_contactar` cuando el campo está disponible.
