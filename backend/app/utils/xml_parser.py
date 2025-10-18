"""XML parser and exporter for vulnerability data."""

from typing import Any
from uuid import UUID

from lxml import etree

from app.models.vulnerability import VulnerabilityLevel, VulnerabilityType


def parse_vulnerabilities_xml(xml_content: bytes) -> list[dict[str, Any]]:
    """
    Parse XML content and extract vulnerabilities.

    Expected XML structure:
    <vulnerabilities>
        <vulnerability>
            <Name>...</Name>
            <Level>Critical|High|Medium|Low|Informational</Level>
            <Scope>...</Scope>
            <Protocol-Interface>...</Protocol-Interface>
            <CVSS3.1_Score>7.5</CVSS3.1_Score>
            <CVSS3.1_VectorString>CVSS:3.1/...</CVSS3.1_VectorString>
            <Description>...</Description>
            <Risk>...</Risk>
            <Recommendation>...</Recommendation>
            <Type>Web Application|API|Network|Active Directory|...</Type>
        </vulnerability>
    </vulnerabilities>

    Returns:
        List of dictionaries containing vulnerability data.
    """
    parser = etree.XMLParser(resolve_entities=False, no_network=True)

    try:
        root = etree.fromstring(xml_content, parser=parser)
    except etree.XMLSyntaxError as e:
        raise ValueError(f"Invalid XML: {e}")

    vulnerabilities = []

    for vuln_elem in root.findall("vulnerability"):
        # Preserve tag order
        tag_order = [child.tag for child in vuln_elem]

        vuln_data = {
            "tag_order": tag_order,
        }

        # Extract fields
        for child in vuln_elem:
            tag = child.tag
            text = child.text or ""

            if tag == "Name":
                vuln_data["name"] = text.strip()
            elif tag.lower() in {"id", "uuid"}:
                try:
                    vuln_data["id"] = UUID(text.strip()) if text.strip() else None
                except ValueError as exc:
                    raise ValueError(f"Invalid UUID value '{text}'") from exc
            elif tag == "Level":
                # Map to enum
                level_map = {
                    "Critical": VulnerabilityLevel.CRITICAL,
                    "High": VulnerabilityLevel.HIGH,
                    "Medium": VulnerabilityLevel.MEDIUM,
                    "Low": VulnerabilityLevel.LOW,
                    "Informational": VulnerabilityLevel.INFO,
                }
                vuln_data["level"] = level_map.get(text.strip(), VulnerabilityLevel.INFO)
            elif tag == "Scope":
                vuln_data["scope"] = text.strip()
            elif tag == "Protocol-Interface":
                vuln_data["protocol_interface"] = text.strip()
            elif tag == "CVSS3.1_Score":
                try:
                    vuln_data["cvss_score"] = float(text.strip()) if text.strip() else None
                except ValueError:
                    vuln_data["cvss_score"] = None
            elif tag == "CVSS3.1_VectorString":
                vuln_data["cvss_vector"] = text.strip() if text.strip() else None
            elif tag == "Description":
                vuln_data["description"] = text.strip()
            elif tag == "Risk":
                vuln_data["risk"] = text.strip()
            elif tag == "Recommendation":
                vuln_data["recommendation"] = text.strip()
            elif tag == "Type":
                # Map string to enum - try to match by value
                type_text = text.strip()
                try:
                    # Try to find enum by value (name)
                    vuln_data["type"] = VulnerabilityType(type_text)
                except ValueError:
                    # If not found, raise clear error
                    valid_types = [t.value for t in VulnerabilityType]
                    raise ValueError(
                        f"Invalid vulnerability type '{type_text}'. "
                        f"Valid types are: {', '.join(valid_types)}"
                    )

        # Validate required fields
        required_fields = ["name", "level", "scope", "protocol_interface", "description", "risk", "recommendation", "type"]
        missing_fields = [field for field in required_fields if field not in vuln_data]

        if missing_fields:
            raise ValueError(f"Missing required fields in vulnerability '{vuln_data.get('name', 'unknown')}': {missing_fields}")

        vulnerabilities.append(vuln_data)

    return vulnerabilities


def export_vulnerabilities_xml(vulnerabilities: list) -> bytes:
    """
    Export vulnerabilities to XML format.

    Args:
        vulnerabilities: List of Vulnerability model instances.

    Returns:
        XML content as bytes.
    """
    root = etree.Element("vulnerabilities")

    for vuln in vulnerabilities:
        vuln_elem = etree.SubElement(root, "vulnerability")

        # Define default order if not preserved
        default_order = [
            "Id",
            "Name",
            "Level",
            "Scope",
            "Protocol-Interface",
            "CVSS3.1_Score",
            "CVSS3.1_VectorString",
            "Description",
            "Risk",
            "Recommendation",
            "Type",
        ]

        # Use preserved order if available
        tag_order = vuln.tag_order if vuln.tag_order else default_order

        # Map field names to XML tags
        field_map = {
            "Id": str(vuln.id),
            "Name": vuln.name,
            "Level": vuln.level.value,
            "Scope": vuln.scope,
            "Protocol-Interface": vuln.protocol_interface,
            "CVSS3.1_Score": str(vuln.cvss_score) if vuln.cvss_score is not None else "",
            "CVSS3.1_VectorString": vuln.cvss_vector or "",
            "Description": vuln.description,
            "Risk": vuln.risk,
            "Recommendation": vuln.recommendation,
            "Type": vuln.vuln_type.value,
        }

        # Add elements in preserved order
        for tag in tag_order:
            if tag in field_map:
                elem = etree.SubElement(vuln_elem, tag)
                elem.text = field_map[tag]

    # Convert to bytes with pretty formatting
    xml_bytes = etree.tostring(
        root,
        pretty_print=True,
        xml_declaration=True,
        encoding="UTF-8",
    )

    return xml_bytes
