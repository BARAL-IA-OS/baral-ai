import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import HTTPException
from routers.creative import _resource_ids


class CampaignResourceTests(unittest.TestCase):
    def test_empty_selection_does_not_query_database(self):
        with patch("routers.creative.get_supabase") as database:
            self.assertEqual(_resource_ids("owner", []), [])
            database.assert_not_called()

    def test_rejects_filenames_instead_of_persisted_resources(self):
        with self.assertRaises(HTTPException) as error:
            _resource_ids("owner", ["photo.png"])
        self.assertEqual(error.exception.status_code, 400)

    @patch("routers.creative.get_supabase")
    def test_looks_up_resources_only_for_current_owner(self, database):
        asset_id = "861b0885-a90b-4f46-95f5-c684ffec6f12"
        query = MagicMock()
        database.return_value.table.return_value = query
        query.select.return_value = query
        query.eq.return_value = query
        query.in_.return_value = query
        query.execute.return_value = SimpleNamespace(data=[{"id": asset_id, "mime_type": "image/png"}])
        self.assertEqual(_resource_ids("owner", [asset_id, asset_id]), [asset_id])
        query.eq.assert_any_call("user_id", "owner")
        query.eq.assert_any_call("status", "active")
        query.execute.return_value = SimpleNamespace(data=[])
        with self.assertRaises(HTTPException):
            _resource_ids("another-owner", [asset_id])
