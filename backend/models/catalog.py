from typing import Literal

from pydantic import BaseModel, Field


class CatalogItemInput(BaseModel):
    kind: Literal["product", "service"]
    name: str = Field(min_length=1, max_length=180)
    category: str | None = Field(default=None, max_length=120)
    description: str | None = None
    price: float | None = Field(default=None, ge=0)
    currency: str = Field(default="BOB", min_length=3, max_length=3)
    cta: str | None = Field(default=None, max_length=240)
    featured: bool = False
    source_url: str | None = None


class CatalogItemUpdate(BaseModel):
    kind: Literal["product", "service"] | None = None
    name: str | None = Field(default=None, min_length=1, max_length=180)
    category: str | None = Field(default=None, max_length=120)
    description: str | None = None
    price: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    cta: str | None = Field(default=None, max_length=240)
    featured: bool | None = None
    status: Literal["active", "archived"] | None = None
    source_url: str | None = None
