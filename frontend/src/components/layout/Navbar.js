import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationCenter from '../notifications/NotificationCenter';
import { employeeAPI } from '../../services/api';
import {
  UserIcon,
  CalendarIcon,
  UsersIcon,
  BriefcaseIcon,
  ComputerDesktopIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  getRoleDisplayName,
  getRoleIcon,
  getRoleBadgeColor
} from '../../utils/roleConfig';

const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, themes, themeId, setThemeId } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ employees: [], links: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  const quickLinks = [
    { name: 'Attendance', path: '/attendance', icon: CalendarIcon, keywords: ['clock', 'time', 'attendance'] },
    { name: 'My Team', path: '/my-team', icon: UsersIcon, keywords: ['team', 'reports', 'directory', 'colleagues'] },
    { name: 'Leave', path: '/leave', icon: BriefcaseIcon, keywords: ['vacation', 'off', 'leave', 'holiday'] },
    { name: 'Work From Home', path: '/work-from-home', icon: ComputerDesktopIcon, keywords: ['wfh', 'home', 'remote'] },
    { name: 'My Profile', path: '/profile', icon: UserIcon, keywords: ['me', 'profile', 'personal'] },
    { name: 'My Assets', path: '/my-assets', icon: ComputerDesktopIcon, keywords: ['laptop', 'assets', 'it'] },
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon, keywords: ['settings', 'config', 'password'] },
  ];

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery.trim()) {
        setSearchResults({ employees: [], links: [] });
        return;
      }

      setIsSearching(true);
      try {
        // Filter quick links
        const query = searchQuery.toLowerCase();
        const matchedLinks = quickLinks.filter(link =>
          link.name.toLowerCase().includes(query) ||
          link.keywords.some(k => k.includes(query))
        );

        // Fetch employees
        const response = await employeeAPI.getEmployees({ search: searchQuery });
        const employees = response.data.results || response.data || [];

        setSearchResults({
          links: matchedLinks,
          employees: employees.slice(0, 5) // Limit to top 5
        });
        setShowDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      if (q.includes('attendance')) navigate('/attendance');
      else if (q.includes('team')) navigate('/my-team');
      else if (q.includes('leave')) navigate('/leave');
      else if (q.includes('profile')) navigate('/profile');
      else if (q.includes('asset')) navigate('/my-assets');
      else if (q.includes('wfh') || q.includes('home')) navigate('/work-from-home');
      else if (q.includes('setting')) navigate('/settings');
      setShowDropdown(false);
      setSearchQuery('');
    }
  };

  const handleResultClick = (path) => {
    navigate(path);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleBadge = (role) => {
    if (!role) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-gray-400 to-gray-500 shadow">
          —
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white shadow
        ${getRoleBadgeColor(role)}`}
      >
        <span className="mr-1">{getRoleIcon(role)}</span>
        {getRoleDisplayName(role)}
      </span>
    );
  };

  return (
    <nav className={`bg-[#0B1120]/80 shadow-2xl border-b border-white/5 sticky top-0 z-40 backdrop-blur-md`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden transition-all duration-300"
              aria-label="Open sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          <div className="hidden md:flex flex-1 justify-center px-6 py-2" ref={searchRef}>
            <div className="w-full max-w-lg relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {isSearching ? (
                    <div className="h-4 w-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                  ) : (
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Search employees, policies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                  onKeyDown={handleSearch}
                  className="block w-full pl-11 pr-4 py-2 border border-white/10 rounded-lg leading-5 bg-white/5 placeholder-slate-500 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-all duration-300"
                />
              </div>

              {/* Dropdown Results */}
              {showDropdown && (searchQuery.trim()) && (
                <div className="absolute mt-2 w-full bg-[#0B1120]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="max-h-[min(80vh,500px)] overflow-y-auto custom-scrollbar px-3 py-3">
                    {/* Quick Links Section */}
                    {searchResults.links.length > 0 && (
                      <div className="mb-4">
                        <h3 className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quick Jump</h3>
                        {searchResults.links.map((link) => (
                          <button
                            key={link.path}
                            onClick={() => handleResultClick(link.path)}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-all group"
                          >
                            <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                              <link.icon className="h-4 w-4 text-indigo-500" />
                            </div>
                            <span className="text-sm font-medium">{link.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Employees Section */}
                    {searchResults.employees.length > 0 && (
                      <div>
                        <h3 className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Employees</h3>
                        {searchResults.employees.map((emp) => (
                          <button
                            key={emp.id}
                            onClick={() => handleResultClick(`/employees/${emp.id}`)}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-all group"
                          >
                            <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md border border-white/20">
                              {getInitials(emp.user_info?.first_name, emp.user_info?.last_name)}
                            </div>
                            <div className="text-left overflow-hidden">
                              <p className="text-sm font-semibold truncate">
                                {emp.user_info?.full_name || `${emp.user_info?.first_name} ${emp.user_info?.last_name}`}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">{emp.position || emp.department?.name || 'Employee'}</p>
                            </div>
                            <div className="ml-auto text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                              {emp.employee_id}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.links.length === 0 && searchResults.employees.length === 0 && !isSearching && (
                      <div className="py-8 text-center">
                        <p className="text-sm text-gray-500">No results found for "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationCenter />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-1.5 rounded-lg text-slate-300 hover:bg-white/5 focus:outline-none transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-semibold text-white">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="text-xs text-slate-400 text-right">
                      {user?.profile?.role?.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="h-9 w-9 bg-slate-800 rounded-full flex items-center justify-center overflow-hidden border border-white/10 shadow-lg">
                    <span className="text-gray-600 font-bold text-sm">
                      {getInitials(user?.first_name, user?.last_name)}
                    </span>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </div>
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-50 border border-white/10 overflow-hidden">
                  <div className="px-4 py-4 border-b border-white/5 bg-slate-800/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`h-12 w-12 bg-gradient-to-r ${theme.avatarGradient} rounded-full flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-lg">
                          {getInitials(user?.first_name, user?.last_name)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-sm text-slate-400">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      {getRoleBadge(user?.profile?.role)}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="block px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-all duration-300"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <UserCircleIcon className="h-5 w-5 text-indigo-500" />
                      <span className="font-medium">Your Profile</span>
                    </div>
                  </Link>

                  <Link
                    to="/settings"
                    className="block px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-all duration-300"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">Settings</span>
                    </div>
                  </Link>

                  <Link
                    to="/resource-management"
                    className="block px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all duration-300"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Help & Support</span>
                    </div>
                  </Link>

                  <div className="border-t border-white/5 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-sm text-indigo-400 hover:bg-white/5 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium text-indigo-300">Sign out</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-4 overflow-visible">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowDropdown(true)}
            onKeyDown={handleSearch}
            className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-white/5 placeholder-slate-500 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
          />

          {/* Mobile Search Dropdown */}
          {showDropdown && (searchQuery.trim()) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              <div className="max-h-64 overflow-y-auto p-2">
                {searchResults.links.map(link => (
                  <button key={link.path} onClick={() => handleResultClick(link.path)} className="w-full flex items-center space-x-3 p-3 hover:bg-white/5 rounded-lg text-slate-300 transition-colors">
                    <link.icon className="h-5 w-5 text-indigo-400" />
                    <span className="text-sm font-medium">{link.name}</span>
                  </button>
                ))}
                {searchResults.employees.map(emp => (
                  <button key={emp.id} onClick={() => handleResultClick(`/employees/${emp.id}`)} className="w-full flex items-center space-x-3 p-3 hover:bg-white/5 rounded-lg text-slate-300 transition-colors">
                    <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white/20">
                      {getInitials(emp.user_info?.first_name, emp.user_info?.last_name)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold">{emp.user_info?.full_name || `${emp.user_info?.first_name} ${emp.user_info?.last_name}`}</p>
                      <p className="text-[10px] text-gray-500">{emp.position}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside handlers */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;