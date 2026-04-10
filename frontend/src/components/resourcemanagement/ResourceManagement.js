// import React, { useState } from 'react';
// import { Routes, Route, Link, useLocation } from 'react-router-dom';
// import {
//   PlusIcon,
//   ServerIcon,
//   KeyIcon,
//   ClipboardDocumentListIcon,
//   ChartBarIcon,
//   Cog6ToothIcon
// } from '@heroicons/react/24/outline';

// // Import resource management components (we'll create these next)
// // import ResourceRequestForm from './ResourceRequestForm';
// import ResourceRequestForm from './ResourceRequestForm';
// import ResourceList from './ResourceList';
// import AccessRequestList from './AccessRequestList';
// import ResourceDashboard from './ResourceDashboard';
// import AdminForms from './AdminForms';

// const ResourceManagement = () => {
//   const location = useLocation();

//   const tabs = [
//     {
//       name: 'Dashboard',
//       href: '/resource-management',
//       icon: ChartBarIcon,
//       component: ResourceDashboard
//     },
//     {
//       name: 'Admin Forms',
//       href: '/resource-management/admin',
//       icon: Cog6ToothIcon,
//       component: AdminForms
//     },
//     {
//       name: 'New Request',
//       href: '/resource-management/request',
//       icon: PlusIcon,
//       component: ResourceRequestForm
//     },
//     {
//       name: 'My Requests',
//       href: '/resource-management/requests',
//       icon: ClipboardDocumentListIcon,
//       component: AccessRequestList
//     },
//     {
//       name: 'Resources',
//       href: '/resource-management/resources',
//       icon: ServerIcon,
//       component: ResourceList
//     }
//   ];

//   const currentTab = tabs.find(tab => 
//     location.pathname === tab.href || 
//     (tab.href === '/resource-management' && location.pathname === '/resource-management')
//   ) || tabs[0];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

//         {/* Header */}
//         <div className="mb-8">
//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                   Resource Management
//                 </h1>
//                 <p className="text-gray-600 mt-2">
//                   Manage access requests, resources, and permissions
//                 </p>
//               </div>
//               <div className="flex items-center space-x-3">
//                 <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
//                   <KeyIcon className="h-6 w-6 text-white" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Navigation Tabs */}
//         <div className="mb-8">
//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-2">
//             <nav className="flex space-x-2">
//               {tabs.map((tab) => {
//                 const Icon = tab.icon;
//                 const isActive = currentTab.name === tab.name;

//                 return (
//                   <Link
//                     key={tab.name}
//                     to={tab.href}
//                     className={`
//                       flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
//                       ${isActive
//                         ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
//                         : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-105'
//                       }
//                     `}
//                   >
//                     <Icon className={`h-5 w-5 mr-2 ${isActive ? 'text-white' : 'text-gray-400'}`} />
//                     {tab.name}
//                   </Link>
//                 );
//               })}
//             </nav>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 min-h-[600px]">
//           <Routes>
//             <Route path="/" element={<ResourceDashboard />} />
//             <Route path="/request" element={<ResourceRequestForm />} />
//             <Route path="/requests" element={<AccessRequestList />} />
//             <Route path="/resources" element={<ResourceList />} />
//             <Route path="/admin" element={<AdminForms />} />
//           </Routes>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ResourceManagement;


// import React, { useState } from 'react';
// import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
// import {
//   PlusIcon,
//   ServerIcon,
//   KeyIcon,
//   ClipboardDocumentListIcon,
//   ChartBarIcon,
//   Cog6ToothIcon
// } from '@heroicons/react/24/outline';
// import { getCurrentUser } from '../../utils/auth';

// // Import resource management components
// import ResourceRequestForm from './ResourceRequestForm';
// import ResourceList from './ResourceList';
// import AccessRequestList from './AccessRequestList';
// import ResourceDashboard from './ResourceDashboard';
// import AdminForms from './AdminForms';

// const ResourceManagement = () => {
//   const location = useLocation();
//   const user = getCurrentUser();

//   // Check if user has admin access
//   const hasAdminAccess = () => {
//     if (!user) return false;
//     const userRole = user.role?.toLowerCase();
//     return userRole === 'admin' || userRole === 'hr_manager' || userRole === 'hr_admin';
//   };

//   // Base tabs available to all users
//   const baseTabs = [
//     {
//       name: 'Dashboard',
//       href: '/resource-management',
//       icon: ChartBarIcon,
//       component: ResourceDashboard
//     },
//     {
//       name: 'New Request',
//       href: '/resource-management/request',
//       icon: PlusIcon,
//       component: ResourceRequestForm
//     },
//     {
//       name: 'My Requests',
//       href: '/resource-management/requests',
//       icon: ClipboardDocumentListIcon,
//       component: AccessRequestList
//     },
//     {
//       name: 'Resources',
//       href: '/resource-management/resources',
//       icon: ServerIcon,
//       component: ResourceList
//     }
//   ];

//   // Admin tab (only for admin/hr_manager)
//   const adminTab = {
//     name: 'Admin Forms',
//     href: '/resource-management/admin',
//     icon: Cog6ToothIcon,
//     component: AdminForms
//   };

//   // Conditionally include admin tab - completely hide from non-admin users
//   const tabs = hasAdminAccess() 
//     ? [baseTabs[0], adminTab, ...baseTabs.slice(1)] // Insert admin tab after dashboard
//     : baseTabs;

//   const currentTab = tabs.find(tab => 
//     location.pathname === tab.href || 
//     (tab.href === '/resource-management' && location.pathname === '/resource-management')
//   ) || tabs[0];

//   // Protected Route Component for Admin Forms
//   const ProtectedAdminRoute = ({ children }) => {
//     if (!hasAdminAccess()) {
//       return <Navigate to="/resource-management" replace />;
//     }
//     return children;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

//         {/* Header */}
//         <div className="mb-8">
//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                   Resource Management
//                 </h1>
//                 <p className="text-gray-600 mt-2">
//                   Manage access requests, resources, and permissions
//                 </p>
//                 {hasAdminAccess() && (
//                   <div className="mt-2">
//                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
//                       <Cog6ToothIcon className="h-3 w-3 mr-1" />
//                       Administrator
//                     </span>
//                   </div>
//                 )}
//               </div>
//               <div className="flex items-center space-x-3">
//                 <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
//                   <KeyIcon className="h-6 w-6 text-white" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Navigation Tabs */}
//         <div className="mb-8">
//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-2">
//             <nav className="flex space-x-2">
//               {tabs.map((tab) => {
//                 const Icon = tab.icon;
//                 const isActive = currentTab.name === tab.name;
//                 const isAdminTab = tab.name === 'Admin Forms';

//                 return (
//                   <Link
//                     key={tab.name}
//                     to={tab.href}
//                     className={`
//                       flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
//                       ${isActive
//                         ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
//                         : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-105'
//                       }
//                     `}
//                   >
//                     <Icon className={`h-5 w-5 mr-2 ${isActive ? 'text-white' : 'text-gray-400'}`} />
//                     {tab.name}
//                     {isAdminTab && (
//                       <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
//                         Admin
//                       </span>
//                     )}
//                   </Link>
//                 );
//               })}
//             </nav>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 min-h-[600px]">
//           <Routes>
//             <Route path="/" element={<ResourceDashboard />} />
//             <Route path="/request" element={<ResourceRequestForm />} />
//             <Route path="/requests" element={<AccessRequestList />} />
//             <Route path="/resources" element={<ResourceList />} />
//             <Route 
//               path="/admin" 
//               element={
//                 <ProtectedAdminRoute>
//                   <AdminForms />
//                 </ProtectedAdminRoute>
//               } 
//             />
//           </Routes>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ResourceManagement;




import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  PlusIcon,
  ServerIcon,
  KeyIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { getCurrentUser, hasAdminPrivileges } from '../../utils/auth';
import { authAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

// Import resource management components
import ResourceRequestForm from './ResourceRequestForm';
import ResourceList from './ResourceList';
import AccessRequestList from './AccessRequestList';
import ResourceDashboard from './ResourceDashboard';
import AdminForms from './AdminForms';

const ResourceManagement = () => {
  const location = useLocation();
  const user = getCurrentUser();
  const { theme } = useTheme();
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
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

  // Check if user has admin access (Admin, HR Manager, or IT Supporter)
  const hasAdminAccess = () => {
    if (!user) return false;
    const userRole = user.role?.toLowerCase() || user.profile?.role?.toLowerCase();
    const byRole = userRole === 'admin' ||
      userRole === 'hr_manager' ||
      userRole === 'hr_admin' ||
      userRole === 'it_supporter';
    const byPerm = (
      hasPerm('resource_management.add_resource') ||
      hasPerm('resource_management.change_resource') ||
      hasPerm('resource_management.delete_resource') ||
      hasPerm('resource_management.view_resourcetype') ||
      hasPerm('resource_management.add_resourcetype') ||
      hasPerm('resource_management.change_resourcetype') ||
      hasPerm('resource_management.delete_resourcetype') ||
      hasPerm('resource_management.change_accessrequest')
    );
    return byRole || byPerm;
  };

  // Alternative using the utility function
  const hasResourceAdminAccess = () => {
    return hasAdminPrivileges();
  };

  // Base tabs available to all users
  const baseTabs = [
    {
      name: 'Dashboard',
      href: '/resource-management',
      icon: ChartBarIcon,
      component: ResourceDashboard,
      description: 'Overview and statistics'
    },
    {
      name: 'New Request',
      href: '/resource-management/request',
      icon: PlusIcon,
      component: ResourceRequestForm,
      description: 'Submit new access request'
    },
    {
      name: 'My Requests',
      href: '/resource-management/requests',
      icon: ClipboardDocumentListIcon,
      component: AccessRequestList,
      description: 'Track your requests'
    },
    {
      name: 'Resources',
      href: '/resource-management/resources',
      icon: ServerIcon,
      component: ResourceList,
      description: 'Browse available resources'
    }
  ];

  // Admin tab (only for admin/hr_manager/it_supporter)
  const adminTab = {
    name: 'Admin Forms',
    href: '/resource-management/admin',
    icon: Cog6ToothIcon,
    component: AdminForms,
    description: 'Manage system resources',
    restricted: true
  };

  // Conditionally include admin tab - completely hide from non-admin users
  // Only include Resources tab when user can view resources by perm or role
  const canViewResources = hasPerm('resource_management.view_resource') || hasAdminAccess();
  const effectiveBaseTabs = canViewResources
    ? baseTabs
    : baseTabs.filter(t => t.name !== 'Resources');

  const tabs = hasAdminAccess()
    ? [effectiveBaseTabs[0], adminTab, ...effectiveBaseTabs.slice(1)] // Insert admin tab after dashboard
    : effectiveBaseTabs;

  const currentTab = tabs.find(tab =>
    location.pathname === tab.href ||
    (tab.href === '/resource-management' && location.pathname === '/resource-management')
  ) || tabs[0];

  // Protected Route Component for Admin Forms
  const ProtectedAdminRoute = ({ children }) => {
    if (!hasAdminAccess()) {
      return <Navigate to="/resource-management" replace />;
    }
    return children;
  };

  // Get user role display name
  const getUserRoleDisplay = () => {
    const userRole = user?.role || user?.profile?.role;
    switch (userRole) {
      case 'IT_SUPPORTER':
        return 'IT Supporter';
      case 'HR_MANAGER':
        return 'HR Manager';
      case 'ADMIN':
        return 'Administrator';
      default:
        return userRole?.replace('_', ' ') || 'User';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className={`${theme.cardBg} backdrop-blur-xl rounded-2xl shadow-2xl border ${theme.cardBorder} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-3xl font-bold bg-gradient-to-r ${theme.primaryGradient} bg-clip-text text-transparent`}>
                  Support 24/7
                </h1>
                <p className="text-gray-400 mt-2">
                  Manage access requests, resources, and permissions
                </p>
                {hasAdminAccess() && (
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      <Cog6ToothIcon className="h-3 w-3 mr-1" />
                      {getUserRoleDisplay()}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      ⚡ Admin Access
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className={`h-12 w-12 bg-gradient-to-r ${theme.primaryGradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  <KeyIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className={`${theme.cardBg} backdrop-blur-xl rounded-2xl shadow-2xl border ${theme.cardBorder} p-2`}>
            <nav className="flex space-x-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab.name === tab.name;
                const isAdminTab = tab.name === 'Admin Forms';

                return (
                  <Link
                    key={tab.name}
                    to={tab.href}
                    className={`
                      flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap
                      ${isActive
                        ? `bg-gradient-to-r ${theme.primaryGradient} text-white shadow-lg transform scale-105`
                        : 'text-gray-400 hover:text-white hover:bg-white/5 hover:scale-105'
                      }
                    `}
                    title={tab.description}
                  >
                    <Icon className={`h-5 w-5 mr-2 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{tab.name}</span>
                    {isAdminTab && (
                      <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium
                        ${isActive
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-purple-100 text-purple-700 border border-purple-200'
                        }`}>
                        Admin
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className={`${theme.cardBg} backdrop-blur-xl rounded-2xl shadow-2xl border ${theme.cardBorder} min-h-[600px]`}>
          <Routes>
            <Route path="/" element={<ResourceDashboard />} />
            <Route path="/request" element={<ResourceRequestForm />} />
            <Route path="/requests" element={<AccessRequestList />} />
            <Route path="/resources" element={<ResourceList />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminForms />
                </ProtectedAdminRoute>
              }
            />
          </Routes>
        </div>

        {/* Footer Info */}
        {hasAdminAccess() && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full shadow-lg border border-white/10">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-gray-400">
                Administrative privileges active for {getUserRoleDisplay()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceManagement;