"""
Role categorization and permission level utilities
"""

# Define role categories for easier permission management
ROLE_CATEGORIES = {
    'C_LEVEL': ['CEO', 'CTO', 'CIO', 'COO', 'CFO'],
    'VP_LEVEL': ['VP_ENGINEERING'],
    'DIRECTOR_LEVEL': ['DIRECTOR'],
    'MANAGEMENT': ['ENGINEERING_MANAGER', 'DELIVERY_MANAGER', 'HR_MANAGER', 'FINANCE_MANAGER', 
                   'SALES_MANAGER', 'OPERATIONS_MANAGER', 'PRODUCT_MANAGER', 'PROJECT_MANAGER'],
    'TEAM_LEADS': ['TEAM_LEAD', 'LEAD_ENGINEER'],
    'SENIOR_STAFF': ['PRINCIPAL_ENGINEER', 'ARCHITECT', 'SENIOR_DEVELOPER'],
    'ADMIN_STAFF': ['ADMIN', 'OFFICE_ADMIN', 'SYSTEM_ADMIN'],
    'HR_STAFF': ['HR_EXECUTIVE', 'HR_MANAGER'],
    'IT_SUPPORT': ['IT_SUPPORT', 'TECHNICAL_SUPPORT'],
    'ENGINEERING': ['JUNIOR_DEVELOPER', 'SOFTWARE_ENGINEER', 'MID_LEVEL_DEVELOPER', 
                    'SENIOR_DEVELOPER', 'FULL_STACK_DEVELOPER', 'FRONTEND_DEVELOPER', 
                    'BACKEND_DEVELOPER', 'MOBILE_APP_DEVELOPER', 'EMBEDDED_ENGINEER'],
    'QA': ['QA_ENGINEER', 'MANUAL_TESTER', 'AUTOMATION_TESTER'],
    'DEVOPS': ['DEVOPS_ENGINEER', 'CLOUD_ENGINEER', 'SITE_RELIABILITY_ENGINEER', 'NETWORK_ENGINEER'],
    'DATA_AI': ['DATA_ENGINEER', 'DATA_ANALYST', 'DATA_SCIENTIST', 'ML_ENGINEER', 'AI_ENGINEER'],
    'SECURITY': ['SECURITY_ANALYST', 'SECURITY_ENGINEER'],
    'DESIGN': ['UI_DESIGNER', 'UX_DESIGNER', 'PRODUCT_DESIGNER'],
    'PRODUCT': ['PRODUCT_OWNER', 'SCRUM_MASTER', 'BUSINESS_ANALYST'],
    'SUPPORT': ['CUSTOMER_SUPPORT'],
    'SALES_MARKETING': ['SALES_EXECUTIVE', 'MARKETING_EXECUTIVE', 'DIGITAL_MARKETING_SPECIALIST', 'SEO_SPECIALIST'],
    'FINANCE': ['ACCOUNTANT', 'AUDITOR'],
    'LEGAL': ['LEGAL_ADVISOR'],
    'OPERATIONS': ['OPERATIONS_EXECUTIVE', 'PROCUREMENT_EXECUTIVE'],
    'ENTRY_LEVEL': ['INTERN', 'TRAINEE'],
    'CONTRACTORS': ['CONSULTANT', 'FREELANCER', 'CONTRACTOR'],
    'OTHERS': ['OTHERS'],
}

# Permission levels (highest to lowest)
PERMISSION_LEVELS = {
    'EXECUTIVE': 5,      # C-Level
    'SENIOR_LEADER': 4,  # VP, Director
    'MANAGER': 3,        # All managers
    'LEAD': 2,           # Team leads, senior staff
    'STAFF': 1,          # Regular employees
    'ENTRY': 0,          # Interns, trainees
}

def get_role_category(role):
    """Get the category for a given role"""
    for category, roles in ROLE_CATEGORIES.items():
        if role in roles:
            return category
    return 'OTHERS'

def get_permission_level(role):
    """Get permission level for a role"""
    if role in ROLE_CATEGORIES['C_LEVEL']:
        return PERMISSION_LEVELS['EXECUTIVE']
    elif role in ROLE_CATEGORIES['VP_LEVEL'] or role in ROLE_CATEGORIES['DIRECTOR_LEVEL']:
        return PERMISSION_LEVELS['SENIOR_LEADER']
    elif role in ROLE_CATEGORIES['MANAGEMENT']:
        return PERMISSION_LEVELS['MANAGER']
    elif role in ROLE_CATEGORIES['TEAM_LEADS'] or role in ROLE_CATEGORIES['SENIOR_STAFF']:
        return PERMISSION_LEVELS['LEAD']
    elif role in ROLE_CATEGORIES['ENTRY_LEVEL']:
        return PERMISSION_LEVELS['ENTRY']
    else:
        return PERMISSION_LEVELS['STAFF']

def has_executive_access(role):
    """Check if role has executive-level access"""
    return get_permission_level(role) >= PERMISSION_LEVELS['SENIOR_LEADER']

def has_management_access(role):
    """Check if role has management-level access"""
    return get_permission_level(role) >= PERMISSION_LEVELS['MANAGER']

def has_lead_access(role):
    """Check if role has lead-level access"""
    return get_permission_level(role) >= PERMISSION_LEVELS['LEAD']

def can_manage_users(role):
    """Check if role can manage users"""
    return role in ['ADMIN', 'CEO', 'CIO', 'HR_MANAGER']

def can_manage_hr(role):
    """Check if role can manage HR functions"""
    return role in ROLE_CATEGORIES['HR_STAFF'] or role in ['ADMIN', 'CEO', 'COO']

def can_manage_assets(role):
    """Check if role can manage assets"""
    return role in ['ADMIN', 'IT_SUPPORT', 'SYSTEM_ADMIN', 'CTO', 'CIO'] or has_executive_access(role)

def can_manage_finance(role):
    """Check if role can manage finance"""
    return role in ROLE_CATEGORIES['FINANCE'] or role in ['ADMIN', 'CEO', 'CFO']

def get_role_display_name(role):
    """Get display name for role"""
    role_map = {
        'IT_SUPPORT': 'IT Support',
        'HR_MANAGER': 'HR Manager',
        'HR_EXECUTIVE': 'HR Executive',
        'TEAM_LEAD': 'Team Lead',
        'VP_ENGINEERING': 'VP Engineering',
        'CTO': 'CTO',
        'CIO': 'CIO',
        'COO': 'COO',
        'CFO': 'CFO',
        'CEO': 'CEO',
    }
    return role_map.get(role, role.replace('_', ' ').title())

def get_all_roles_with_permission_level(min_level):
    """Get all roles that have at least the specified permission level"""
    roles = []
    from authentication.models import UserProfile
    for role_code, _ in UserProfile.ROLE_CHOICES:
        if get_permission_level(role_code) >= min_level:
            roles.append(role_code)
    return roles