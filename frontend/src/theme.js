// Application Theme configuration
// This is the single source of truth for gradients, colors, and other theme-related tokens.
// The user can modify these values to change the application's appearance globally.

const theme = {
    id: 'midnight-royal',
    name: 'Midnight Royal',
    navbarGradient: 'from-[#0B1120] to-[#070B14]',
    headerGradient: 'from-[#0a0f1e] via-indigo-950/60 to-[#070B14]',
    sidebarGradient: 'from-[#0B1120] to-[#070B14]',
    surfaceGradient: 'from-[#0B1120] to-[#070B14]',
    primaryGradient: 'from-indigo-600 to-violet-700',
    avatarGradient: 'from-indigo-500 to-indigo-600',
    accentColor: '#6366F1',
    secondaryColor: '#4F46E5',
    sidebarText: '#94A3B8',
    sidebarActive: '#FFFFFF',
    // Card / panel styles used across all themed modules
    cardBg: 'bg-slate-900/60',
    cardBorder: 'border-white/10',
};

export default theme;
