# Integración de Baral Audit en Baral AI

Baral AI ejecuta la auditoría en su propio backend. No consume otro despliegue ni requiere una URL de servicio de auditoría.

## Arquitectura

- `backend/routers/audits.py`: consentimiento, límites, idempotencia, historial y persistencia por usuario.
- `backend/services/audit_engine.py`: motor AUDITOR-X integrado; obtiene y analiza HTML, cabeceras, robots, sitemap, `llms.txt` y enlaces.
- `frontend/src/pages/Audit.tsx`: autorización previa, ejecución, scores, hallazgos P0–P3, roadmap y exportación.
- `website_audit_consents` y `website_audit_runs`: trazabilidad en Supabase con RLS.

## Procedencia funcional

El motor Python porta la lógica determinista del proyecto local `BARAL/baral-audit`, especialmente las responsabilidades de:

- `lib/security/safe-remote-fetch.ts`
- `lib/scanner/fetcher.ts`
- `lib/scanner/analyzer.ts`
- `lib/scanner/agent-readiness.ts`

La adaptación a Python evita mantener un segundo servicio en producción y conserva el contrato de resultados esperado por la interfaz de Baral AI.

## Seguridad y límites

- Solo acepta HTTP/HTTPS públicos.
- Bloquea localhost, IP privadas, reservadas y credenciales embebidas.
- Revalida DNS y destino en cada redirección.
- Limita redirecciones, tamaño descargado, enlaces inspeccionados y auditorías por usuario.
- Exige consentimiento versionado antes de visitar el sitio.

La auditoría visual con navegador y capturas no forma parte de esta primera integración; `coverage.visualEvidence` se devuelve en `false` de forma explícita.
