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
    
    # Detection Rules
    RULES_READ = "rules:read"
    RULES_WRITE = "rules:write"
    
    # Audit
    AUDIT_READ = "audit:read"

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
        PermissionsEnum.USERS_MANAGE,
        PermissionsEnum.USERS_READ,
        PermissionsEnum.RULES_WRITE,
        PermissionsEnum.RULES_READ,
        PermissionsEnum.ASSETS_WRITE,
        PermissionsEnum.ASSETS_READ,
        PermissionsEnum.INCIDENTS_WRITE,
        PermissionsEnum.INCIDENTS_READ,
        PermissionsEnum.INCIDENTS_ASSIGN,
    ],
    RoleEnum.SOC_MANAGER: [
        PermissionsEnum.USERS_READ,
        PermissionsEnum.RULES_READ,
        PermissionsEnum.ASSETS_READ,
        PermissionsEnum.INCIDENTS_WRITE,
        PermissionsEnum.INCIDENTS_READ,
        PermissionsEnum.INCIDENTS_ASSIGN,
    ],
    RoleEnum.SOC_ANALYST: [
        PermissionsEnum.USERS_READ,
        PermissionsEnum.RULES_READ,
        PermissionsEnum.ASSETS_READ,
        PermissionsEnum.INCIDENTS_WRITE,
        PermissionsEnum.INCIDENTS_READ,
    ],
    RoleEnum.THREAT_HUNTER: [
        PermissionsEnum.USERS_READ,
        PermissionsEnum.RULES_WRITE,
        PermissionsEnum.RULES_READ,
        PermissionsEnum.ASSETS_READ,
        PermissionsEnum.INCIDENTS_READ,
    ],
    RoleEnum.INCIDENT_RESPONDER: [
        PermissionsEnum.USERS_READ,
        PermissionsEnum.RULES_READ,
        PermissionsEnum.ASSETS_READ,
        PermissionsEnum.INCIDENTS_WRITE,
        PermissionsEnum.INCIDENTS_READ,
    ],
    RoleEnum.READ_ONLY: [
        PermissionsEnum.USERS_READ,
        PermissionsEnum.RULES_READ,
        PermissionsEnum.INCIDENTS_READ,
        PermissionsEnum.AUDIT_READ,
    ],
}
