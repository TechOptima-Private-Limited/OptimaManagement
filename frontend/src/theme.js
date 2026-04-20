// Application Theme configuration
// This is the single source of truth for gradients, colors, and other theme-related tokens.
// Add new themes here following the same token structure.

const themes = {
  // ─── DARK THEME ────────────────────────────────────────────────────────────
  'midnight-royal': {
    id: 'midnight-royal',
    name: 'Midnight Royal',
    isDark: true,

    // Gradients
    navbarGradient: 'from-[#0B1120] to-[#070B14]',
    headerGradient: 'from-[#0a0f1e] via-indigo-950/60 to-[#070B14]',
    sidebarGradient: 'from-[#0B1120] to-[#070B14]',
    surfaceGradient: 'from-[#0B1120] to-[#070B14]',
    primaryGradient: 'from-indigo-600 to-violet-700',
    secondaryGradient: 'from-violet-600 to-indigo-700',
    avatarGradient: 'from-indigo-500 to-indigo-600',
    birthdayGradient: 'from-indigo-500 via-purple-600 to-indigo-900',
    specialGradient: 'from-yellow-400 to-orange-500',

    // Accent
    accentColor: '#6366F1',
    secondaryColor: '#4F46E5',

    // Sidebar
    sidebarText: '#94A3B8',
    sidebarActive: '#FFFFFF',

    // Layout backgrounds
    cardBg: 'bg-slate-900/60 backdrop-blur-xl',
    cardBorder: 'border-white/10',
    modalBg: 'bg-[#0b1221]',
    navbarBg: 'bg-[#0B1120]/80',
    sidebarBg: 'bg-slate-900/50',
    footerBg: 'bg-slate-900/80',
    shadowColor: 'shadow-indigo-500/25',
    stickyColumnBg: 'bg-[#0d1420]',

    // Semantic colors
    success: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    danger:  { text: 'text-rose-400',    bg: 'bg-rose-500/20',    border: 'border-rose-500/30'    },
    warning: { text: 'text-amber-400',   bg: 'bg-amber-500/20',   border: 'border-amber-500/30'   },
    info:    { text: 'text-indigo-400',  bg: 'bg-indigo-500/20',  border: 'border-indigo-500/30'  },
    muted:   { text: 'text-slate-400',   bg: 'bg-white/5',        border: 'border-white/5'        },
  },

  // ─── LIGHT THEME ───────────────────────────────────────────────────────────
  'daylight-clean': {
    id: 'daylight-clean',
    name: 'Daylight Clean',
    isDark: false,

    // Gradients
    navbarGradient: 'from-white to-white',
    headerGradient: 'from-white via-white to-white',
    sidebarGradient: 'from-white to-white',
    surfaceGradient: 'from-slate-50 to-white',
    primaryGradient: 'from-indigo-600 to-violet-700',
    secondaryGradient: 'from-violet-600 to-indigo-700',
    avatarGradient: 'from-indigo-500 to-indigo-600',
    birthdayGradient: 'from-indigo-500 via-purple-600 to-indigo-900',
    specialGradient: 'from-yellow-400 to-orange-500',

    // Accent
    accentColor: '#6366F1',
    secondaryColor: '#4F46E5',

    // Sidebar
    sidebarText: '#475569',
    sidebarActive: '#1e1b4b',

    // Layout backgrounds
    cardBg: 'bg-white/80 backdrop-blur-xl',
    cardBorder: 'border-slate-200',
    modalBg: 'bg-white',
    navbarBg: 'bg-white/90',
    sidebarBg: 'bg-white/80',
    footerBg: 'bg-slate-100',
    shadowColor: 'shadow-indigo-200',
    stickyColumnBg: 'bg-slate-50',

    // Semantic colors
    success: { text: 'text-emerald-600', bg: 'bg-emerald-50',   border: 'border-emerald-200' },
    danger:  { text: 'text-rose-600',    bg: 'bg-rose-50',      border: 'border-rose-200'    },
    warning: { text: 'text-amber-600',   bg: 'bg-amber-50',     border: 'border-amber-200'   },
    info:    { text: 'text-indigo-600',  bg: 'bg-indigo-50',    border: 'border-indigo-200'  },
    muted:   { text: 'text-slate-500',   bg: 'bg-slate-100',    border: 'border-slate-200'   },
  },
};

export { themes };
export default themes['midnight-royal'];
