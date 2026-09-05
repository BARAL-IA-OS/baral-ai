import unittest

from services.business_dna_service import serialize_business_dna


class BusinessDNACompatibilityTests(unittest.TestCase):
    def test_legacy_columns_are_exposed_as_structured_sections(self):
        result = serialize_business_dna({
            "id": "dna-1",
            "industria": "Fotografia",
            "propuesta": "Recuerdos duraderos",
            "tono": "Cercano",
            "audiencia": "Familias",
            "diferenciador": "Entrega rapida",
            "prohibiciones": "Promesas absolutas",
            "website_url": "https://example.com",
            "onboarding_step": 0,
            "completion_percentage": 50,
        })
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["sections"]["identity"]["industry"], "Fotografia")
        self.assertEqual(result["sections"]["communication"]["tone"], "Cercano")


if __name__ == "__main__":
    unittest.main()
