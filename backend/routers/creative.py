"""Campanas, Photoshoot, recursos generados y Brand Book de Baral AI."""
from __future__ import annotations

from datetime import datetime, timezone
from io import BytesIO
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from dependencies.auth import CurrentUser, get_current_user
from services.content_service import CHANNELS, generate_content
from services.db_service import get_supabase
from services.image_service import generate_image
from services.usage_service import log_usage
from services.rate_limit import enforce_rate_limit

router = APIRouter(tags=["Creative suite"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _db_error(exc: Exception) -> HTTPException:
    return HTTPException(
        status_code=503,
        detail=(
            "La suite creativa aun no esta inicializada en Supabase. "
            "Ejecuta doc/sql_omar_creative_suite.sql. Detalle: " + str(exc)
        ),
    )


def _brand_for(user_id: str) -> dict[str, Any]:
    result = (
        get_supabase().table("brand_brain").select("*")
        .eq("user_id", user_id).order("updated_at", desc=True).limit(1).execute()
    )
    if not result.data:
        raise HTTPException(status_code=400, detail="Primero completa el ADN de tu negocio")
    return result.data[0]


def _campaign(user_id: str, campaign_id: str) -> dict[str, Any]:
    try:
        result = (
            get_supabase().table("creative_campaigns").select("*")
            .eq("id", campaign_id).eq("user_id", user_id).limit(1).execute()
        )
    except Exception as exc:
        raise _db_error(exc) from exc
    if not result.data:
        raise HTTPException(status_code=404, detail="Campana no encontrada")
    return result.data[0]


class CampaignBrief(BaseModel):
    objective: str = ""
    product: str = ""
    audience: str = ""
    offer_cta: str = ""
    tone: str = ""
    channels: list[str] = Field(default_factory=list)
    format: str = "Publicacion multicanal"
    resources: list[str] = Field(default_factory=list)
    restrictions: str = ""


class CreateBriefRequest(BaseModel):
    prompt: str
    product: str = ""
    audience: str = ""
    aspect_ratio: str = "1:1"
    channels: list[str] = Field(default_factory=lambda: ["instagram", "facebook"])
    resources: list[str] = Field(default_factory=list)
    idempotency_key: str | None = None


class UpdateBriefRequest(BaseModel):
    brief: CampaignBrief


class GenerateCampaignRequest(BaseModel):
    brief: CampaignBrief | None = None
    idempotency_key: str | None = None


class RegenerateChannelRequest(BaseModel):
    instruction: str = ""
    idempotency_key: str | None = None


class UpdateChannelRequest(BaseModel):
    content: dict[str, Any]


@router.post("/campaigns/brief")
async def create_campaign_brief(
    request: CreateBriefRequest, user: CurrentUser = Depends(get_current_user)
):
    prompt = request.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Describe la campana que quieres crear")
    valid_channels = [channel for channel in request.channels if channel in CHANNELS]
    if not valid_channels:
        raise HTTPException(status_code=400, detail="Selecciona al menos un canal valido")

    brand = _brand_for(user.id)
    enforce_rate_limit(user.id, "creacion de briefs", 12)
    if request.idempotency_key:
        try:
            existing = (
                get_supabase().table("creative_campaigns").select("*")
                .eq("user_id", user.id).eq("idempotency_key", request.idempotency_key)
                .limit(1).execute()
            )
            if existing.data:
                return {"success": True, "campaign": existing.data[0]}
        except Exception as exc:
            raise _db_error(exc) from exc
    brief = CampaignBrief(
        objective=prompt,
        product=request.product.strip() or brand.get("propuesta", ""),
        audience=request.audience.strip() or brand.get("audiencia", ""),
        offer_cta="Invitar a la audiencia a conocer la propuesta",
        tone=brand.get("tono", "Claro y cercano"),
        channels=valid_channels,
        format=f"Piezas {request.aspect_ratio} adaptadas por canal",
        resources=request.resources,
        restrictions=brand.get("prohibiciones", ""),
    ).model_dump()
    campaign_id = str(uuid4())
    row = {
        "id": campaign_id,
        "user_id": user.id,
        "name": " ".join(prompt.split()[:6]),
        "prompt": prompt,
        "brief": brief,
        "status": "BRIEF",
        "content_by_channel": {},
        "versions": [],
        "aspect_ratio": request.aspect_ratio,
        "channels": valid_channels,
        "selected_assets": request.resources,
        "idempotency_key": request.idempotency_key,
        "cost_usd": 0,
        "tokens_used": 0,
        "provider": "structured",
        "created_at": _now(),
        "updated_at": _now(),
    }
    try:
        result = get_supabase().table("creative_campaigns").insert(row).execute()
    except Exception as exc:
        raise _db_error(exc) from exc
    return {"success": True, "campaign": result.data[0] if result.data else row}


@router.patch("/campaigns/{campaign_id}/brief")
async def update_campaign_brief(
    campaign_id: str,
    request: UpdateBriefRequest,
    user: CurrentUser = Depends(get_current_user),
):
    _campaign(user.id, campaign_id)
    result = (
        get_supabase().table("creative_campaigns")
        .update({"brief": request.brief.model_dump(), "updated_at": _now()})
        .eq("id", campaign_id).eq("user_id", user.id).execute()
    )
    return {"success": True, "campaign": result.data[0]}


@router.get("/campaigns")
async def list_campaigns(user: CurrentUser = Depends(get_current_user)):
    try:
        result = (
            get_supabase().table("creative_campaigns").select("*")
            .eq("user_id", user.id).order("created_at", desc=True).execute()
        )
    except Exception as exc:
        raise _db_error(exc) from exc
    return {"campaigns": result.data or []}


@router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, user: CurrentUser = Depends(get_current_user)):
    return {"campaign": _campaign(user.id, campaign_id)}


@router.post("/campaigns/{campaign_id}/generate")
async def generate_campaign_content(
    campaign_id: str,
    request: GenerateCampaignRequest,
    user: CurrentUser = Depends(get_current_user),
):
    campaign = _campaign(user.id, campaign_id)
    enforce_rate_limit(user.id, "generacion de campanas", 6)
    if (
        request.idempotency_key
        and campaign.get("last_generation_key") == request.idempotency_key
        and campaign.get("status") == "READY"
    ):
        return {"success": True, "campaign": campaign}
    brand = _brand_for(user.id)
    brief = request.brief.model_dump() if request.brief else campaign.get("brief", {})
    channels = [channel for channel in brief.get("channels", campaign.get("channels", [])) if channel in CHANNELS]
    prompt = "\n".join(
        f"{label}: {brief.get(key, '')}" for label, key in (
            ("Objetivo", "objective"), ("Producto", "product"),
            ("Audiencia", "audience"), ("Oferta y CTA", "offer_cta"),
            ("Tono", "tone"), ("Formato", "format"), ("Restricciones", "restrictions"),
        )
    )
    result = generate_content(prompt, channels, brand)
    by_channel = {item["channel"]: item for item in result["items"]}
    versions = campaign.get("versions") or []
    versions.append({"number": len(versions) + 1, "created_at": _now(), "content": by_channel})
    update = {
        "brief": brief,
        "status": "READY",
        "content_by_channel": by_channel,
        "versions": versions[-20:],
        "tokens_used": (campaign.get("tokens_used") or 0) + result["tokens_used"],
        "cost_usd": round((campaign.get("cost_usd") or 0) + result["cost_usd"], 6),
        "provider": result["provider"],
        "last_generation_key": request.idempotency_key,
        "updated_at": _now(),
    }
    saved = (
        get_supabase().table("creative_campaigns").update(update)
        .eq("id", campaign_id).eq("user_id", user.id).execute()
    )
    log_usage(user.id, "campaign", result["provider"], result["cost_usd"], result["tokens_used"])
    return {"success": True, "campaign": saved.data[0]}


@router.post("/campaigns/{campaign_id}/channels/{channel}/regenerate")
async def regenerate_campaign_channel(
    campaign_id: str,
    channel: str,
    request: RegenerateChannelRequest,
    user: CurrentUser = Depends(get_current_user),
):
    if channel not in CHANNELS:
        raise HTTPException(status_code=400, detail="Canal no soportado")
    campaign = _campaign(user.id, campaign_id)
    enforce_rate_limit(user.id, "regeneracion por canal", 10)
    if request.idempotency_key and any(
        version.get("idempotency_key") == request.idempotency_key
        for version in (campaign.get("versions") or [])
    ):
        return {"success": True, "campaign": campaign}
    brand = _brand_for(user.id)
    brief = campaign.get("brief", {})
    prompt = f"{brief.get('objective', campaign.get('prompt', ''))}\nAjuste: {request.instruction}".strip()
    result = generate_content(prompt, [channel], brand)
    content = campaign.get("content_by_channel") or {}
    content[channel] = result["items"][0]
    versions = campaign.get("versions") or []
    versions.append({"number": len(versions) + 1, "created_at": _now(), "channel": channel, "content": result["items"][0], "idempotency_key": request.idempotency_key})
    update = {
        "content_by_channel": content,
        "versions": versions[-20:],
        "tokens_used": (campaign.get("tokens_used") or 0) + result["tokens_used"],
        "cost_usd": round((campaign.get("cost_usd") or 0) + result["cost_usd"], 6),
        "provider": result["provider"],
        "updated_at": _now(),
    }
    saved = (
        get_supabase().table("creative_campaigns").update(update)
        .eq("id", campaign_id).eq("user_id", user.id).execute()
    )
    log_usage(user.id, "campaign-channel", result["provider"], result["cost_usd"], result["tokens_used"])
    return {"success": True, "campaign": saved.data[0]}


@router.patch("/campaigns/{campaign_id}/channels/{channel}")
async def update_campaign_channel(
    campaign_id: str,
    channel: str,
    request: UpdateChannelRequest,
    user: CurrentUser = Depends(get_current_user),
):
    if channel not in CHANNELS:
        raise HTTPException(status_code=400, detail="Canal no soportado")
    campaign = _campaign(user.id, campaign_id)
    content = campaign.get("content_by_channel") or {}
    current = content.get(channel) or {"channel": channel}
    allowed = {
        key: value for key, value in request.content.items()
        if key in {"subject", "caption", "hashtags", "cta", "media_alt"}
    }
    content[channel] = {**current, **allowed, "channel": channel}
    versions = campaign.get("versions") or []
    versions.append({
        "number": len(versions) + 1, "created_at": _now(), "channel": channel,
        "content": content[channel], "source": "manual",
    })
    saved = (
        get_supabase().table("creative_campaigns")
        .update({"content_by_channel": content, "versions": versions[-20:], "updated_at": _now()})
        .eq("id", campaign_id).eq("user_id", user.id).execute()
    )
    return {"success": True, "campaign": saved.data[0]}


class PhotoshootRequest(BaseModel):
    product: str
    prompt: str = ""
    negative_prompt: str = ""
    scene: str = "Estudio limpio"
    style: str = "Editorial"
    aspect_ratio: str = "1:1"
    variants: int = Field(default=1, ge=1, le=4)
    reference_assets: list[str] = Field(default_factory=list)
    idempotency_key: str | None = None


@router.post("/photoshoots/generate")
async def generate_photoshoot(
    request: PhotoshootRequest, user: CurrentUser = Depends(get_current_user)
):
    if not request.product.strip():
        raise HTTPException(status_code=400, detail="Selecciona o describe un producto")
    brand = _brand_for(user.id)
    enforce_rate_limit(user.id, "photoshoot", 4, 300)
    base_prompt = (
        f"Fotografia publicitaria profesional de {request.product}. Escena: {request.scene}. "
        f"Estilo: {request.style}. Formato: {request.aspect_ratio}. "
        f"Identidad de marca: {brand.get('propuesta', '')}; tono {brand.get('tono', '')}. "
        f"Instruccion: {request.prompt or 'resaltar el producto de forma autentica'}. "
        f"Evitar: {request.negative_prompt or brand.get('prohibiciones', '')}."
    )
    assets: list[dict[str, Any]] = []
    total_cost = 0.0
    total_tokens = 0
    for index in range(request.variants):
        image = generate_image(f"{base_prompt} Variacion visual {index + 1}.", user_id=user.id)
        if not image.image_url and not image.b64:
            if not assets:
                raise HTTPException(status_code=503, detail=image.error or "Generacion de imagen no disponible")
            break
        asset = {
            "id": str(uuid4()), "user_id": user.id, "kind": "photoshoot",
            "storage_path": image.storage_path, "url": image.image_url,
            "image_b64": image.b64, "prompt": base_prompt,
            "status": "GENERATED", "provider": image.provider,
            "cost_usd": image.cost_usd, "tokens_used": image.tokens,
            "metadata": request.model_dump(), "created_at": _now(),
        }
        try:
            stored = get_supabase().table("generated_assets").insert(asset).execute()
            asset = stored.data[0] if stored.data else asset
        except Exception as exc:
            raise _db_error(exc) from exc
        assets.append(asset)
        total_cost += image.cost_usd
        total_tokens += image.tokens
    log_usage(user.id, "photoshoot", assets[0]["provider"], total_cost, total_tokens)
    return {"success": True, "assets": assets, "cost_usd": round(total_cost, 6), "tokens_used": total_tokens}


@router.get("/generations/{asset_id}")
async def get_generation_status(asset_id: str, user: CurrentUser = Depends(get_current_user)):
    result = (
        get_supabase().table("generated_assets").select("*")
        .eq("id", asset_id).eq("user_id", user.id).limit(1).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Generacion no encontrada")
    return {"generation": result.data[0]}


class SaveAssetRequest(BaseModel):
    name: str = "Recurso generado"
    campaign_id: str | None = None


@router.post("/assets/upload")
async def upload_asset(
    file: UploadFile = File(...), user: CurrentUser = Depends(get_current_user)
):
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="El recurso debe ser una imagen")
    data = await file.read()
    if not data or len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen debe pesar entre 1 byte y 8 MB")
    enforce_rate_limit(user.id, "subida de recursos", 20, 300)
    extension = (file.filename or "image.png").rsplit(".", 1)[-1].lower()
    if extension not in {"png", "jpg", "jpeg", "webp"}:
        extension = "png"
    path = f"{user.id}/uploads/{uuid4().hex}.{extension}"
    try:
        sb = get_supabase()
        try:
            sb.storage.create_bucket("content-images", options={"public": False})
        except Exception:
            pass
        sb.storage.from_("content-images").upload(
            path, data, {"content-type": file.content_type or "image/png", "upsert": "false"}
        )
        signed = sb.storage.from_("content-images").create_signed_url(path, 3600)
        url = signed.get("signedURL") or signed.get("signedUrl")
        row = {
            "id": str(uuid4()), "user_id": user.id, "kind": "upload",
            "name": file.filename or "Recurso", "storage_path": path, "url": url,
            "prompt": "", "metadata": {"content_type": file.content_type, "size": len(data)},
            "status": "SAVED", "provider": "upload", "tokens_used": 0,
            "cost_usd": 0, "created_at": _now(),
        }
        stored = sb.table("generated_assets").insert(row).execute()
        return {"success": True, "asset": stored.data[0] if stored.data else row}
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc) from exc


@router.post("/assets/{asset_id}/save")
async def save_generated_asset(
    asset_id: str, request: SaveAssetRequest, user: CurrentUser = Depends(get_current_user)
):
    result = (
        get_supabase().table("generated_assets").update({
            "status": "SAVED", "name": request.name,
            "campaign_id": request.campaign_id,
        }).eq("id", asset_id).eq("user_id", user.id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return {"success": True, "asset": result.data[0]}


class BrandBookRequest(BaseModel):
    title: str = "Brand Book"
    cover_url: str | None = None
    selected_assets: list[str] = Field(default_factory=list, min_length=3, max_length=7)


@router.post("/brand-books")
async def create_brand_book(
    request: BrandBookRequest, user: CurrentUser = Depends(get_current_user)
):
    brand = _brand_for(user.id)
    content = {
        "industry": brand.get("industria", ""), "value_proposition": brand.get("propuesta", ""),
        "tone": brand.get("tono", ""), "audience": brand.get("audiencia", ""),
        "differentiator": brand.get("diferenciador", ""), "restrictions": brand.get("prohibiciones", ""),
        "website": brand.get("website_url", ""),
    }
    row = {
        "id": str(uuid4()), "user_id": user.id, "title": request.title,
        "cover_url": request.cover_url, "selected_assets": request.selected_assets,
        "content": content, "version": 1, "status": "SAVED",
        "created_at": _now(), "updated_at": _now(),
    }
    try:
        result = get_supabase().table("brand_books").insert(row).execute()
    except Exception as exc:
        raise _db_error(exc) from exc
    return {"success": True, "brand_book": result.data[0] if result.data else row}


@router.get("/brand-books/{brand_book_id}")
async def get_brand_book(brand_book_id: str, user: CurrentUser = Depends(get_current_user)):
    result = (
        get_supabase().table("brand_books").select("*")
        .eq("id", brand_book_id).eq("user_id", user.id).limit(1).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Brand Book no encontrado")
    return {"brand_book": result.data[0]}


@router.get("/brand-books/{brand_book_id}/pdf")
async def export_brand_book_pdf(
    brand_book_id: str, user: CurrentUser = Depends(get_current_user)
):
    result = (
        get_supabase().table("brand_books").select("*")
        .eq("id", brand_book_id).eq("user_id", user.id).limit(1).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Brand Book no encontrado")
    book = result.data[0]
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.utils import ImageReader
        from reportlab.pdfgen import canvas
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="El exportador PDF no esta instalado") from exc
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    pdf.setFillColorRGB(0.106, 0.106, 0.106)
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setFillColorRGB(0.655, 0.482, 1)
    pdf.setFont("Helvetica-Bold", 26)
    pdf.drawString(48, height - 70, book.get("title") or "Brand Book")
    pdf.setFillColorRGB(0.94, 0.94, 0.94)
    y = height - 120
    labels = {
        "industry": "Industria", "value_proposition": "Propuesta de valor", "tone": "Tono",
        "audience": "Audiencia", "differentiator": "Diferenciador", "restrictions": "Restricciones",
        "website": "Sitio web",
    }
    for key, label in labels.items():
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(48, y, label)
        y -= 17
        pdf.setFont("Helvetica", 10)
        value = str((book.get("content") or {}).get(key, ""))
        for start in range(0, len(value), 88):
            pdf.drawString(48, y, value[start:start + 88])
            y -= 14
        y -= 14
        if y < 70:
            pdf.showPage()
            y = height - 60
    selected_assets = book.get("selected_assets") or []
    if selected_assets:
        pdf.showPage()
        pdf.setFillColorRGB(0.106, 0.106, 0.106)
        pdf.rect(0, 0, width, height, fill=1, stroke=0)
        pdf.setFillColorRGB(0.655, 0.482, 1)
        pdf.setFont("Helvetica-Bold", 22)
        pdf.drawString(48, height - 60, "Recursos visuales")
        positions = [(48, height - 330), (width / 2 + 8, height - 330), (48, height - 600), (width / 2 + 8, height - 600)]
        sb = get_supabase()
        for path, (x, image_y) in zip(selected_assets[:4], positions):
            try:
                image_bytes = sb.storage.from_("content-images").download(path)
                pdf.drawImage(ImageReader(BytesIO(image_bytes)), x, image_y, width=width / 2 - 56, height=230, preserveAspectRatio=True, anchor="c")
            except Exception:
                pdf.setFillColorRGB(0.4, 0.4, 0.4)
                pdf.rect(x, image_y, width / 2 - 56, 230, fill=0, stroke=1)
    pdf.save()
    buffer.seek(0)
    filename = f"baral-brand-book-v{book.get('version', 1)}.pdf"
    return StreamingResponse(buffer, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="{filename}"'
    })
