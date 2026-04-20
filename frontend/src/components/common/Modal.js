import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  const { theme } = useTheme();
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl',
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className={`inline-block align-bottom ${theme.modalBg} backdrop-blur-xl border ${theme.cardBorder} rounded-[2rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full`}>
          <div className="px-4 pt-5 pb-4 sm:p-8">
            <div className="flex items-start justify-between border-b border-white/10 dark:border-white/10 pb-4 mb-6">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
              <button
                onClick={onClose}
                className={`ml-3 flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-2xl ${theme.muted.bg} hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none transition-all hover:rotate-90`}
              >
                <XMarkIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="mt-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
