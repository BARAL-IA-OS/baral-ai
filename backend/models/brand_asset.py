from typing import Literal

from pydantic import BaseModel, Field


BrandAssetType = Literal[
    "logo",
    "product",
    "photo",
    "background",
    "reference",
    "previous_piece",
]


class BrandAssetUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = None
    tags: list[str] | None = None
    asset_type: BrandAssetType | None = None
    status: Literal["active", "archived"] | None = None
    catalog_item_id: str | None = None
