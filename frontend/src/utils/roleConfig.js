// Role categorization matching backend
export const ROLE_CATEGORIES = {
  C_LEVEL: ['CEO', 'CTO', 'CIO', 'COO', 'CFO'],
  VP_LEVEL: ['VP_ENGINEERING'],
  DIRECTOR_LEVEL: ['DIRECTOR'],
  MANAGEMENT: ['ENGINEERING_MANAGER', 'DELIVERY_MANAGER', 'HR_MANAGER', 'FINANCE_MANAGER',
    'SALES_MANAGER', 'OPERATIONS_MANAGER', 'PRODUCT_MANAGER', 'PROJECT_MANAGER'],
  TEAM_LEADS: ['TEAM_LEAD', 'LEAD_ENGINEER'],
  SENIOR_STAFF: ['PRINCIPAL_ENGINEER', 'ARCHITECT', 'SENIOR_DEVELOPER'],
  ADMIN_STAFF: ['ADMIN', 'OFFICE_ADMIN', 'SYSTEM_ADMIN'],
  HR_STAFF: ['HR_EXECUTIVE', 'HR_MANAGER'],
  IT_SUPPORT: ['IT_SUPPORT', 'TECHNICAL_SUPPORT'],
  ENGINEERING: ['JUNIOR_DEVELOPER', 'SOFTWARE_ENGINEER', 'MID_LEVEL_DEVELOPER',
    'SENIOR_DEVELOPER', 'FULL_STACK_DEVELOPER', 'FRONTEND_DEVELOPER',
    'BACKEND_DEVELOPER', 'MOBILE_APP_DEVELOPER', 'EMBEDDED_ENGINEER'],
  QA: ['QA_ENGINEER', 'MANUAL_TESTER', 'AUTOMATION_TESTER'],
  DEVOPS: ['DEVOPS_ENGINEER', 'CLOUD_ENGINEER', 'SITE_RELIABILITY_ENGINEER', 'NETWORK_ENGINEER'],
  DATA_AI: ['DATA_ENGINEER', 'DATA_ANALYST', 'DATA_SCIENTIST', 'ML_ENGINEER', 'AI_ENGINEER'],
  SECURITY: ['SECURITY_ANALYST', 'SECURITY_ENGINEER'],
  DESIGN: ['UI_DESIGNER', 'UX_DESIGNER', 'PRODUCT_DESIGNER'],
  PRODUCT: ['PRODUCT_OWNER', 'SCRUM_MASTER', 'BUSINESS_ANALYST'],
  SUPPORT: ['CUSTOMER_SUPPORT'],
  SALES_MARKETING: ['SALES_EXECUTIVE', 'MARKETING_EXECUTIVE', 'DIGITAL_MARKETING_SPECIALIST', 'SEO_SPECIALIST'],
  FINANCE: ['ACCOUNTANT', 'AUDITOR'],
  LEGAL: ['LEGAL_ADVISOR'],
  OPERATIONS: ['OPERATIONS_EXECUTIVE', 'PROCUREMENT_EXECUTIVE'],
  ENTRY_LEVEL: ['INTERN', 'TRAINEE'],
  CONTRACTORS: ['CONSULTANT', 'FREELANCER', 'CONTRACTOR'],
  OTHERS: ['OTHERS'],
};

// Permission levels
export const PERMISSION_LEVELS = {
  EXECUTIVE: 5,
  SENIOR_LEADER: 4,
  MANAGER: 3,
  LEAD: 2,
  STAFF: 1,
  ENTRY: 0,
};

export const getRoleCategory = (role) => {
  for (const [category, roles] of Object.entries(ROLE_CATEGORIES)) {
    if (roles.includes(role)) {
      return category;
    }
  }
  return 'OTHERS';
};

export const getPermissionLevel = (role) => {
  if (ROLE_CATEGORIES.C_LEVEL.includes(role)) {
    return PERMISSION_LEVELS.EXECUTIVE;
  } else if (ROLE_CATEGORIES.VP_LEVEL.includes(role) || ROLE_CATEGORIES.DIRECTOR_LEVEL.includes(role)) {
    return PERMISSION_LEVELS.SENIOR_LEADER;
  } else if (ROLE_CATEGORIES.MANAGEMENT.includes(role)) {
    return PERMISSION_LEVELS.MANAGER;
  } else if (ROLE_CATEGORIES.TEAM_LEADS.includes(role) || ROLE_CATEGORIES.SENIOR_STAFF.includes(role)) {
    return PERMISSION_LEVELS.LEAD;
  } else if (ROLE_CATEGORIES.ENTRY_LEVEL.includes(role)) {
    return PERMISSION_LEVELS.ENTRY;
  } else {
    return PERMISSION_LEVELS.STAFF;
  }
};

export const hasExecutiveAccess = (role) => {
  return getPermissionLevel(role) >= PERMISSION_LEVELS.SENIOR_LEADER;
};

export const hasManagementAccess = (role) => {
  return getPermissionLevel(role) >= PERMISSION_LEVELS.MANAGER;
};

export const hasLeadAccess = (role) => {
  return getPermissionLevel(role) >= PERMISSION_LEVELS.LEAD;
};

export const canManageUsers = (role) => {
  return ['ADMIN', 'CEO', 'CIO', 'HR_MANAGER'].includes(role);
};

export const canManageHR = (role) => {
  return ROLE_CATEGORIES.HR_STAFF.includes(role) || ['ADMIN', 'CEO', 'COO'].includes(role);
};

export const canManageAssets = (role) => {
  return ['ADMIN', 'IT_SUPPORT', 'SYSTEM_ADMIN', 'CTO', 'CIO'].includes(role) || hasExecutiveAccess(role);
};

export const canManageFinance = (role) => {
  return ROLE_CATEGORIES.FINANCE.includes(role) || ['ADMIN', 'CEO', 'CFO'].includes(role);
};

export const getRoleDisplayName = (role) => {
  const roleMap = {
    'INTERN': 'Intern',
    'TRAINEE': 'Trainee',
    'JUNIOR_DEVELOPER': 'Junior Developer',
    'SOFTWARE_ENGINEER': 'Software Engineer',
    'MID_LEVEL_DEVELOPER': 'Mid-Level Developer',
    'SENIOR_DEVELOPER': 'Senior Developer',
    'LEAD_ENGINEER': 'Lead Engineer',
    'PRINCIPAL_ENGINEER': 'Principal Engineer',
    'ARCHITECT': 'Software Architect',
    'FULL_STACK_DEVELOPER': 'Full Stack Developer',
    'FRONTEND_DEVELOPER': 'Frontend Developer',
    'BACKEND_DEVELOPER': 'Backend Developer',
    'MOBILE_APP_DEVELOPER': 'Mobile App Developer',
    'EMBEDDED_ENGINEER': 'Embedded Engineer',
    'QA_ENGINEER': 'QA Engineer',
    'MANUAL_TESTER': 'Manual Tester',
    'AUTOMATION_TESTER': 'Automation Tester',
    'DEVOPS_ENGINEER': 'DevOps Engineer',
    'CLOUD_ENGINEER': 'Cloud Engineer',
    'SITE_RELIABILITY_ENGINEER': 'Site Reliability Engineer',
    'SYSTEM_ADMIN': 'System Administrator',
    'NETWORK_ENGINEER': 'Network Engineer',
    'DATA_ENGINEER': 'Data Engineer',
    'DATA_ANALYST': 'Data Analyst',
    'DATA_SCIENTIST': 'Data Scientist',
    'ML_ENGINEER': 'Machine Learning Engineer',
    'AI_ENGINEER': 'AI Engineer',
    'SECURITY_ANALYST': 'Security Analyst',
    'SECURITY_ENGINEER': 'Security Engineer',
    'UI_DESIGNER': 'UI Designer',
    'UX_DESIGNER': 'UX Designer',
    'PRODUCT_DESIGNER': 'Product Designer',
    'PRODUCT_OWNER': 'Product Owner',
    'PRODUCT_MANAGER': 'Product Manager',
    'PROJECT_MANAGER': 'Project Manager',
    'SCRUM_MASTER': 'Scrum Master',
    'BUSINESS_ANALYST': 'Business Analyst',
    'IT_SUPPORT': 'IT Support',
    'TECHNICAL_SUPPORT': 'Technical Support',
    'CUSTOMER_SUPPORT': 'Customer Support',
    'HR_EXECUTIVE': 'HR Executive',
    'HR_MANAGER': 'HR Manager',
    'ADMIN': 'Admin',
    'OFFICE_ADMIN': 'Office Administrator',
    'SALES_EXECUTIVE': 'Sales Executive',
    'SALES_MANAGER': 'Sales Manager',
    'MARKETING_EXECUTIVE': 'Marketing Executive',
    'DIGITAL_MARKETING_SPECIALIST': 'Digital Marketing Specialist',
    'SEO_SPECIALIST': 'SEO Specialist',
    'ACCOUNTANT': 'Accountant',
    'FINANCE_MANAGER': 'Finance Manager',
    'AUDITOR': 'Auditor',
    'LEGAL_ADVISOR': 'Legal Advisor',
    'OPERATIONS_EXECUTIVE': 'Operations Executive',
    'OPERATIONS_MANAGER': 'Operations Manager',
    'PROCUREMENT_EXECUTIVE': 'Procurement Executive',
    'TEAM_LEAD': 'Team Lead',
    'DELIVERY_MANAGER': 'Delivery Manager',
    'ENGINEERING_MANAGER': 'Engineering Manager',
    'DIRECTOR': 'Director',
    'VP_ENGINEERING': 'VP Engineering',
    'CTO': 'Chief Technology Officer',
    'CIO': 'Chief Information Officer',
    'COO': 'Chief Operating Officer',
    'CFO': 'Chief Financial Officer',
    'CEO': 'Chief Executive Officer',
    'CONSULTANT': 'Consultant',
    'FREELANCER': 'Freelancer',
    'CONTRACTOR': 'Contractor',
    'OTHERS': 'Others',
  };
  return roleMap[role] || role.replace(/_/g, ' ');
};

export const getRoleIcon = (role) => {
  const category = getRoleCategory(role);
  const iconMap = {
    'C_LEVEL': '👑',
    'VP_LEVEL': '🏆',
    'DIRECTOR_LEVEL': '⭐',
    'MANAGEMENT': '👨‍💼',
    'TEAM_LEADS': '🎯',
    'SENIOR_STAFF': '🔧',
    'ADMIN_STAFF': '🔐',
    'HR_STAFF': '🏢',
    'IT_SUPPORT': '💻',
    'ENGINEERING': '💻',
    'QA': '✅',
    'DEVOPS': '⚙️',
    'DATA_AI': '📊',
    'SECURITY': '🛡️',
    'DESIGN': '🎨',
    'PRODUCT': '📋',
    'SUPPORT': '🎧',
    'SALES_MARKETING': '📈',
    'FINANCE': '💰',
    'LEGAL': '⚖️',
    'OPERATIONS': '🔄',
    'ENTRY_LEVEL': '🎓',
    'CONTRACTORS': '👤',
    'OTHERS': '👤',
  };
  return iconMap[category] || '👤';
};

export const getRoleBadgeColor = (role) => {
  const category = getRoleCategory(role);
  const colorMap = {
    'C_LEVEL': 'bg-gradient-to-r from-indigo-700 to-violet-800 text-slate-900 dark:text-white shadow-sm',
    'VP_LEVEL': 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-slate-900 dark:text-white shadow-sm',
    'DIRECTOR_LEVEL': 'bg-gradient-to-r from-blue-600 to-indigo-700 text-slate-900 dark:text-white shadow-sm',
    'MANAGEMENT': 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-900 dark:text-white shadow-sm',
    'TEAM_LEADS': 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-slate-900 dark:text-white shadow-sm',
    'SENIOR_STAFF': 'bg-gradient-to-r from-slate-600 to-slate-700 text-slate-900 dark:text-white shadow-sm',
    'ADMIN_STAFF': 'bg-gradient-to-r from-indigo-700 to-blue-800 text-slate-900 dark:text-white shadow-sm',
    'HR_STAFF': 'bg-gradient-to-r from-violet-600 to-indigo-700 text-slate-900 dark:text-white shadow-sm',
    'IT_SUPPORT': 'bg-gradient-to-r from-slate-600 to-slate-700 text-slate-900 dark:text-white shadow-sm',
    'ENGINEERING': 'bg-gradient-to-r from-blue-500 to-blue-600 text-slate-900 dark:text-white shadow-sm',
    'QA': 'bg-gradient-to-r from-teal-600 to-emerald-700 text-slate-900 dark:text-white shadow-sm',
    'DEVOPS': 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-900 dark:text-white shadow-sm',
    'DATA_AI': 'bg-gradient-to-r from-violet-500 to-indigo-600 text-slate-900 dark:text-white shadow-sm',
    'SECURITY': 'bg-gradient-to-r from-slate-800 to-black text-slate-900 dark:text-white shadow-sm',
    'DESIGN': 'bg-gradient-to-r from-fuchsia-600 to-violet-700 text-slate-900 dark:text-white shadow-sm',
    'PRODUCT': 'bg-gradient-to-r from-indigo-500 to-blue-600 text-slate-900 dark:text-white shadow-sm',
    'SUPPORT': 'bg-gradient-to-r from-slate-500 to-slate-600 text-slate-900 dark:text-white shadow-sm',
    'SALES_MARKETING': 'bg-gradient-to-r from-blue-600 to-indigo-700 text-slate-900 dark:text-white shadow-sm',
    'FINANCE': 'bg-gradient-to-r from-emerald-600 to-teal-700 text-slate-900 dark:text-white shadow-sm',
    'LEGAL': 'bg-gradient-to-r from-slate-900 to-slate-800 text-slate-900 dark:text-white shadow-sm',
    'OPERATIONS': 'bg-gradient-to-r from-slate-600 to-slate-700 text-slate-900 dark:text-white shadow-sm',
    'ENTRY_LEVEL': 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800 shadow-sm',
    'CONTRACTORS': 'bg-gradient-to-r from-slate-400 to-slate-500 text-slate-900 dark:text-white shadow-sm',
    'OTHERS': 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 shadow-sm',
  };
  return colorMap[category] || 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700';
};

// Helper to get all roles in a category or above certain permission level
export const getRolesByMinLevel = (minLevel) => {
  const allRoles = [];
  Object.values(ROLE_CATEGORIES).forEach(roles => {
    roles.forEach(role => {
      if (getPermissionLevel(role) >= minLevel) {
        allRoles.push(role);
      }
    });
  });
  return allRoles;
};
