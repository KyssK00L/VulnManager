"""CVSS 3.1 Calculator utility."""

from typing import Dict, Optional


class CVSSCalculator:
    """Calculate CVSS 3.1 scores from vector strings."""

    # CVSS 3.1 Metrics definitions
    METRICS = {
        "AV": {  # Attack Vector
            "N": {"value": "Network", "score": 0.85},
            "A": {"value": "Adjacent", "score": 0.62},
            "L": {"value": "Local", "score": 0.55},
            "P": {"value": "Physical", "score": 0.2},
        },
        "AC": {  # Attack Complexity
            "L": {"value": "Low", "score": 0.77},
            "H": {"value": "High", "score": 0.44},
        },
        "PR": {  # Privileges Required (depends on Scope)
            "N": {"value": "None", "score": {"U": 0.85, "C": 0.85}},
            "L": {"value": "Low", "score": {"U": 0.62, "C": 0.68}},
            "H": {"value": "High", "score": {"U": 0.27, "C": 0.5}},
        },
        "UI": {  # User Interaction
            "N": {"value": "None", "score": 0.85},
            "R": {"value": "Required", "score": 0.62},
        },
        "S": {  # Scope
            "U": {"value": "Unchanged", "score": None},
            "C": {"value": "Changed", "score": None},
        },
        "C": {  # Confidentiality Impact
            "N": {"value": "None", "score": 0.0},
            "L": {"value": "Low", "score": 0.22},
            "H": {"value": "High", "score": 0.56},
        },
        "I": {  # Integrity Impact
            "N": {"value": "None", "score": 0.0},
            "L": {"value": "Low", "score": 0.22},
            "H": {"value": "High", "score": 0.56},
        },
        "A": {  # Availability Impact
            "N": {"value": "None", "score": 0.0},
            "L": {"value": "Low", "score": 0.22},
            "H": {"value": "High", "score": 0.56},
        },
    }

    @staticmethod
    def parse_vector(vector_string: str) -> Optional[Dict[str, str]]:
        """
        Parse CVSS vector string into components.

        Args:
            vector_string: CVSS vector (e.g., "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H")

        Returns:
            Dictionary of metric values or None if invalid
        """
        if not vector_string or not vector_string.startswith("CVSS:3.1/"):
            return None

        try:
            # Remove prefix and split by /
            parts = vector_string.replace("CVSS:3.1/", "").split("/")
            metrics = {}

            for part in parts:
                if ":" not in part:
                    continue
                key, value = part.split(":")
                metrics[key] = value

            # Validate required metrics
            required = ["AV", "AC", "PR", "UI", "S", "C", "I", "A"]
            if not all(m in metrics for m in required):
                return None

            return metrics

        except Exception:
            return None

    @staticmethod
    def calculate_base_score(metrics: Dict[str, str]) -> Optional[float]:
        """
        Calculate CVSS 3.1 Base Score.

        Args:
            metrics: Dictionary of metric values

        Returns:
            Base score (0.0 - 10.0) or None if invalid
        """
        try:
            # Get scope for PR calculation
            scope = metrics["S"]

            # Get impact metrics
            av_score = CVSSCalculator.METRICS["AV"][metrics["AV"]]["score"]
            ac_score = CVSSCalculator.METRICS["AC"][metrics["AC"]]["score"]
            pr_score = CVSSCalculator.METRICS["PR"][metrics["PR"]]["score"][scope]
            ui_score = CVSSCalculator.METRICS["UI"][metrics["UI"]]["score"]
            c_score = CVSSCalculator.METRICS["C"][metrics["C"]]["score"]
            i_score = CVSSCalculator.METRICS["I"][metrics["I"]]["score"]
            a_score = CVSSCalculator.METRICS["A"][metrics["A"]]["score"]

            # Calculate Impact Sub Score (ISS)
            iss = 1 - ((1 - c_score) * (1 - i_score) * (1 - a_score))

            # Calculate Impact
            if scope == "U":
                impact = 6.42 * iss
            else:  # Scope Changed
                impact = 7.52 * (iss - 0.029) - 3.25 * pow(iss - 0.02, 15)

            # Calculate Exploitability
            exploitability = 8.22 * av_score * ac_score * pr_score * ui_score

            # Calculate Base Score
            if impact <= 0:
                base_score = 0.0
            elif scope == "U":
                base_score = min(impact + exploitability, 10.0)
            else:
                base_score = min(1.08 * (impact + exploitability), 10.0)

            # Round up to 1 decimal
            return round(base_score * 10) / 10

        except (KeyError, ValueError):
            return None

    @staticmethod
    def build_vector_string(metrics: Dict[str, str]) -> str:
        """
        Build CVSS vector string from metrics.

        Args:
            metrics: Dictionary of metric values

        Returns:
            CVSS vector string
        """
        required = ["AV", "AC", "PR", "UI", "S", "C", "I", "A"]
        parts = [f"{m}:{metrics[m]}" for m in required if m in metrics]
        return f"CVSS:3.1/{'/'.join(parts)}"

    @staticmethod
    def get_severity_rating(score: float) -> str:
        """
        Get severity rating from CVSS score.

        Args:
            score: CVSS score (0.0 - 10.0)

        Returns:
            Severity rating (None, Low, Medium, High, Critical)
        """
        if score == 0.0:
            return "None"
        elif score < 4.0:
            return "Low"
        elif score < 7.0:
            return "Medium"
        elif score < 9.0:
            return "High"
        else:
            return "Critical"

    @staticmethod
    def validate_metrics(metrics: Dict[str, str]) -> bool:
        """
        Validate CVSS metrics.

        Args:
            metrics: Dictionary of metric values

        Returns:
            True if valid, False otherwise
        """
        required = ["AV", "AC", "PR", "UI", "S", "C", "I", "A"]

        # Check all required metrics present
        if not all(m in metrics for m in required):
            return False

        # Check all values are valid
        for metric, value in metrics.items():
            if metric not in CVSSCalculator.METRICS:
                return False
            if value not in CVSSCalculator.METRICS[metric]:
                return False

        return True


def calculate_cvss(vector_string: str) -> Optional[Dict]:
    """
    Calculate CVSS score from vector string.

    Args:
        vector_string: CVSS vector string

    Returns:
        Dictionary with score, severity, and metrics or None
    """
    metrics = CVSSCalculator.parse_vector(vector_string)
    if not metrics:
        return None

    score = CVSSCalculator.calculate_base_score(metrics)
    if score is None:
        return None

    return {
        "score": score,
        "severity": CVSSCalculator.get_severity_rating(score),
        "vector": vector_string,
        "metrics": metrics,
    }


def build_cvss_vector(
    av: str,
    ac: str,
    pr: str,
    ui: str,
    s: str,
    c: str,
    i: str,
    a: str,
) -> Optional[Dict]:
    """
    Build CVSS vector and calculate score from individual metrics.

    Args:
        av: Attack Vector (N, A, L, P)
        ac: Attack Complexity (L, H)
        pr: Privileges Required (N, L, H)
        ui: User Interaction (N, R)
        s: Scope (U, C)
        c: Confidentiality Impact (N, L, H)
        i: Integrity Impact (N, L, H)
        a: Availability Impact (N, L, H)

    Returns:
        Dictionary with score, severity, vector, and metrics or None
    """
    metrics = {
        "AV": av,
        "AC": ac,
        "PR": pr,
        "UI": ui,
        "S": s,
        "C": c,
        "I": i,
        "A": a,
    }

    if not CVSSCalculator.validate_metrics(metrics):
        return None

    vector = CVSSCalculator.build_vector_string(metrics)
    score = CVSSCalculator.calculate_base_score(metrics)

    if score is None:
        return None

    return {
        "score": score,
        "severity": CVSSCalculator.get_severity_rating(score),
        "vector": vector,
        "metrics": metrics,
    }
