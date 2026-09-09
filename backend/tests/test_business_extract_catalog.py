import unittest

from services.business_extract_service import (
    _candidate_page_links,
    _html_catalog,
    _jsonld_catalog,
    _palette_from_styles,
    _page_data,
)


class BusinessCatalogExtractionTests(unittest.TestCase):
    def test_extracts_and_normalises_css_brand_palette(self):
        palette = _palette_from_styles([
            ".brand { color: #abc; background: rgb(44, 255, 192); } "
            ":root { --e-global-color-primary: #171626; --brand-accent: #722BF5; }",
        ])

        self.assertEqual(palette[:4], ["#171626", "#722BF5", "#AABBCC", "#2CFFC0"])

    def test_discovers_offer_page_from_link_text_when_url_is_opaque(self):
        page = _page_data(
            "https://example.com/",
            '<a href="/ser/">Ver todos nuestros servicios</a>',
        )

        self.assertEqual(_candidate_page_links(page), ["https://example.com/ser/"])

    def test_extracts_services_from_headings_without_structured_data(self):
        page = _page_data(
            "https://example.com/servicios/",
            """
            <title>Servicios</title>
            <h2>Todo lo que tu marca necesita</h2><p>Introduccion general.</p>
            <h2>Marketing Digital</h2><p>Campanas y contenido para redes sociales.</p>
            <h2>Consultoria Estrategica</h2><p>Planes de crecimiento a medida.</p>
            <h2>Contacto</h2><p>Escribenos hoy.</p>
            """,
        )

        items = _html_catalog([page])

        self.assertEqual([item["name"] for item in items[:2]], ["Marketing Digital", "Consultoria Estrategica"])
        self.assertTrue(all(item["kind"] == "service" for item in items[:2]))

    def test_extracts_products_nested_in_item_list_jsonld(self):
        page = _page_data(
            "https://example.com/tienda",
            """
            <script type="application/ld+json">
            {"@type":"ItemList","itemListElement":[
              {"@type":["Product","Thing"],"name":"Cafe Especial","category":"Cafe",
               "offers":[{"price":"45.50","priceCurrency":"BOB"}]}
            ]}
            </script>
            """,
        )

        items = _jsonld_catalog([page])

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["name"], "Cafe Especial")
        self.assertEqual(items[0]["price"], "45.50")
        self.assertEqual(items[0]["currency"], "BOB")


if __name__ == "__main__":
    unittest.main()
