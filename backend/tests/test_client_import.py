import unittest

from routers.clients import _mapped_rows


class ClientImportTests(unittest.TestCase):
    def test_maps_and_detects_database_duplicate(self):
        rows, errors = _mapped_rows(
            [{"Nombre": "Ana", "Correo": "ANA@example.com", "Fecha": "04/09/2026"}],
            {"Nombre": "nombre", "Correo": "email", "Fecha": "ultima_compra"},
            [{"id": "existing", "email": "ana@example.com", "telefono": None}],
        )
        self.assertEqual(errors, [])
        self.assertEqual(rows[0]["_duplicate_id"], "existing")
        self.assertEqual(rows[0]["ultima_compra"], "2026-09-04")

    def test_detects_duplicate_inside_file(self):
        rows, _ = _mapped_rows(
            [{"name": "Uno", "phone": "+591 700-100"}, {"name": "Dos", "phone": "591700100"}],
            {"name": "nombre", "phone": "telefono"},
            [],
        )
        self.assertEqual(rows[1]["_duplicate_row"], 2)

    def test_skips_row_without_name(self):
        rows, errors = _mapped_rows([{"name": "", "email": "a@example.com"}], {"name": "nombre", "email": "email"}, [])
        self.assertEqual(rows, [])
        self.assertTrue(errors)


if __name__ == "__main__":
    unittest.main()
