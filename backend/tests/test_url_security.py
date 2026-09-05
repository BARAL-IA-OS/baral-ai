import unittest

from services.url_security import UnsafeUrlError, assert_public_target, normalize_public_url


class UrlSecurityTests(unittest.TestCase):
    def test_adds_https_to_plain_domain(self):
        self.assertEqual(normalize_public_url("example.com"), "https://example.com")

    def test_rejects_non_http_protocol(self):
        with self.assertRaises(UnsafeUrlError):
            normalize_public_url("file:///etc/passwd")

    def test_rejects_credentials(self):
        with self.assertRaises(UnsafeUrlError):
            normalize_public_url("https://user:secret@example.com")

    def test_rejects_loopback(self):
        with self.assertRaises(UnsafeUrlError):
            assert_public_target("http://127.0.0.1/admin")


if __name__ == "__main__":
    unittest.main()
