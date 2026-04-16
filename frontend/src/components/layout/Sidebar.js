import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  ClockIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ComputerDesktopIcon,
  UserPlusIcon,
  UserMinusIcon,
  WrenchScrewdriverIcon,
  LinkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LifebuoyIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { getUserRole } from '../../utils/auth';
import { authAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import {
  canManageUsers,
  getPermissionLevel,
  ROLE_CATEGORIES,
} from '../../utils/roleConfig';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const userRole = getUserRole();
  const [permissions, setPermissions] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});

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

  const allowedByPerms = (href) => {
    if (href === '/onboarding/assets') {
      const assetPerms = ['assets.view_asset', 'assets.view_assetassignment', 'assets.add_asset'];
      return assetPerms.some(hasPerm);
    }
    if (href === '/attendance') return hasPerm('attendance.view_attendancerecord');
    if (href === '/leave') return hasPerm('leave_management.view_leaverequest');
    return false;
  };

  const { theme } = useTheme();

  const getManagementRoles = () => [
    ...ROLE_CATEGORIES.C_LEVEL,
    ...ROLE_CATEGORIES.VP_LEVEL,
    ...ROLE_CATEGORIES.DIRECTOR_LEVEL,
    ...ROLE_CATEGORIES.MANAGEMENT,
  ];

  const getHRRoles = () => [
    ...ROLE_CATEGORIES.HR_STAFF,
    ...ROLE_CATEGORIES.C_LEVEL,
    'ADMIN',
  ];

  const getITRoles = () => [
    ...ROLE_CATEGORIES.IT_SUPPORT,
    ...ROLE_CATEGORIES.ADMIN_STAFF,
    'CTO',
    'CIO',
  ];

  const getHolidayRoles = () => [
    ...ROLE_CATEGORIES.HR_STAFF,
    ...ROLE_CATEGORIES.MANAGEMENT,
    ...ROLE_CATEGORIES.C_LEVEL,
    'ADMIN',
  ];

  const getAllRoles = () => {
    const roles = [];
    Object.values(ROLE_CATEGORIES).forEach(r => roles.push(...r));
    return roles;
  };

  const menuStructure = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      roles: getAllRoles(),
      description: 'Overview and stats',
      color: 'from-orange-500 to-red-600'
    },
    {
      name: 'Workforce',
      icon: UsersIcon,
      color: 'from-emerald-500 to-teal-600',
      children: [
        {
          name: 'Users & Authentication',
          href: '/users-auth',
          roles: ['ADMIN', 'CEO', 'CIO'],
          description: 'Manage identities'
        },
        {
          name: 'Employees',
          href: '/employees',
          roles: [...getHRRoles(), ...getManagementRoles()],
          description: 'Employee directory'
        },
        {
          name: 'My Team',
          href: '/my-team',
          roles: getAllRoles(),
          description: 'Team hierarchy'
        },
        {
          name: 'My Profile',
          href: '/profile',
          roles: getAllRoles(),
          description: 'View your details'
        }
      ]
    },
    {
      name: 'Attendance & Leave',
      icon: ClockIcon,
      color: 'from-blue-600 to-purple-600',
      children: [
        {
          name: 'Attendance',
          href: '/attendance',
          roles: getAllRoles(),
          description: 'Time tracking'
        },
        {
          name: 'Leave Management',
          href: '/leave',
          roles: getAllRoles(),
          description: 'Time off'
        },
        {
          name: 'Holidays',
          href: '/holidays',
          roles: getHolidayRoles(),
          description: 'Company calendar'
        },
        {
          name: 'Work From Home',
          href: '/work-from-home',
          roles: getAllRoles(),
          description: 'Remote management'
        }
      ]
    },
    {
      name: 'Employee Lifecycle',
      icon: ArrowPathIcon,
      color: 'from-cyan-500 to-blue-600',
      children: [
        {
          name: 'Employee Onboarding',
          href: '/onboarding/employees',
          roles: getHRRoles(),
          description: 'New hires'
        },
        {
          name: 'Onboarding Links',
          href: '/onboarding/link-generator',
          roles: getHRRoles(),
          description: 'Secure invites'
        },
        {
          name: 'Employee Offboarding',
          href: '/onboarding/offboarding',
          roles: getHRRoles(),
          description: 'Exits'
        }
      ]
    },
    {
      name: 'Assets & Devices',
      icon: ComputerDesktopIcon,
      color: 'from-indigo-500 to-blue-600',
      children: [
        {
          name: 'Asset Management',
          href: '/onboarding/assets',
          roles: [...getITRoles(), ...getHRRoles()],
          description: 'Inventory'
        },
        {
          name: 'My Assets',
          href: '/my-assets',
          roles: getAllRoles(),
          description: 'Personal inventory'
        },
        {
          name: 'Biometric Devices',
          href: '/attendance/biometric',
          roles: [...getITRoles(), ...getHRRoles()],
          description: 'Device sync'
        }
      ]
    },
    {
      name: 'Help & Support',
      icon: LifebuoyIcon,
      color: 'from-slate-500 to-slate-700',
      children: [
        {
          name: 'Documents',
          href: '/documents',
          roles: getAllRoles(),
          description: 'Company resources'
        },
        {
          name: 'Support 24/7',
          href: '/resource-management',
          roles: getAllRoles(),
          description: 'Get help'
        }
      ]
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      roles: [...getManagementRoles(), ...getITRoles(), ...getHRRoles()],
      description: 'Configuration',
      color: 'from-slate-600 to-gray-700'
    }
  ];

  const canAccess = (item) => {
    if (item.href) {
      if (item.href === '/users-auth') return canManageUsers(userRole);
      return item.roles.includes(userRole) || allowedByPerms(item.href);
    }
    if (item.children) {
      return item.children.some(child => canAccess(child));
    }
    return false;
  };

  const isActive = (href) => {
    if (!href) return false;
    return location.pathname === href || (href !== '/' && location.pathname.startsWith(href + '/'));
  };

  useEffect(() => {
    const initialExpanded = {};
    menuStructure.forEach(section => {
      if (section.children?.some(child => isActive(child.href))) {
        initialExpanded[section.name] = true;
      }
    });
    setExpandedSections(initialExpanded);
  }, [location.pathname]);

  const toggleSection = (name) => {
    setExpandedSections(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-all duration-300" onClick={onClose} />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b ${theme.sidebarGradient}
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        shadow-2xl border-r border-black/10 dark:border-white/10 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="relative z-10 flex items-center justify-start h-20 px-6 bg-slate-900/50 backdrop-blur-md border-b border-white/5">
          <Link to="/dashboard" onClick={onClose} className="flex items-center space-x-3 hover:opacity-90">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 border border-indigo-400/30">
              <span className="text-white font-bold text-sm">OMH</span>
            </div>
            <div>
              <h1 className="text-white text-lg font-black leading-tight">Optima</h1>
              <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest leading-none">ManagementHub</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto relative z-10 custom-scrollbar">
          {menuStructure.map((section) => {
            if (!canAccess(section)) return null;

            if (!section.children) {
              const active = isActive(section.href);
              return (
                <Link
                  key={section.name}
                  to={section.href}
                  onClick={onClose}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all relative overflow-hidden ${active ? 'bg-indigo-500/10 text-white border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-gradient-to-r ${section.color} opacity-80 group-hover:opacity-100`}>
                    <section.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{section.name}</div>
                  </div>
                </Link>
              );
            }

            const isExpanded = expandedSections[section.name];
            const hasActiveChild = section.children.some(child => isActive(child.href));

            return (
              <div key={section.name} className="space-y-1">
                <button
                  onClick={() => toggleSection(section.name)}
                  className={`w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${hasActiveChild ? 'text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-gradient-to-r ${section.color} opacity-80 group-hover:opacity-100`}>
                    <section.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 text-left font-semibold text-sm">{section.name}</div>
                  {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                </button>

                {isExpanded && (
                  <div className="pl-12 space-y-1 animate-fadeIn">
                    {section.children.map(child => {
                      if (!canAccess(child)) return null;
                      const childActive = isActive(child.href);
                      return (
                        <Link
                          key={child.name}
                          to={child.href}
                          onClick={onClose}
                          className={`block py-2 text-xs font-bold transition-all uppercase tracking-widest ${childActive ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="relative z-10 p-4 border-t border-white/5 bg-slate-900/50 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-black text-slate-500">
              <span>Status</span>
              <span className="text-emerald-400 flex items-center">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></div>
                Live
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-black text-slate-500">
              <span>Version</span>
              <span className="text-indigo-300">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>
    </>
  );
};

export default Sidebar;
