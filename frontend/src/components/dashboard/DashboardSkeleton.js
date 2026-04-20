import React from 'react';
import { useTheme } from '../../context/ThemeContext';

// Reusable shimmer pulse block
const Shimmer = ({ className = '', isDark }) => (
  <div className={`animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200/60'} rounded-xl ${className}`} />
);

// A card-shaped skeleton wrapper
const SkeletonCard = ({ children, className = '', isDark }) => (
  <div className={`${isDark ? 'bg-white/5 backdrop-blur-sm border-white/10' : 'bg-white border-slate-200'} border rounded-2xl p-5 ${className}`}>
    {children}
  </div>
);

const DashboardSkeleton = () => {
  const { theme, isDark } = useTheme();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient} animate-in fade-in duration-300`}>
      {/* Header skeleton */}
      <div className={`bg-gradient-to-r ${theme.headerGradient} border-b ${theme.muted.border} px-4 sm:px-8 py-6 sm:py-10 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] -mr-48 -mt-48" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-3">
            <Shimmer isDark={isDark} className="h-4 w-20 sm:w-24 rounded-full" />
            <Shimmer isDark={isDark} className="h-8 sm:h-10 w-48 sm:w-64" />
            <Shimmer isDark={isDark} className="h-3 sm:h-4 w-32 sm:w-48" />
          </div>
          <div className="sm:text-right space-y-2">
            <Shimmer isDark={isDark} className="h-7 sm:h-9 w-28 sm:w-36 sm:ml-auto" />
            <Shimmer isDark={isDark} className="h-3 sm:h-4 w-20 sm:w-24 sm:ml-auto" />
          </div>
        </div>
      </div>
 
      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">

        {/* Stats row – 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} isDark={isDark}>
              <div className="flex items-center justify-between mb-4">
                <Shimmer isDark={isDark} className="h-4 w-24" />
                <Shimmer isDark={isDark} className="h-9 w-9 rounded-xl" />
              </div>
              <Shimmer isDark={isDark} className="h-8 w-20 mb-1" />
              <Shimmer isDark={isDark} className="h-3 w-32" />
            </SkeletonCard>
          ))}
        </div>

        {/* Check-in / Attendance card */}
        <SkeletonCard className="p-6" isDark={isDark}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <Shimmer isDark={isDark} className="h-5 w-40" />
              <Shimmer isDark={isDark} className="h-12 w-56" />
              <Shimmer isDark={isDark} className="h-4 w-48" />
            </div>
            <div className="flex gap-3">
              <Shimmer isDark={isDark} className="h-12 w-36 rounded-xl" />
              <Shimmer isDark={isDark} className="h-12 w-36 rounded-xl" />
            </div>
          </div>
        </SkeletonCard>

        {/* Middle row – 2 wide cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <SkeletonCard key={i} className="p-5" isDark={isDark}>
              <div className="flex items-center justify-between mb-4">
                <Shimmer isDark={isDark} className="h-4 w-32" />
                <Shimmer isDark={isDark} className="h-4 w-16 rounded-full" />
              </div>
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Shimmer isDark={isDark} className="h-9 w-9 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Shimmer isDark={isDark} className="h-3 w-full" />
                      <Shimmer isDark={isDark} className="h-3 w-2/3" />
                    </div>
                    <Shimmer isDark={isDark} className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </SkeletonCard>
          ))}
        </div>

        {/* Bottom row – 3 cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} isDark={isDark}>
              <Shimmer isDark={isDark} className="h-4 w-32 mb-4" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <Shimmer key={j} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </SkeletonCard>
          ))}
        </div>

      </div>

      {/* Subtle loading indicator at bottom */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-slate-800/80' : 'bg-white/80 shadow-indigo-100'} backdrop-blur-md rounded-full border ${theme.muted.border} shadow-xl z-50`}>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 ${isDark ? 'bg-indigo-400' : 'bg-indigo-600'} rounded-full animate-bounce`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} font-medium tracking-wide`}>Loading dashboard</span>
      </div>
    </div>
  );
};

export default DashboardSkeleton;

