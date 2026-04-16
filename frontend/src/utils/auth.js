import { 
  getRoleCategory, 
  getPermissionLevel, 
  hasExecutiveAccess, 
  hasManagementAccess,
  hasLeadAccess,
  canManageUsers as canManageUsersRole,
  canManageHR as canManageHRRole,
  canManageAssets as canManageAssetsRole,
  canManageFinance as canManageFinanceRole,
  PERMISSION_LEVELS,
  ROLE_CATEGORIES
} from './roleConfig';

// Token management
export const getToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const removeTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

// User management
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Get user's role
export const getUserRole = () => {
  const user = getCurrentUser();
  
  // Superuser: treat as CEO for highest permissions
  if (user?.is_superuser) {
    return 'CEO';
  }
  
  // Prefer explicit profile role
  const profileRole = user?.profile?.role;
  if (profileRole) {
    return profileRole;
  }
  
  if (user?.role) {
    return user.role;
  }
  
  // Default when no explicit role is set
  return 'EMPLOYEE';
};

// Get user's permission level (0-5)
export const getUserPermissionLevel = () => {
  const role = getUserRole();
  return getPermissionLevel(role);
};

// Get user's role category
export const getUserRoleCategory = () => {
  const role = getUserRole();
  return getRoleCategory(role);
};

// Legacy role checks (backward compatible)
export const isHRManager = () => {
  const user = getCurrentUser();
  const role = getUserRole();
  const groups = Array.isArray(user?.groups) 
    ? user.groups.map(g => String(g).toLowerCase()) 
    : [];
  
  return (
    role === 'HR_MANAGER' ||
    role === 'HR_EXECUTIVE' ||
    role === 'HR_BUSINESS_PARTNER' ||
    canManageHRRole(role) ||
    groups.includes('hr manager') ||
    groups.includes('hr_admin') ||
    groups.includes('hr admin')
  );
};

export const isAdmin = () => {
  const user = getCurrentUser();
  const role = getUserRole();
  const groups = Array.isArray(user?.groups) 
    ? user.groups.map(g => String(g).toLowerCase()) 
    : [];
  
  return (
    !!user?.is_superuser ||
    role === 'ADMIN' ||
    role === 'OFFICE_ADMIN' ||
    hasExecutiveAccess(role) ||
    groups.includes('admin')
  );
};

export const isManager = () => {
  const role = getUserRole();
  return hasManagementAccess(role);
};

export const isITSupporter = () => {
  const role = getUserRole();
  const category = getRoleCategory(role);
  
  return (
    role === 'IT_SUPPORTER' ||
    role === 'IT_SUPPORT' ||
    role === 'SYSTEM_ADMIN' ||
    category === 'IT_SUPPORT'
  );
};

export const isHROrManager = () => {
  const role = getUserRole();
  return canManageHRRole(role) || hasManagementAccess(role);
};

// New comprehensive permission checks
export const hasExecutivePermissions = () => {
  const role = getUserRole();
  return hasExecutiveAccess(role);
};

export const hasManagementPermissions = () => {
  const role = getUserRole();
  return hasManagementAccess(role);
};

export const hasLeadPermissions = () => {
  const role = getUserRole();
  return hasLeadAccess(role);
};

export const canManageUsers = () => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  
  const role = getUserRole();
  return canManageUsersRole(role);
};

export const canManageHR = () => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  
  const role = getUserRole();
  return canManageHRRole(role);
};

export const canManageAssets = () => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  
  const role = getUserRole();
  return canManageAssetsRole(role);
};

export const canManageFinance = () => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  
  const role = getUserRole();
  return canManageFinanceRole(role);
};

export const canManageResources = () => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  
  const role = getUserRole();
  const category = getRoleCategory(role);
  
  return (
    hasExecutiveAccess(role) ||
    canManageHRRole(role) ||
    canManageAssetsRole(role) ||
    category === 'IT_SUPPORT' ||
    category === 'DEVOPS' ||
    category === 'ADMIN_STAFF'
  );
};

export const hasAdminPrivileges = () => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  
  const role = getUserRole();
  const permissionLevel = getPermissionLevel(role);
  const groups = Array.isArray(user?.groups) 
    ? user.groups.map(g => String(g).toLowerCase()) 
    : [];
  
  return (
    permissionLevel >= PERMISSION_LEVELS.SENIOR_LEADER ||
    canManageHRRole(role) ||
    canManageUsersRole(role) ||
    groups.includes('admin') ||
    groups.includes('hr manager')
  );
};

export const canApproveLeave = () => {
  const role = getUserRole();
  return (
    hasManagementAccess(role) ||
    hasLeadAccess(role) ||
    canManageHRRole(role)
  );
};

export const canManageEmployees = () => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  
  const role = getUserRole();
  const permissionLevel = getPermissionLevel(role);
  
  return (
    permissionLevel >= PERMISSION_LEVELS.SENIOR_LEADER ||
    canManageHRRole(role) ||
    hasManagementAccess(role)
  );
};

export const canManageOnboarding = () => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  
  const role = getUserRole();
  return (
    hasExecutiveAccess(role) ||
    canManageHRRole(role)
  );
};

export const canViewAnalytics = () => {
  const role = getUserRole();
  const permissionLevel = getPermissionLevel(role);
  
  return (
    permissionLevel >= PERMISSION_LEVELS.MANAGER ||
    canManageHRRole(role)
  );
};

// Permission level comparison
export const hasMinimumPermissionLevel = (minLevel) => {
  const userLevel = getUserPermissionLevel();
  return userLevel >= minLevel;
};

// Check if user has specific permission by level name
export const hasPermissionLevel = (levelName) => {
  const requiredLevel = PERMISSION_LEVELS[levelName];
  if (requiredLevel === undefined) {
    console.warn(`Unknown permission level: ${levelName}`);
    return false;
  }
  return hasMinimumPermissionLevel(requiredLevel);
};

// Enhanced permission check with role hierarchy
export const hasPermission = (requiredRole) => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  
  const currentRole = getUserRole();
  const currentLevel = getPermissionLevel(currentRole);
  const requiredLevel = getPermissionLevel(requiredRole);
  
  return currentLevel >= requiredLevel;
};

// Check if user is in specific role category
export const isInRoleCategory = (categoryName) => {
  const role = getUserRole();
  const category = getRoleCategory(role);
  return category === categoryName;
};

// Check if user has any of the specified roles
export const hasAnyRole = (roles) => {
  const currentRole = getUserRole();
  return roles.includes(currentRole);
};

// Check if user has any of the specified categories
export const hasAnyCategory = (categories) => {
  const category = getUserRoleCategory();
  return categories.includes(category);
};

// Role category checks
export const isCLevel = () => isInRoleCategory('C_LEVEL');
export const isVPLevel = () => isInRoleCategory('VP_LEVEL');
export const isDirectorLevel = () => isInRoleCategory('DIRECTOR_LEVEL');
export const isManagementLevel = () => isInRoleCategory('MANAGEMENT');
export const isTeamLead = () => isInRoleCategory('TEAM_LEADS');
export const isITStaff = () => {
  const category = getUserRoleCategory();
  return ['IT_SUPPORT', 'DEVOPS', 'SECURITY'].includes(category);
};
export const isHRStaff = () => isInRoleCategory('HR_STAFF');
export const isEngineeringStaff = () => {
  const category = getUserRoleCategory();
  return ['ENGINEERING', 'QA', 'DEVOPS'].includes(category);
};

// Specific feature permissions
export const canAccessUserManagement = () => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  
  const role = getUserRole();
  return (
    role === 'CEO' ||
    role === 'CIO' ||
    role === 'ADMIN' ||
    canManageUsersRole(role)
  );
};

export const canAccessAssetManagement = () => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  
  const role = getUserRole();
  const category = getRoleCategory(role);
  
  return (
    canManageAssetsRole(role) ||
    canManageHRRole(role) ||
    category === 'IT_SUPPORT' ||
    category === 'DEVOPS' ||
    category === 'ADMIN_STAFF'
  );
};

export const canAccessLeaveManagement = () => {
  // All authenticated users can access leave management (to see their own)
  return isAuthenticated();
};

export const canAccessAttendance = () => {
  // All authenticated users can access attendance (to see their own)
  return isAuthenticated();
};

export const canAccessResourceManagement = () => {
  return canManageResources();
};

export const canAccessReports = () => {
  const role = getUserRole();
  const permissionLevel = getPermissionLevel(role);
  
  return (
    permissionLevel >= PERMISSION_LEVELS.MANAGER ||
    canManageHRRole(role) ||
    canManageFinanceRole(role)
  );
};

// Get user's accessible modules based on role
export const getAccessibleModules = () => {
  const modules = {
    dashboard: true, // Everyone has dashboard access
    attendance: canAccessAttendance(),
    leave: canAccessLeaveManagement(),
    employees: canManageEmployees(),
    assets: canAccessAssetManagement(),
    resources: canAccessResourceManagement(),
    users: canAccessUserManagement(),
    reports: canAccessReports(),
    settings: hasAdminPrivileges(),
    onboarding: canManageOnboarding(),
    analytics: canViewAnalytics(),
  };
  
  return modules;
};

// Get user's role display info
export const getUserRoleInfo = () => {
  const role = getUserRole();
  const category = getRoleCategory(role);
  const permissionLevel = getPermissionLevel(role);
  
  return {
    role,
    category,
    permissionLevel,
    isExecutive: hasExecutiveAccess(role),
    isManager: hasManagementAccess(role),
    isLead: hasLeadAccess(role),
    canManageUsers: canManageUsersRole(role),
    canManageHR: canManageHRRole(role),
    canManageAssets: canManageAssetsRole(role),
    canManageFinance: canManageFinanceRole(role),
  };
};

// Debug helper
export const debugUserPermissions = () => {
  const user = getCurrentUser();
  const roleInfo = getUserRoleInfo();
  const modules = getAccessibleModules();
  
  console.group('🔐 User Permissions Debug');
  console.log('User:', user?.username);
  console.log('Is Superuser:', user?.is_superuser);
  console.log('Role Info:', roleInfo);
  console.log('Accessible Modules:', modules);
  console.groupEnd();
  
  return { user, roleInfo, modules };
};
