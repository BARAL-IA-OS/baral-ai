from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


LifecycleStatus = Literal["new", "active", "inactive", "vip", "do_not_contact"]


class ClientInput(BaseModel):
    nombre: str = Field(min_length=1, max_length=180)
    email: EmailStr | None = None
    telefono: str | None = Field(default=None, max_length=50)
    company: str | None = Field(default=None, max_length=180)
    producto: str | None = Field(default=None, max_length=180)
    interest: str | None = Field(default=None, max_length=180)
    source: str | None = Field(default=None, max_length=120)
    lifecycle_status: LifecycleStatus = "new"
    ultima_compra: date | None = None
    last_purchase_amount: float | None = Field(default=None, ge=0)
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None
    contact_consent: bool = True


class ClientUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=180)
    email: EmailStr | None = None
    telefono: str | None = Field(default=None, max_length=50)
    company: str | None = Field(default=None, max_length=180)
    producto: str | None = Field(default=None, max_length=180)
    interest: str | None = Field(default=None, max_length=180)
    source: str | None = Field(default=None, max_length=120)
    lifecycle_status: LifecycleStatus | None = None
    ultima_compra: date | None = None
    last_purchase_amount: float | None = Field(default=None, ge=0)
    tags: list[str] | None = None
    notes: str | None = None
    contact_consent: bool | None = None


class ClientImportMapping(BaseModel):
    mapping: dict[str, str]


class ConfirmClientImport(BaseModel):
    duplicate_strategy: Literal["skip", "update"] = "skip"


class ClientSegmentInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    filters: dict[str, Any] = Field(default_factory=dict)
