# VulnManager - Vulnerability Database Import Guide

## Overview
This repository contains 12 comprehensive XML files with **100+ real-world vulnerabilities** commonly found during penetration tests.

## File Structure

```
examples/
├── 01_web_application.xml    (12 vulns - Type: Web Application)
├── 02_network.xml            (10 vulns - Type: Network)
├── 03_authentication.xml     (10 vulns - Type: Authentication)
├── 04_cryptography.xml       (10 vulns - Type: Cryptography)
├── 05_active_directory.xml   (10 vulns - Type: Active Directory)
├── 06_cloud_aws.xml          (10 vulns - Type: Cloud AWS)
├── 07_api_security.xml       (10 vulns - Type: API Security)
├── 08_mobile.xml             (10 vulns - Type: Mobile)
├── 09_database.xml           (10 vulns - Type: Database)
├── 10_linux.xml              (10 vulns - Type: Linux)
├── 11_windows.xml            (10 vulns - Type: Windows)
└── 12_container.xml          (10 vulns - Type: Container)
```

## Import Instructions

### Via Web Interface
1. Navigate to VulnManager: http://localhost:5173
2. Click "Import" button
3. Select XML file(s)
4. Vulnerabilities auto-categorized by `<Type>` field

### Via API
```bash
curl -X POST http://localhost:8000/api/vulns/import \
  -H "Content-Type: application/xml" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --data-binary @examples/01_web_application.xml
```

### Bulk Import (All Files)
```bash
for file in examples/*.xml; do
  curl -X POST http://localhost:8000/api/vulns/import \
    -H "Content-Type: application/xml" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    --data-binary @"$file"
done
```

## Vulnerability Types Mapping

| Type | Count | Description |
|------|-------|-------------|
| Web Application | 12 | OWASP Top 10, XSS, SQLi, SSRF, etc. |
| Network | 10 | SMB, DNS, SNMP, Telnet, VPN, etc. |
| Authentication | 10 | MFA, password reset, sessions, etc. |
| Cryptography | 10 | Weak crypto, TLS, key management, etc. |
| Active Directory | 10 | Kerberoasting, DCSync, GPP, etc. |
| Cloud AWS | 10 | S3, IAM, EC2, RDS, Lambda, etc. |
| API Security | 10 | REST, GraphQL, rate limiting, etc. |
| Mobile | 10 | iOS, Android, reverse eng, etc. |
| Database | 10 | SQL injection, NoSQL, MongoDB, etc. |
| Linux | 10 | Privilege escalation, sudo, SUID, etc. |
| Windows | 10 | UAC bypass, privilege esc, SMB, etc. |
| Container | 10 | Docker, Kubernetes, registry, etc. |

## Data Sources

All vulnerabilities are based on authoritative sources:
- **OWASP Top 10** (2021)
- **CWE Top 25** Most Dangerous Software Weaknesses
- **SANS Top 25** Software Errors
- **MITRE ATT&CK** Framework
- **CVE Database** (NIST NVD)
- **Real penetration testing findings**
- Security research from:
  - PortSwigger Web Security Academy
  - HackTricks
  - PayloadsAllTheThings
  - PTES Technical Guidelines
  - Red Team Field Manual

## CVSS Scoring

All vulnerabilities include:
- CVSS 3.1 Base Score
- CVSS 3.1 Vector String
- Severity Level (Critical/High/Medium/Low)

## Custom Fields

Each vulnerability contains:
- `<Name>` - Short descriptive title
- `<Level>` - Severity (Critical/High/Medium/Low)
- `<Scope>` - Affected component/system
- `<Protocol-Interface>` - Network protocol/port
- `<CVSS3.1_Score>` - Numeric score (0.0-10.0)
- `<CVSS3.1_VectorString>` - CVSS vector
- `<Description>` - Detailed technical description
- `<Risk>` - Business and technical impact
- `<Recommendation>` - Detailed remediation steps
- `<Type>` - Category for auto-classification

## Quality Standards

✅ Real-world vulnerabilities from actual pentests  
✅ Detailed remediation with specific commands  
✅ Industry-standard CVSS scoring  
✅ Multiple authoritative sources  
✅ Professional technical writing  
✅ Actionable recommendations  

## Support

For issues or questions:
- GitHub: https://github.com/anthropics/claude-code/issues
- Documentation: README files in each directory

---
**Generated with Claude Code** 
https://claude.com/claude-code
