import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={`h-screen flex overflow-hidden bg-gradient-to-br ${theme.surfaceGradient}`}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Navbar */}
        <Navbar onMenuToggle={toggleSidebar} />

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {/* Content wrapper */}
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-slate-900/80 backdrop-blur-md border-t border-white/5 mt-auto relative z-10">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-3 sm:space-x-6 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>© 2024 OptimaManagement</span>
                  <span className="text-slate-200">•</span>
                  <a href="/privacy" className="hover:text-indigo-400 transition-colors">
                    Privacy
                  </a>
                  <span className="text-slate-200">•</span>
                  <a href="/terms" className="hover:text-indigo-400 transition-colors">
                    Terms
                  </a>
                </div>

                <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Powered by</span>
                  <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    TechOptima
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;
