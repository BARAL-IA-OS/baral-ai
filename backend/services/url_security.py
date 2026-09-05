"""Network helpers that reject private/internal targets and unsafe redirects."""

import ipaddress
import socket
from urllib.parse import urljoin, urlparse

import httpx


class UnsafeUrlError(ValueError):
    pass


def normalize_public_url(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        raise UnsafeUrlError("La URL no puede estar vacia")
    if "://" not in raw:
        raw = "https://" + raw
    parsed = urlparse(raw)
    if parsed.scheme not in {"http", "https"}:
        raise UnsafeUrlError("Solo se permiten URLs HTTP o HTTPS")
    if not parsed.hostname or parsed.username or parsed.password:
        raise UnsafeUrlError("La URL no es valida")
    return parsed.geturl()


def assert_public_target(url: str) -> None:
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower().rstrip(".")
    if hostname in {"localhost", "localhost.localdomain"} or hostname.endswith(".local"):
        raise UnsafeUrlError("No se permiten direcciones internas")
    try:
        addresses = socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
    except socket.gaierror as exc:
        raise UnsafeUrlError("No se pudo resolver el dominio") from exc
    for entry in addresses:
        address = ipaddress.ip_address(entry[4][0])
        if not address.is_global:
            raise UnsafeUrlError("No se permiten direcciones privadas o reservadas")


def safe_get(url: str, *, max_bytes: int, allowed_content_prefixes: tuple[str, ...]) -> tuple[str, bytes, str]:
    current = normalize_public_url(url)
    headers = {"User-Agent": "BaralAI-BusinessDNA/1.0"}
    with httpx.Client(follow_redirects=False, timeout=15, headers=headers) as client:
        for _ in range(6):
            assert_public_target(current)
            with client.stream("GET", current) as response:
                if response.status_code in {301, 302, 303, 307, 308}:
                    location = response.headers.get("location")
                    if not location:
                        raise UnsafeUrlError("La redireccion no tiene destino")
                    current = urljoin(current, location)
                    continue
                response.raise_for_status()
                content_type = response.headers.get("content-type", "").split(";", 1)[0].lower()
                if not any(content_type.startswith(prefix) for prefix in allowed_content_prefixes):
                    raise UnsafeUrlError("El tipo de contenido no esta permitido")
                declared = response.headers.get("content-length")
                if declared and int(declared) > max_bytes:
                    raise UnsafeUrlError("El recurso excede el tamano permitido")
                chunks: list[bytes] = []
                total = 0
                for chunk in response.iter_bytes():
                    total += len(chunk)
                    if total > max_bytes:
                        raise UnsafeUrlError("El recurso excede el tamano permitido")
                    chunks.append(chunk)
                return current, b"".join(chunks), content_type
    raise UnsafeUrlError("La URL tiene demasiadas redirecciones")
