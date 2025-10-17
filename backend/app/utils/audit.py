"""Structured audit logging helpers."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import Request

logger = logging.getLogger("vulnmanager.audit")


def audit_log(
    action: str,
    *,
    actor_id: str | None,
    target: dict[str, Any] | None = None,
    status: str = "success",
    request: Request | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    """Emit a structured audit entry."""

    payload: dict[str, Any] = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "status": status,
        "actor_id": actor_id,
    }

    if target:
        payload["target"] = target

    if request and request.client:
        payload["ip"] = request.client.host
        payload["user_agent"] = request.headers.get("user-agent")

    if extra:
        payload.update(extra)

    logger.info(json.dumps(payload, sort_keys=True))
