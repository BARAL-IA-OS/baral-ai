# backend/services/llm_service.py
"""Servicio LLM con fallback automatico.

Primario:  OpenAI gpt-4o-mini (JSON mode)
Fallback:  Anthropic Claude Haiku 4.5  (si OpenAI falla con 429/500/errores)

Registra tokens y costo por llamada. Si no hay API keys, `available` es False
y el pipeline usa una generacion determinista local (sin costo).
"""
import json
from dataclasses import dataclass, field

import config

OPENAI_MODEL = "gpt-4o-mini"
ANTHROPIC_MODEL = "claude-haiku-4-5"

# Precios USD por 1M tokens: (input, output)
_PRICING = {
    OPENAI_MODEL: (0.15, 0.60),
    ANTHROPIC_MODEL: (1.00, 5.00),
}


class LLMUnavailable(RuntimeError):
    """No hay proveedor de IA disponible o todos fallaron."""


@dataclass
class LLMResult:
    data: dict
    tokens: int
    cost_usd: float
    provider: str


def _cost(model: str, in_tokens: int, out_tokens: int) -> float:
    price_in, price_out = _PRICING[model]
    return round(in_tokens / 1_000_000 * price_in + out_tokens / 1_000_000 * price_out, 6)


def _extract_json(text: str) -> dict:
    """Parsea JSON tolerando fences ```json ... ``` o texto alrededor."""
    text = (text or "").strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.lstrip().lower().startswith("json"):
            text = text.lstrip()[4:]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


@dataclass
class LLMService:
    _openai: object = field(default=None, init=False)
    _anthropic: object = field(default=None, init=False)

    def __post_init__(self):
        if config.OPENAI_API_KEY:
            from openai import OpenAI

            self._openai = OpenAI(api_key=config.OPENAI_API_KEY)
        if config.ANTHROPIC_API_KEY:
            import anthropic

            self._anthropic = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    @property
    def available(self) -> bool:
        return bool(self._openai or self._anthropic)

    def complete_json(self, system: str, user: str, temperature: float = 0.3, max_tokens: int = 1024) -> LLMResult:
        """Devuelve JSON parseado + uso. Intenta OpenAI y cae a Anthropic."""
        errors = []

        if self._openai is not None:
            try:
                return self._openai_json(system, user, temperature, max_tokens)
            except Exception as exc:  # 429/500/parseo/red -> intentar fallback
                errors.append(f"openai: {exc}")

        if self._anthropic is not None:
            try:
                return self._anthropic_json(system, user, temperature, max_tokens)
            except Exception as exc:
                errors.append(f"anthropic: {exc}")

        raise LLMUnavailable("; ".join(errors) or "No hay API keys de IA configuradas")

    def _openai_json(self, system, user, temperature, max_tokens) -> LLMResult:
        resp = self._openai.chat.completions.create(
            model=OPENAI_MODEL,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        data = _extract_json(resp.choices[0].message.content)
        usage = resp.usage
        cost = _cost(OPENAI_MODEL, usage.prompt_tokens, usage.completion_tokens)
        return LLMResult(data, usage.total_tokens, cost, f"openai:{OPENAI_MODEL}")

    def _anthropic_json(self, system, user, temperature, max_tokens) -> LLMResult:
        msg = self._anthropic.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system + "\n\nResponde UNICAMENTE con JSON valido.",
            messages=[{"role": "user", "content": user}],
        )
        text = "".join(block.text for block in msg.content if block.type == "text")
        data = _extract_json(text)
        in_tok, out_tok = msg.usage.input_tokens, msg.usage.output_tokens
        cost = _cost(ANTHROPIC_MODEL, in_tok, out_tok)
        return LLMResult(data, in_tok + out_tok, cost, f"anthropic:{ANTHROPIC_MODEL}")
