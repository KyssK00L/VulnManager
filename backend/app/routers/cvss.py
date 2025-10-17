"""CVSS Calculator routes."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.utils.cvss_calculator import build_cvss_vector, calculate_cvss

router = APIRouter(prefix="/api/cvss", tags=["cvss"])


class CVSSVectorRequest(BaseModel):
    """Request to parse CVSS vector string."""

    vector: str = Field(..., description="CVSS 3.1 vector string")


class CVSSMetricsRequest(BaseModel):
    """Request to calculate CVSS from individual metrics."""

    av: str = Field(..., description="Attack Vector (N, A, L, P)")
    ac: str = Field(..., description="Attack Complexity (L, H)")
    pr: str = Field(..., description="Privileges Required (N, L, H)")
    ui: str = Field(..., description="User Interaction (N, R)")
    s: str = Field(..., description="Scope (U, C)")
    c: str = Field(..., description="Confidentiality Impact (N, L, H)")
    i: str = Field(..., description="Integrity Impact (N, L, H)")
    a: str = Field(..., description="Availability Impact (N, L, H)")


class CVSSResponse(BaseModel):
    """CVSS calculation response."""

    score: float = Field(..., description="CVSS Base Score (0.0 - 10.0)")
    severity: str = Field(..., description="Severity rating (None, Low, Medium, High, Critical)")
    vector: str = Field(..., description="CVSS 3.1 vector string")
    metrics: dict = Field(..., description="Individual metric values")


@router.post("/calculate", response_model=CVSSResponse)
async def calculate_cvss_score(request: CVSSVectorRequest):
    """
    Calculate CVSS score from vector string.

    Example vector: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`
    """
    result = calculate_cvss(request.vector)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid CVSS vector string. Format: CVSS:3.1/AV:X/AC:X/PR:X/UI:X/S:X/C:X/I:X/A:X",
        )

    return CVSSResponse(**result)


@router.post("/build", response_model=CVSSResponse)
async def build_cvss_from_metrics(request: CVSSMetricsRequest):
    """
    Build CVSS vector and calculate score from individual metrics.

    Metrics:
    - AV (Attack Vector): N=Network, A=Adjacent, L=Local, P=Physical
    - AC (Attack Complexity): L=Low, H=High
    - PR (Privileges Required): N=None, L=Low, H=High
    - UI (User Interaction): N=None, R=Required
    - S (Scope): U=Unchanged, C=Changed
    - C (Confidentiality Impact): N=None, L=Low, H=High
    - I (Integrity Impact): N=None, L=Low, H=High
    - A (Availability Impact): N=None, L=Low, H=High
    """
    result = build_cvss_vector(
        av=request.av,
        ac=request.ac,
        pr=request.pr,
        ui=request.ui,
        s=request.s,
        c=request.c,
        i=request.i,
        a=request.a,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid CVSS metrics. Check that all values are valid.",
        )

    return CVSSResponse(**result)


@router.get("/metrics", response_model=dict)
async def get_cvss_metrics():
    """
    Get available CVSS 3.1 metrics and their possible values.

    Returns all metrics definitions for building a CVSS calculator UI.
    """
    from app.utils.cvss_calculator import CVSSCalculator

    metrics_info = {}

    for metric_code, metric_data in CVSSCalculator.METRICS.items():
        metric_name = {
            "AV": "Attack Vector",
            "AC": "Attack Complexity",
            "PR": "Privileges Required",
            "UI": "User Interaction",
            "S": "Scope",
            "C": "Confidentiality Impact",
            "I": "Integrity Impact",
            "A": "Availability Impact",
        }.get(metric_code, metric_code)

        options = []
        for code, data in metric_data.items():
            option = {
                "code": code,
                "value": data["value"],
            }
            # Add score if not Scope (which doesn't have a direct score)
            if metric_code != "S" and "score" in data:
                score = data["score"]
                # Handle PR's conditional scoring
                if isinstance(score, dict):
                    option["score_unchanged"] = score["U"]
                    option["score_changed"] = score["C"]
                else:
                    option["score"] = score

            options.append(option)

        metrics_info[metric_code] = {
            "name": metric_name,
            "options": options,
        }

    return metrics_info
