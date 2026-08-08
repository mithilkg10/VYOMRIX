from enum import Enum
from typing import List, Dict

class PermissionsEnum(str, Enum):
    # Admin
    ADMIN_ALL = "admin:all"

    # Users
    USERS_MANAGE = "users:manage"
    USERS_READ = "users:read"

    # Incidents
    INCIDENTS_READ = "incidents:read"
    INCIDENTS_WRITE = "incidents:write"
    INCIDENTS_ASSIGN = "incidents:assign"
    INCIDENTS_DELETE = "incidents:delete"

    # Assets
    ASSETS_READ = "assets:read"
    ASSETS_WRITE = "assets:write"
    ASSETS_DELETE = "assets:delete"

    # SIEM
    SIEM_READ = "siem:read"
    SIEM_CONFIGURE = "siem:configure"

    # Detection Rules
    RULES_READ = "rules:read"
    RULES_WRITE = "rules:write"
    RULES_DELETE = "rules:delete"

    # Threat Intelligence
    THREAT_INTEL_READ = "threat_intel:read"
    THREAT_INTEL_WRITE = "threat_intel:write"

    # MITRE ATT&CK
    MITRE_READ = "mitre:read"

    # AI SOC
    AI_SOC_READ = "ai_soc:read"
    AI_SOC_QUERY = "ai_soc:query"

    # WAF
    WAF_READ = "waf:read"
    WAF_CONFIGURE = "waf:configure"

    # Deception / Honeypot
    DECEPTION_READ = "deception:read"
    DECEPTION_CONFIGURE = "deception:configure"

    # Threat Hunting
    HUNTING_READ = "hunting:read"
    HUNTING_EXECUTE = "hunting:execute"

    # Phishing
    PHISHING_READ = "phishing:read"
    PHISHING_CONFIGURE = "phishing:configure"

    # Reports
    REPORTS_READ = "reports:read"
    REPORTS_GENERATE = "reports:generate"

    # Audit
    AUDIT_READ = "audit:read"

    # Notifications
    NOTIFICATIONS_READ = "notifications:read"
    NOTIFICATIONS_MANAGE = "notifications:manage"

    # System
    SYSTEM_READ = "system:read"
    SYSTEM_CONFIGURE = "system:configure"


class RoleEnum(str, Enum):
    SUPER_ADMIN = "Super Admin"
    SECURITY_ADMIN = "Security Administrator"
    SOC_MANAGER = "SOC Manager"
    SOC_ANALYST = "SOC Analyst"
    THREAT_HUNTER = "Threat Hunter"
    INCIDENT_RESPONDER = "Incident Responder"
    READ_ONLY = "Read-Only Auditor"


# Default permission mapping for roles
ROLE_PERMISSIONS: Dict[RoleEnum, List[PermissionsEnum]] = {
    RoleEnum.SUPER_ADMIN: [PermissionsEnum.ADMIN_ALL],

    RoleEnum.SECURITY_ADMIN: [
        PermissionsEnum.USERS_MANAGE, PermissionsEnum.USERS_READ,
        PermissionsEnum.INCIDENTS_READ, PermissionsEnum.INCIDENTS_WRITE,
        PermissionsEnum.INCIDENTS_ASSIGN, PermissionsEnum.INCIDENTS_DELETE,
        PermissionsEnum.ASSETS_READ, PermissionsEnum.ASSETS_WRITE, PermissionsEnum.ASSETS_DELETE,
        PermissionsEnum.SIEM_READ, PermissionsEnum.SIEM_CONFIGURE,
        PermissionsEnum.RULES_READ, PermissionsEnum.RULES_WRITE, PermissionsEnum.RULES_DELETE,
        PermissionsEnum.THREAT_INTEL_READ, PermissionsEnum.THREAT_INTEL_WRITE,
        PermissionsEnum.MITRE_READ,
        PermissionsEnum.AI_SOC_READ, PermissionsEnum.AI_SOC_QUERY,
        PermissionsEnum.WAF_READ, PermissionsEnum.WAF_CONFIGURE,
        PermissionsEnum.DECEPTION_READ, PermissionsEnum.DECEPTION_CONFIGURE,
        PermissionsEnum.HUNTING_READ, PermissionsEnum.HUNTING_EXECUTE,
        PermissionsEnum.PHISHING_READ, PermissionsEnum.PHISHING_CONFIGURE,
        PermissionsEnum.REPORTS_READ, PermissionsEnum.REPORTS_GENERATE,
        PermissionsEnum.AUDIT_READ,
        PermissionsEnum.NOTIFICATIONS_READ, PermissionsEnum.NOTIFICATIONS_MANAGE,
        PermissionsEnum.SYSTEM_READ, PermissionsEnum.SYSTEM_CONFIGURE,
    ],

    RoleEnum.SOC_MANAGER: [
        PermissionsEnum.USERS_READ,
        PermissionsEnum.INCIDENTS_READ, PermissionsEnum.INCIDENTS_WRITE, PermissionsEnum.INCIDENTS_ASSIGN,
        PermissionsEnum.ASSETS_READ,
        PermissionsEnum.SIEM_READ,
        PermissionsEnum.RULES_READ,
        PermissionsEnum.THREAT_INTEL_READ,
        PermissionsEnum.MITRE_READ,
        PermissionsEnum.AI_SOC_READ, PermissionsEnum.AI_SOC_QUERY,
        PermissionsEnum.WAF_READ,
        PermissionsEnum.DECEPTION_READ,
        PermissionsEnum.HUNTING_READ,
        PermissionsEnum.PHISHING_READ,
        PermissionsEnum.REPORTS_READ, PermissionsEnum.REPORTS_GENERATE,
        PermissionsEnum.AUDIT_READ,
        PermissionsEnum.NOTIFICATIONS_READ, PermissionsEnum.NOTIFICATIONS_MANAGE,
        PermissionsEnum.SYSTEM_READ,
    ],

    RoleEnum.SOC_ANALYST: [
        PermissionsEnum.INCIDENTS_READ, PermissionsEnum.INCIDENTS_WRITE,
        PermissionsEnum.ASSETS_READ,
        PermissionsEnum.SIEM_READ,
        PermissionsEnum.RULES_READ,
        PermissionsEnum.THREAT_INTEL_READ,
        PermissionsEnum.MITRE_READ,
        PermissionsEnum.AI_SOC_READ, PermissionsEnum.AI_SOC_QUERY,
        PermissionsEnum.WAF_READ,
        PermissionsEnum.DECEPTION_READ,
        PermissionsEnum.HUNTING_READ,
        PermissionsEnum.PHISHING_READ,
        PermissionsEnum.REPORTS_READ,
        PermissionsEnum.NOTIFICATIONS_READ,
    ],

    RoleEnum.THREAT_HUNTER: [
        PermissionsEnum.INCIDENTS_READ,
        PermissionsEnum.ASSETS_READ,
        PermissionsEnum.SIEM_READ,
        PermissionsEnum.RULES_READ, PermissionsEnum.RULES_WRITE,
        PermissionsEnum.THREAT_INTEL_READ, PermissionsEnum.THREAT_INTEL_WRITE,
        PermissionsEnum.MITRE_READ,
        PermissionsEnum.AI_SOC_READ, PermissionsEnum.AI_SOC_QUERY,
        PermissionsEnum.HUNTING_READ, PermissionsEnum.HUNTING_EXECUTE,
        PermissionsEnum.REPORTS_READ,
        PermissionsEnum.NOTIFICATIONS_READ,
    ],

    RoleEnum.INCIDENT_RESPONDER: [
        PermissionsEnum.INCIDENTS_READ, PermissionsEnum.INCIDENTS_WRITE, PermissionsEnum.INCIDENTS_ASSIGN,
        PermissionsEnum.ASSETS_READ,
        PermissionsEnum.SIEM_READ,
        PermissionsEnum.RULES_READ,
        PermissionsEnum.THREAT_INTEL_READ,
        PermissionsEnum.MITRE_READ,
        PermissionsEnum.AI_SOC_READ,
        PermissionsEnum.REPORTS_READ, PermissionsEnum.REPORTS_GENERATE,
        PermissionsEnum.NOTIFICATIONS_READ,
    ],

    RoleEnum.READ_ONLY: [
        PermissionsEnum.INCIDENTS_READ,
        PermissionsEnum.ASSETS_READ,
        PermissionsEnum.SIEM_READ,
        PermissionsEnum.RULES_READ,
        PermissionsEnum.THREAT_INTEL_READ,
        PermissionsEnum.MITRE_READ,
        PermissionsEnum.AI_SOC_READ,
        PermissionsEnum.WAF_READ,
        PermissionsEnum.DECEPTION_READ,
        PermissionsEnum.HUNTING_READ,
        PermissionsEnum.PHISHING_READ,
        PermissionsEnum.REPORTS_READ,
        PermissionsEnum.AUDIT_READ,
        PermissionsEnum.NOTIFICATIONS_READ,
        PermissionsEnum.SYSTEM_READ,
        PermissionsEnum.USERS_READ,
    ],
}
