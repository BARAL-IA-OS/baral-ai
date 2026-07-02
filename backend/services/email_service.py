# backend/services/email_service.py
"""Envio real de campanas por email via Resend.

- Personaliza cada email reemplazando {{nombre}} y {{producto}} por cliente.
- Si no hay RESEND_API_KEY: modo dry-run (marca como enviado sin enviar).
- Si TEST_EMAIL_OVERRIDE esta seteada: redirige TODOS los envios a ese correo.
- Respeta un tope por ejecucion (MAX_EMAILS_PER_RUN).
"""
from dataclasses import dataclass, field
from html import escape

import config


@dataclass
class SendReport:
    sent: int = 0
    failed: int = 0
    provider: str = "stub"
    errors: list[str] = field(default_factory=list)


def _fill(text: str, client: dict) -> str:
    nombre = (client.get("nombre") or "").strip() or "alli"
    producto = (client.get("producto") or "").strip() or "tu compra"
    return (text or "").replace("{{nombre}}", nombre).replace("{{producto}}", producto)


def _render_html(draft: dict, client: dict) -> str:
    saludo = escape(_fill(draft.get("saludo", ""), client))
    cuerpo = escape(_fill(draft.get("cuerpo", ""), client))
    cta = escape(_fill(draft.get("cta", ""), client))
    return (
        f'<div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#222;line-height:1.6">'
        f"<p>{saludo}</p>"
        f"<p>{cuerpo}</p>"
        f'<p style="margin-top:20px">'
        f'<a href="#" style="background:#7c3aed;color:#fff;padding:10px 18px;'
        f'border-radius:8px;text-decoration:none;font-weight:600">{cta}</a>'
        f"</p></div>"
    )


def send_campaign(draft: dict, recipients: list[dict]) -> SendReport:
    """Envia el borrador personalizado a cada destinatario. Devuelve conteo."""
    report = SendReport()

    # Tope de seguridad (protege el limite diario del tier gratuito).
    targets = [r for r in recipients if r.get("email")][: config.MAX_EMAILS_PER_RUN]

    # Modo dry-run: sin key, no se envia nada realmente.
    if not config.RESEND_API_KEY:
        report.provider = "stub"
        report.sent = len(targets)
        return report

    import resend

    resend.api_key = config.RESEND_API_KEY
    report.provider = "resend"

    for client in targets:
        to_addr = config.TEST_EMAIL_OVERRIDE or client["email"]
        try:
            resend.Emails.send(
                {
                    "from": config.RESEND_FROM,
                    "to": [to_addr],
                    "subject": _fill(draft.get("asunto", "Novedades"), client),
                    "html": _render_html(draft, client),
                }
            )
            report.sent += 1
        except Exception as exc:
            report.failed += 1
            if len(report.errors) < 10:
                report.errors.append(f"{client.get('email')}: {exc}")

    return report
