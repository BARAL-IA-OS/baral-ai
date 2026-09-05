from typing import Any, Literal

from pydantic import BaseModel, Field


BusinessDNASection = Literal[
    "identity",
    "positioning",
    "audience_profile",
    "communication",
    "visual_identity",
    "operations",
    "social_proof",
]


class SaveBusinessDNASectionRequest(BaseModel):
    value: dict[str, Any] = Field(default_factory=dict)
    onboarding_step: int | None = Field(default=None, ge=0, le=11)
    onboarding_path: Literal["url", "manual"] | None = None


class CompleteOnboardingRequest(BaseModel):
    confirmed_source_ids: list[str] = Field(default_factory=list)


class StartExtractionRequest(BaseModel):
    url: str


class ConfirmExtractionRequest(BaseModel):
    sections: dict[BusinessDNASection, dict[str, Any]]
    catalog_items: list[dict[str, Any]] = Field(default_factory=list)
    source_ids: list[str] = Field(default_factory=list)
