// export const getToken = () => localStorage.getItem('access_token');
// export const getRefreshToken = () => localStorage.getItem('refresh_token');

// export const setTokens = (accessToken, refreshToken) => {
//   localStorage.setItem('access_token', accessToken);
//   localStorage.setItem('refresh_token', refreshToken);
// };

// export const removeTokens = () => {
//   localStorage.removeItem('access_token');
//   localStorage.removeItem('refresh_token');
//   localStorage.removeItem('user');
// };

// export const isAuthenticated = () => {
//   const token = getToken();
//   return !!token;
// };

// export const getCurrentUser = () => {
//   const user = localStorage.getItem('user');
//   return user ? JSON.parse(user) : null;
// };

// export const setCurrentUser = (user) => {
//   localStorage.setItem('user', JSON.stringify(user));
// };

// export const isHRManager = () => {
//   const user = getCurrentUser();
//   return user?.profile?.role === 'HR_MANAGER';
// };

// export const isAdmin = () => {
//   const user = getCurrentUser();
//   return user?.profile?.role === 'ADMIN';
// };

// export const isManager = () => {
//   const user = getCurrentUser();
//   return user?.profile?.role === 'MANAGER';
// };


// export const getUserRole = () => {
//   const user = getCurrentUser();
//   return user?.profile?.role || 'EMPLOYEE';
// };
// export const isHROrManager = () => {
//   const user = getCurrentUser();
//   return user?.profile?.role === 'HR_MANAGER' || user?.profile?.role === 'MANAGER';
// };

// export const canApproveLeave = () => {
//   return isHROrManager();
// };
// export const hasPermission = (requiredRole) => {
//   const currentRole = getUserRole();
//   const roleHierarchy = ['EMPLOYEE', 'HR_MANAGER', 'ADMIN', 'MANAGER'];
//   const currentRoleIndex = roleHierarchy.indexOf(currentRole);
//   const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
//   return currentRoleIndex >= requiredRoleIndex;
// };



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

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const isHRManager = () => {
  const user = getCurrentUser();
  const groups = Array.isArray(user?.groups) ? user.groups.map(g => String(g).toLowerCase()) : [];
  return (
    user?.profile?.role === 'HR_MANAGER' ||
    groups.includes('hr manager') ||
    groups.includes('hr_admin') ||
    groups.includes('hr admin')
  );
};

export const isAdmin = () => {
  const user = getCurrentUser();
  const groups = Array.isArray(user?.groups) ? user.groups.map(g => String(g).toLowerCase()) : [];
  return (
    !!user?.is_superuser ||
    user?.profile?.role === 'ADMIN' ||
    groups.includes('admin') ||
    groups.includes('hr manager') ||
    groups.includes('hr_admin') ||
    groups.includes('hr admin')
  );
};

export const isManager = () => {
  const user = getCurrentUser();
  return user?.profile?.role === 'MANAGER';
};

// NEW: IT Supporter role check
export const isITSupporter = () => {
  const user = getCurrentUser();
  return user?.profile?.role === 'IT_SUPPORTER';
};

export const getUserRole = () => {
  const user = getCurrentUser();
  // Superuser: treat as ADMIN everywhere in the UI
  if (user?.is_superuser) {
    return 'ADMIN';
  }

  // Prefer explicit profile role for display, then fallback to top-level user.role
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

export const isHROrManager = () => {
  const user = getCurrentUser();
  return user?.profile?.role === 'HR_MANAGER' || user?.profile?.role === 'MANAGER';
};

// NEW: Check if user can manage resources (Admin, HR Manager, or IT Supporter)
export const canManageResources = () => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  const role = user?.profile?.role;
  return role === 'ADMIN' || role === 'HR_MANAGER' || role === 'IT_SUPPORTER';
};

// NEW: Check if user has administrative privileges
export const hasAdminPrivileges = () => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  const role = user?.profile?.role;
  const groups = Array.isArray(user?.groups) ? user.groups.map(g => String(g).toLowerCase()) : [];
  return (
    role === 'ADMIN' ||
    role === 'HR_MANAGER' ||
    role === 'IT_SUPPORTER' ||
    groups.includes('admin') ||
    groups.includes('hr manager') ||
    groups.includes('hr_admin') ||
    groups.includes('hr admin') ||
    groups.includes('it supporter') ||
    groups.includes('it_supporter')
  );
};

export const canApproveLeave = () => {
  return isHROrManager();
};

export const hasPermission = (requiredRole) => {
  const user = getCurrentUser();
  if (user?.is_superuser) return true;
  const currentRole = getUserRole();
  const roleHierarchy = ['EMPLOYEE', 'IT_SUPPORTER', 'HR_MANAGER', 'ADMIN', 'MANAGER'];
  const currentRoleIndex = roleHierarchy.indexOf(currentRole);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
  return currentRoleIndex >= requiredRoleIndex;
};