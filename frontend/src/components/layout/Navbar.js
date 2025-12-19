import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, themes, themeId, setThemeId } = useTheme();

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'ADMIN': { color: 'from-red-500 to-pink-600', icon: '👑', label: 'Administrator' },
      'HR_MANAGER': { color: 'from-blue-500 to-indigo-600', icon: '🏢', label: 'HR Manager' },
      'EMPLOYEE': { color: 'from-green-500 to-emerald-600', icon: '👤', label: 'Employee' }
    };

    const config = roleConfig[role] || roleConfig['EMPLOYEE'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${config.color} shadow-lg`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  return (
    <nav className={`bg-gradient-to-r ${theme.navbarGradient} shadow-xl border-b border-white/20 sticky top-0 z-40 backdrop-blur-sm`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-md text-white/80 hover:text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 lg:hidden transition-all duration-300"
              aria-label="Open sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          {/* Center - Search (hidden on mobile) */}
          <div className="hidden md:flex flex-1 justify-center px-6 py-2">
            <div className="w-full max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search employees, requests..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-white/30 rounded-xl leading-5 bg-white/20 backdrop-blur-sm placeholder-white/70 text-white focus:outline-none focus:placeholder-white/50 focus:ring-2 focus:ring-white/40 focus:border-white/50 transition-all duration-300"
                />
              </div>
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
                className="flex items-center space-x-3 p-2.5 rounded-xl text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 backdrop-blur-sm border border-white/20"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 bg-gradient-to-r from-white/30 to-white/20 rounded-full flex items-center justify-center shadow-lg border border-white/30">
                    <span className="text-white font-bold text-sm">
                      {getInitials(user?.first_name, user?.last_name)}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold text-white">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="text-xs text-white/70">
                      {user?.profile?.role?.replace('_', ' ')}
                    </div>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-white/70" />
                </div>
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl py-2 z-50 border border-white/30">
                  <div className="px-4 py-4 border-b border-gray-200/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`h-12 w-12 bg-gradient-to-r ${theme.avatarGradient} rounded-full flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-lg">
                          {getInitials(user?.first_name, user?.last_name)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      {getRoleBadge(user?.profile?.role)}
                    </div>
                  </div>
                  <div className="px-4 py-3 border-b border-gray-200/50">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Theme</div>
                    <div className="grid grid-cols-6 gap-2">
                      {Object.values(themes).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setThemeId(opt.id)}
                          className={`h-6 w-6 rounded-full border-2 bg-gradient-to-r ${opt.navbarGradient} ${themeId === opt.id ? 'border-gray-900' : 'border-white/70'}`}
                          aria-label={opt.name}
                          title={opt.name}
                        />
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <UserCircleIcon className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Your Profile</span>
                    </div>
                  </Link>

                  <Link
                    to="/settings"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">Settings</span>
                    </div>
                  </Link>

                  <Link
                    to="/help"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Help & Support</span>
                    </div>
                  </Link>

                  <div className="border-t border-gray-200/50 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Sign out</span>
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
      <div className="md:hidden px-4 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="block w-full pl-10 pr-3 py-2.5 border border-white/30 rounded-xl leading-5 bg-white/20 backdrop-blur-sm placeholder-white/70 text-white focus:outline-none focus:placeholder-white/50 focus:ring-2 focus:ring-white/40 focus:border-white/50 transition-all duration-300"
          />
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