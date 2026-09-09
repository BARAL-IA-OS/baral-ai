import unittest
from unittest.mock import patch

import config
from services.llm_service import LLMService


class LLMProviderSelectionTests(unittest.TestCase):
    @patch("openai.OpenAI")
    def test_openai_only_ignores_deepseek_and_anthropic(self, openai_client):
        with (
            patch.object(config, "OPENAI_API_KEY", "openai-test-key"),
            patch.object(config, "DEEPSEEK_API_KEY", "deepseek-test-key"),
            patch.object(config, "ANTHROPIC_API_KEY", "anthropic-test-key"),
        ):
            service = LLMService(openai_only=True)

        openai_client.assert_called_once_with(api_key="openai-test-key")
        self.assertIsNotNone(service._openai)
        self.assertIsNone(service._deepseek)
        self.assertIsNone(service._anthropic)


if __name__ == "__main__":
    unittest.main()
