
// import React from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import {
//   HomeIcon,
//   UsersIcon,
//   ClockIcon,
//   CalendarDaysIcon,
//   KeyIcon,
//   ChartBarIcon,
//   CogIcon,
//   DocumentTextIcon,
//   BuildingOfficeIcon,
//   UserGroupIcon,
//   ComputerDesktopIcon,
//   UserPlusIcon,
//   UserMinusIcon,
//   WrenchScrewdriverIcon,
//   LinkIcon, // Add this import
// } from '@heroicons/react/24/outline';
// import { isHRManager, isAdmin, isITSupporter, getUserRole, hasAdminPrivileges } from '../../utils/auth';
// import { authAPI } from '../../services/api';
// import { useTheme } from '../../context/ThemeContext';

// const Sidebar = ({ isOpen, onClose }) => {
//   const location = useLocation();
//   const userRole = getUserRole();
//   const [permissions, setPermissions] = React.useState([]);
//   React.useEffect(() => {
//     (async () => {
//       try {
//         const resp = await authAPI.getMyPermissions();
//         setPermissions(Array.isArray(resp?.data?.permissions) ? resp.data.permissions : []);
//       } catch (_) {
//         setPermissions([]);
//       }
//     })();
//   }, []);

//   const hasPerm = (code) => (permissions || []).includes(code);
//   const allowedByPerms = (href) => {
//     // Minimal mapping for key modules we know
//     if (href === '/onboarding/assets') {
//       // Allow access if user has any meaningful assets permissions
//       const assetPerms = [
//         'assets.view_asset',
//         'assets.view_assetassignment',
//         'assets.view_assethistory',
//         'assets.view_assetreturn',
//         'assets.view_assettype',
//         'assets.add_asset',
//         'assets.change_asset',
//         'assets.delete_asset',
//       ];
//       return assetPerms.some(hasPerm);
//     }
//     if (href === '/attendance') return hasPerm('attendance.view_attendancerecord');
//     if (href === '/leave') return hasPerm('leave_management.view_leaverequest');
//     return false;
//   };
//   const { theme } = useTheme();

//   const navigation = [
//     { 
//       name: 'Dashboard', 
//       href: '/dashboard', 
//       icon: HomeIcon, 
//       roles: ['EMPLOYEE', 'HR_MANAGER', 'ADMIN', 'MANAGER', 'IT_SUPPORTER'],
//       description: 'Overview and quick stats',
//       color: 'from-blue-500 to-indigo-600'
//     },
//     {
//       name: 'Users and Authentication',
//       href: '/users-auth',
//       icon: UsersIcon,
//       roles: ['ADMIN'],
//       description: 'Manage users and authentication',
//       color: 'from-sky-500 to-blue-600',
//     },
//     { 
//       name: 'Asset Management', 
//       href: '/onboarding/assets', 
//       icon: WrenchScrewdriverIcon, 
//       roles: ['HR_MANAGER', 'ADMIN', 'IT_SUPPORTER'],
//       description: 'Manage company assets',
//       color: 'from-orange-500 to-red-600'
//     },
//     { 
//       name: 'My Profile', 
//       href: '/profile', 
//       icon: UserGroupIcon, 
//       roles: ['EMPLOYEE','HR_MANAGER','MANAGER', 'IT_SUPPORTER', 'ADMIN'],
//       description: 'View and edit your profile',
//       color: 'from-purple-500 to-pink-600'
//     },
//     {
//       name: 'My Team',
//       href: '/my-team',
//       icon: UsersIcon,
//       roles: ['EMPLOYEE', 'HR_MANAGER', 'MANAGER', 'IT_SUPPORTER', 'ADMIN'],
//       description: 'View your team members and reporting structure',
//       color: 'from-emerald-500 to-teal-600',
//     },
//     { 
//       name: 'Employees', 
//       href: '/employees', 
//       icon: UsersIcon, 
//       roles: ['HR_MANAGER', 'ADMIN'],
//       description: 'Manage employee directory',
//       color: 'from-green-500 to-emerald-600'
//     },
//     { 
//       name: 'Attendance', 
//       href: '/attendance', 
//       icon: ClockIcon, 
//       roles: ['EMPLOYEE', 'HR_MANAGER', 'ADMIN', 'MANAGER', 'IT_SUPPORTER'],
//       description: 'Track time and attendance',
//       color: 'from-yellow-500 to-orange-600'
//     },
//     { 
//       name: 'Leave Management', 
//       href: '/leave', 
//       icon: CalendarDaysIcon, 
//       roles: ['EMPLOYEE', 'HR_MANAGER', 'ADMIN', 'MANAGER', 'IT_SUPPORTER'],
//       description: 'Manage leave requests',
//       color: 'from-blue-600 to-purple-600'
//     },
//     {
//       name: 'Work From Home',
//       href: '/work-from-home',
//       icon: HomeIcon,
//       roles: ['HR_MANAGER', 'EMPLOYEE', 'ADMIN', 'MANAGER', 'IT_SUPPORTER'],
//       description: 'Manage WFH requests',
//       color: 'from-violet-500 to-purple-600'
//     },
//     { 
//       name: 'Resource Management', 
//       href: '/resource-management', 
//       icon: KeyIcon, 
//       roles: ['EMPLOYEE', 'HR_MANAGER', 'ADMIN', 'MANAGER', 'IT_SUPPORTER'],
//       description: 'Access requests and resources',
//       color: 'from-emerald-500 to-teal-600'
//     },
//     { 
//       name: 'My Assets', 
//       href: '/my-assets', 
//       icon: ComputerDesktopIcon, 
//       roles: ['EMPLOYEE', 'HR_MANAGER', 'ADMIN', 'MANAGER', 'IT_SUPPORTER'],
//       description: 'Assets assigned to you',
//       color: 'from-indigo-500 to-blue-600'
//     },
//     { 
//       name: 'Employee Onboarding', 
//       href: '/onboarding/employees', 
//       icon: UserPlusIcon, 
//       roles: ['HR_MANAGER', 'ADMIN'],
//       description: 'Manage new employee onboarding',
//       color: 'from-cyan-500 to-blue-600'
//     },
//     { 
//       name: 'Onboarding Links', 
//       href: '/onboarding/link-generator', 
//       icon: LinkIcon, 
//       roles: ['HR_MANAGER', 'ADMIN'],
//       description: 'Generate secure onboarding links',
//       color: 'from-indigo-500 to-purple-600'
//     },
//     { 
//       name: 'Employee Offboarding', 
//       href: '/onboarding/offboarding', 
//       icon: UserMinusIcon, 
//       roles: ['HR_MANAGER', 'ADMIN'],
//       description: 'Manage employee exit process',
//       color: 'from-rose-500 to-pink-600'
//     },
//     { 
//       name: 'Biometric Devices', 
//       href: '/attendance/biometric', 
//       icon: ComputerDesktopIcon, 
//       roles: ['HR_MANAGER', 'ADMIN', 'IT_SUPPORTER'],
//       description: 'Manage biometric integration',
//       color: 'from-teal-500 to-cyan-600'
//     },
//     { 
//       name: 'Settings', 
//       href: '/profile', 
//       icon: CogIcon, 
//       roles: ['HR_MANAGER', 'ADMIN', 'IT_SUPPORTER'],
//       description: 'System configuration',
//       color: 'from-gray-500 to-slate-600'
//     },
//   ];
//   const filteredNavigation = navigation.filter((item) => {
//     if (!(item.roles.includes(userRole) || allowedByPerms(item.href))) return false;
//     // Extra safety: Users and Authentication should only show for real admins
//     if (item.href === '/users-auth') {
//       return isAdmin();
//     }
//     return true;
//   });

//   const isActiveLink = (href) => {
//     if (href === '/dashboard') {
//       return location.pathname === href;
//     }
//     return location.pathname === href || location.pathname.startsWith(href + '/');
//   };

//   const getRoleBadgeColor = (role) => {
//     switch (role) {
//       case 'ADMIN':
//         return 'bg-gradient-to-r from-red-500 to-pink-600 text-white';
//       case 'HR_MANAGER':
//         return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white';
//       case 'IT_SUPPORTER':
//         return 'bg-gradient-to-r from-purple-500 to-violet-600 text-white';
//       case 'MANAGER':
//         return 'bg-gradient-to-r from-orange-500 to-amber-600 text-white';
//       default:
//         return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
//     }
//   };

//   const getRoleIcon = (role) => {
//     switch (role) {
//       case 'ADMIN':
//         return '👑';
//       case 'HR_MANAGER':
//         return '🏢';
//       case 'IT_SUPPORTER':
//         return '💻';
//       case 'MANAGER':
//         return '👨‍💼';
//       default:
//         return '👤';
//     }
//   };

//   const getRoleDisplayName = (role) => {
//     switch (role) {
//       case 'IT_SUPPORTER':
//         return 'IT Supporter';
//       case 'HR_MANAGER':
//         return 'HR Manager';
//       default:
//         return role.replace('_', ' ');
//     }
//   };

//   return (
//     <>
//       {/* Mobile backdrop */}
//       {isOpen && (
//         <div 
//           className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-all duration-300"
//           onClick={onClose}
//         />
//       )}

//       {/* Sidebar */}
//       <div className={`
//         fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b ${theme.sidebarGradient} 
//         transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
//         shadow-2xl border-r border-white/10
//         ${isOpen ? 'translate-x-0' : '-translate-x-full'}
//       `}>
//         <div className="flex flex-col h-full relative overflow-hidden">
//           {/* Decorative background elements */}
//           <div className="absolute inset-0 opacity-10">
//             <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
//             <div className="absolute top-60 right-8 w-24 h-24 bg-purple-500 rounded-full blur-2xl"></div>
//             <div className="absolute bottom-40 left-6 w-28 h-28 bg-indigo-500 rounded-full blur-3xl"></div>
//           </div>

//           {/* Logo and brand */}
//           <div className={`relative z-10 flex items-center justify-center h-20 px-4 bg-gradient-to-r ${theme.headerGradient} backdrop-blur-sm border-b border-white/10`}>
//             <div className="flex items-center">
//               <div className={`h-10 w-10 bg-gradient-to-r ${theme.primaryGradient} rounded-xl flex items-center justify-center shadow-lg border border-white/20`}>
//                 <span className="text-white font-bold text-sm">OMH</span>
//               </div>
//               <h1 className="ml-3 text-white text-xl font-bold bg-gradient-to-r from-blue-100 to-purple-100 bg-clip-text text-transparent">
//                 Optima managementHub
//               </h1>
//             </div>
//           </div>

//           {/* Navigation */}
//           <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto relative z-10 custom-scrollbar">
//             {filteredNavigation.map((item) => {
//               const Icon = item.icon;
//               const isActive = isActiveLink(item.href);
              
//               return (
//                 <Link
//                   key={item.name}
//                   to={item.href}
//                   onClick={onClose}
//                   className={`
//                     group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out
//                     relative overflow-hidden
//                     ${isActive
//                       ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-lg shadow-blue-500/25 scale-105 border border-white/20`
//                       : 'text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105 hover:shadow-lg hover:border-white/20 border border-transparent'
//                     }
//                   `}
//                   title={item.description}
//                 >
//                   {/* Active item background effect */}
//                   {isActive && (
//                     <div className={`absolute inset-0 bg-gradient-to-r ${theme.primaryGradient} opacity-20 animate-pulse`}></div>
//                   )}
                  
//                   <div className={`
//                     relative z-10 w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-300
//                     ${isActive 
//                       ? 'bg-white/20 shadow-md border border-white/30' 
//                       : `bg-gradient-to-r ${item.color} opacity-80 group-hover:opacity-100 group-hover:shadow-md group-hover:scale-110`
//                     }
//                   `}>
//                     <Icon className="h-4 w-4 text-white" />
//                   </div>
                  
//                   <div className="flex-1 relative z-10">
//                     <div className="font-semibold">{item.name}</div>
//                     <div className={`
//                       text-xs mt-0.5 transition-colors duration-300
//                       ${isActive ? 'text-blue-100' : 'text-gray-400 group-hover:text-gray-200'}
//                     `}>
//                       {item.description}
//                     </div>
//                   </div>
                  
//                   {isActive && (
//                     <div className="relative z-10 flex items-center space-x-1">
//                       <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
//                       <div className="w-1 h-1 bg-white/60 rounded-full"></div>
//                     </div>
//                   )}
//                 </Link>
//               );
//             })}
//           </nav>

//           {/* Enhanced stats footer */}
//           <div className={`relative z-10 p-3 border-t border-white/10 bg-gradient-to-r ${theme.sidebarGradient} backdrop-blur-sm`}>
//             <div className="space-y-1">
//               <div className="flex items-center justify-between text-xs">
//                 <span className="text-gray-300 font-medium">System Status</span>
//                 <span className="text-green-400 flex items-center font-semibold">
//                   <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></div>
//                   Online
//                 </span>
//               </div>
              
//               <div className="flex items-center justify-between text-xs">
//                 <span className="text-gray-300 font-medium">Version</span>
//                 <span className="text-blue-300 font-semibold bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
//                   v1.0.0
//                 </span>
//               </div>

//               <div className="pt-1 border-t border-white/10">
//                 <div className="flex items-center justify-center">
//                   <div className="flex space-x-1">
//                     <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
//                     <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
//                     <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Custom Styles */}
//       <style>{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 4px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: rgba(255, 255, 255, 0.1);
//           border-radius: 10px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: linear-gradient(45deg, #3b82f6, #8b5cf6);
//           border-radius: 10px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: linear-gradient(45deg, #2563eb, #7c3aed);
//         }
//       `}</style>
//     </>
//   );
// };

// export default Sidebar;




import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  ClockIcon,
  CalendarDaysIcon,
  KeyIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
  UserPlusIcon,
  UserMinusIcon,
  WrenchScrewdriverIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { getUserRole } from '../../utils/auth';
import { authAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import {
  hasExecutiveAccess,
  hasManagementAccess,
  hasLeadAccess,
  canManageUsers,
  canManageHR,
  canManageAssets,
  getRoleDisplayName,
  getRoleIcon,
  getRoleBadgeColor,
  PERMISSION_LEVELS,
  getPermissionLevel,
  ROLE_CATEGORIES,
} from '../../utils/roleConfig';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const userRole = getUserRole();
  const [permissions, setPermissions] = React.useState([]);
  
  React.useEffect(() => {
    (async () => {
      try {
        const resp = await authAPI.getMyPermissions();
        setPermissions(Array.isArray(resp?.data?.permissions) ? resp.data.permissions : []);
      } catch (_) {
        setPermissions([]);
      }
    })();
  }, []);

  const hasPerm = (code) => (permissions || []).includes(code);
  
  const allowedByPerms = (href) => {
    if (href === '/onboarding/assets') {
      const assetPerms = [
        'assets.view_asset',
        'assets.view_assetassignment',
        'assets.view_assethistory',
        'assets.view_assetreturn',
        'assets.view_assettype',
        'assets.add_asset',
        'assets.change_asset',
        'assets.delete_asset',
      ];
      return assetPerms.some(hasPerm);
    }
    if (href === '/attendance') return hasPerm('attendance.view_attendancerecord');
    if (href === '/leave') return hasPerm('leave_management.view_leaverequest');
    return false;
  };
  
  const { theme } = useTheme();

  // Helper function to check if user has access based on permission level
  const hasAccessByLevel = (minLevel) => {
    return getPermissionLevel(userRole) >= minLevel;
  };

  // Get all roles for a navigation item based on permission levels
  const getAllRoles = () => {
    const allRoles = [];
    Object.values(ROLE_CATEGORIES).forEach(roles => {
      allRoles.push(...roles);
    });
    return allRoles;
  };

  const getManagementRoles = () => {
    return [
      ...ROLE_CATEGORIES.C_LEVEL,
      ...ROLE_CATEGORIES.VP_LEVEL,
      ...ROLE_CATEGORIES.DIRECTOR_LEVEL,
      ...ROLE_CATEGORIES.MANAGEMENT,
    ];
  };

  const getHRRoles = () => {
    return [
      ...ROLE_CATEGORIES.HR_STAFF,
      ...ROLE_CATEGORIES.C_LEVEL,
      'ADMIN',
    ];
  };

  const getITRoles = () => {
    return [
      ...ROLE_CATEGORIES.IT_SUPPORT,
      ...ROLE_CATEGORIES.ADMIN_STAFF,
      'CTO',
      'CIO',
    ];
  };

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: HomeIcon, 
      roles: getAllRoles(),
      description: 'Overview and quick stats',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      name: 'Users and Authentication',
      href: '/users-auth',
      icon: UsersIcon,
      roles: ['ADMIN', 'CEO', 'CIO'],
      description: 'Manage users and authentication',
      color: 'from-sky-500 to-blue-600',
    },
    { 
      name: 'Asset Management', 
      href: '/onboarding/assets', 
      icon: WrenchScrewdriverIcon, 
      roles: [...getITRoles(), ...getHRRoles()],
      description: 'Manage company assets',
      color: 'from-orange-500 to-red-600'
    },
    { 
      name: 'My Profile', 
      href: '/profile', 
      icon: UserGroupIcon, 
      roles: getAllRoles(),
      description: 'View and edit your profile',
      color: 'from-purple-500 to-pink-600'
    },
    {
      name: 'My Team',
      href: '/my-team',
      icon: UsersIcon,
      roles: getAllRoles(),
      description: 'View your team members and reporting structure',
      color: 'from-emerald-500 to-teal-600',
    },
    { 
      name: 'Employees', 
      href: '/employees', 
      icon: UsersIcon, 
      roles: [...getHRRoles(), ...getManagementRoles()],
      description: 'Manage employee directory',
      color: 'from-green-500 to-emerald-600'
    },
    { 
      name: 'Attendance', 
      href: '/attendance', 
      icon: ClockIcon, 
      roles: getAllRoles(),
      description: 'Track time and attendance',
      color: 'from-yellow-500 to-orange-600'
    },
    { 
      name: 'Leave Management', 
      href: '/leave', 
      icon: CalendarDaysIcon, 
      roles: getAllRoles(),
      description: 'Manage leave requests',
      color: 'from-blue-600 to-purple-600'
    },
    {
      name: 'Work From Home',
      href: '/work-from-home',
      icon: HomeIcon,
      roles: getAllRoles(),
      description: 'Manage WFH requests',
      color: 'from-violet-500 to-purple-600'
    },
    { 
      name: 'Resource Management', 
      href: '/resource-management', 
      icon: KeyIcon, 
      roles: getAllRoles(),
      description: 'Access requests and resources',
      color: 'from-emerald-500 to-teal-600'
    },
    { 
      name: 'My Assets', 
      href: '/my-assets', 
      icon: ComputerDesktopIcon, 
      roles: getAllRoles(),
      description: 'Assets assigned to you',
      color: 'from-indigo-500 to-blue-600'
    },
    { 
      name: 'Employee Onboarding', 
      href: '/onboarding/employees', 
      icon: UserPlusIcon, 
      roles: getHRRoles(),
      description: 'Manage new employee onboarding',
      color: 'from-cyan-500 to-blue-600'
    },
    { 
      name: 'Onboarding Links', 
      href: '/onboarding/link-generator', 
      icon: LinkIcon, 
      roles: getHRRoles(),
      description: 'Generate secure onboarding links',
      color: 'from-indigo-500 to-purple-600'
    },
    { 
      name: 'Employee Offboarding', 
      href: '/onboarding/offboarding', 
      icon: UserMinusIcon, 
      roles: getHRRoles(),
      description: 'Manage employee exit process',
      color: 'from-rose-500 to-pink-600'
    },
    { 
      name: 'Biometric Devices', 
      href: '/attendance/biometric', 
      icon: ComputerDesktopIcon, 
      roles: [...getITRoles(), ...getHRRoles()],
      description: 'Manage biometric integration',
      color: 'from-teal-500 to-cyan-600'
    },
    { 
      name: 'Settings', 
      href: '/profile', 
      icon: CogIcon, 
      roles: [...getManagementRoles(), ...getITRoles(), ...getHRRoles()],
      description: 'System configuration',
      color: 'from-gray-500 to-slate-600'
    },
  ];
  
  const filteredNavigation = navigation.filter((item) => {
    if (!(item.roles.includes(userRole) || allowedByPerms(item.href))) return false;
    // Extra safety: Users and Authentication should only show for authorized roles
    if (item.href === '/users-auth') {
      return canManageUsers(userRole);
    }
    return true;
  });

  const isActiveLink = (href) => {
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b ${theme.sidebarGradient} 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        shadow-2xl border-r border-white/10
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute top-60 right-8 w-24 h-24 bg-purple-500 rounded-full blur-2xl"></div>
            <div className="absolute bottom-40 left-6 w-28 h-28 bg-indigo-500 rounded-full blur-3xl"></div>
          </div>

          {/* Logo and brand */}
          <div className={`relative z-10 flex items-center justify-center h-20 px-4 bg-gradient-to-r ${theme.headerGradient} backdrop-blur-sm border-b border-white/10`}>
            <div className="flex items-center">
              <div className={`h-10 w-10 bg-gradient-to-r ${theme.primaryGradient} rounded-xl flex items-center justify-center shadow-lg border border-white/20`}>
                <span className="text-white font-bold text-sm">OMH</span>
              </div>
              <h1 className="ml-3 text-white text-xl font-bold bg-gradient-to-r from-blue-100 to-purple-100 bg-clip-text text-transparent">
                Optima managementHub
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto relative z-10 custom-scrollbar">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out
                    relative overflow-hidden
                    ${isActive
                      ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-lg shadow-blue-500/25 scale-105 border border-white/20`
                      : 'text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105 hover:shadow-lg hover:border-white/20 border border-transparent'
                    }
                  `}
                  title={item.description}
                >
                  {/* Active item background effect */}
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${theme.primaryGradient} opacity-20 animate-pulse`}></div>
                  )}
                  
                  <div className={`
                    relative z-10 w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-300
                    ${isActive 
                      ? 'bg-white/20 shadow-md border border-white/30' 
                      : `bg-gradient-to-r ${item.color} opacity-80 group-hover:opacity-100 group-hover:shadow-md group-hover:scale-110`
                    }
                  `}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  
                  <div className="flex-1 relative z-10">
                    <div className="font-semibold">{item.name}</div>
                    <div className={`
                      text-xs mt-0.5 transition-colors duration-300
                      ${isActive ? 'text-blue-100' : 'text-gray-400 group-hover:text-gray-200'}
                    `}>
                      {item.description}
                    </div>
                  </div>
                  
                  {isActive && (
                    <div className="relative z-10 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Enhanced stats footer */}
          <div className={`relative z-10 p-3 border-t border-white/10 bg-gradient-to-r ${theme.sidebarGradient} backdrop-blur-sm`}>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">System Status</span>
                <span className="text-green-400 flex items-center font-semibold">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></div>
                  Online
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">Version</span>
                <span className="text-blue-300 font-semibold bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                  v1.0.0
                </span>
              </div>

              <div className="pt-1 border-t border-white/10">
                <div className="flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #2563eb, #7c3aed);
        }
      `}</style>
    </>
  );
};

export default Sidebar;