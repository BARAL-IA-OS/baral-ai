import unittest
from unittest.mock import patch

import httpx
from fastapi import HTTPException

from services.audit_engine import _safe_fetch, analyze_document, validate_public_url
from services.rate_limit import _events, enforce_rate_limit


class AuditSecurityTests(unittest.TestCase):
    def test_rejects_localhost_before_dns(self):
        with self.assertRaises(HTTPException) as context:
            validate_public_url("http://localhost:3000/admin")
        self.assertEqual(context.exception.status_code, 400)

    @patch("services.audit_engine.socket.getaddrinfo")
    def test_rejects_private_address(self, resolve):
        resolve.return_value = [(None, None, None, None, ("192.168.1.10", 443))]
        with self.assertRaises(HTTPException):
            validate_public_url("https://intranet.example.com")

    @patch("services.audit_engine.socket.getaddrinfo")
    def test_accepts_public_https_and_removes_fragment(self, resolve):
        resolve.return_value = [(None, None, None, None, ("93.184.216.34", 443))]
        url, domain = validate_public_url("example.com/page#section")
        self.assertEqual(url, "https://example.com/page")
        self.assertEqual(domain, "example.com")

    def test_internal_engine_returns_baral_audit_contract(self):
        result = analyze_document(
            url="https://example.com",
            domain="example.com",
            status=200,
            headers={},
            html="<html><body><h2>Pagina de ejemplo</h2></body></html>",
            ttfb_ms=120,
            robots_text=None,
            sitemap_text=None,
            llms_text=None,
            link_checks=[],
        )
        self.assertEqual(result["domain"], "example.com")
        self.assertIn("overall", result["scores"])
        self.assertIn("agentReadiness", result)
        self.assertTrue(any(item["title"] == "Sin etiqueta title" for item in result["findings"]))


class AuditFetchTests(unittest.IsolatedAsyncioTestCase):
    @patch("services.audit_engine.socket.getaddrinfo")
    async def test_revalidates_redirect_destination(self, resolve):
        resolve.return_value = [(None, None, None, None, ("93.184.216.34", 443))]

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(302, headers={"location": "http://localhost/admin"}, request=request)

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with self.assertRaises(HTTPException) as context:
                await _safe_fetch(client, "https://example.com")
        self.assertEqual(context.exception.status_code, 400)

    @patch("services.audit_engine.socket.getaddrinfo")
    async def test_caps_downloaded_body(self, resolve):
        resolve.return_value = [(None, None, None, None, ("93.184.216.34", 443))]

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=b"a" * 100, request=request)

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            page = await _safe_fetch(client, "https://example.com", max_bytes=10)
        self.assertEqual(page.text, "a" * 10)


class RateLimitTests(unittest.TestCase):
    def tearDown(self):
        _events.clear()

    def test_rejects_request_over_limit(self):
        enforce_rate_limit("user", "test", 1)
        with self.assertRaises(HTTPException) as context:
            enforce_rate_limit("user", "test", 1)
        self.assertEqual(context.exception.status_code, 429)


if __name__ == "__main__":
    unittest.main()
