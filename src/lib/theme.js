// Premium Theme System for DealFlow Pro
// Enhanced colors, gradients, and effects

export const themes = {
  dark: {
    name: 'dark',
    
    // Backgrounds
    bg: '#0a0b0f',
    bgCard: '#12141a',
    bgElevated: '#1a1d24',
    bgHover: '#22252e',
    bgGlass: 'rgba(18, 20, 26, 0.85)',
    
    // Borders
    border: '#1e2128',
    borderLight: '#2a2e38',
    borderFocus: '#f59e0b',
    
    // Text
    text: '#f0f1f3',
    textSecondary: '#9ca3af',
    textDim: '#6b7280',
    textMuted: '#4b5563',
    
    // Accent (Amber/Gold)
    accent: '#f59e0b',
    accentHover: '#fbbf24',
    accentDim: 'rgba(245, 158, 11, 0.12)',
    accentGlow: 'rgba(245, 158, 11, 0.25)',
    
    // Gradients
    gradientPrimary: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    gradientCard: 'linear-gradient(180deg, rgba(26, 29, 36, 0.5) 0%, rgba(18, 20, 26, 0.8) 100%)',
    gradientSidebar: 'linear-gradient(180deg, #12141a 0%, #0a0b0f 100%)',
    
    // Status colors
    success: '#10b981',
    successDim: 'rgba(16, 185, 129, 0.12)',
    warning: '#f59e0b',
    warningDim: 'rgba(245, 158, 11, 0.12)',
    error: '#ef4444',
    errorDim: 'rgba(239, 68, 68, 0.12)',
    info: '#3b82f6',
    infoDim: 'rgba(59, 130, 246, 0.12)',
    
    // Shadows
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.4)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.5)',
    shadowXl: '0 16px 48px rgba(0, 0, 0, 0.6)',
    shadowGlow: '0 0 20px rgba(245, 158, 11, 0.15)',
    shadowInset: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayBlur: 'rgba(10, 11, 15, 0.8)',
  },
  
  light: {
    name: 'light',
    
    // Backgrounds
    bg: '#f8fafc',
    bgCard: '#ffffff',
    bgElevated: '#f1f5f9',
    bgHover: '#e2e8f0',
    bgGlass: 'rgba(255, 255, 255, 0.85)',
    
    // Borders
    border: '#e2e8f0',
    borderLight: '#cbd5e1',
    borderFocus: '#f59e0b',
    
    // Text
    text: '#0f172a',
    textSecondary: '#475569',
    textDim: '#64748b',
    textMuted: '#94a3b8',
    
    // Accent
    accent: '#f59e0b',
    accentHover: '#d97706',
    accentDim: 'rgba(245, 158, 11, 0.1)',
    accentGlow: 'rgba(245, 158, 11, 0.2)',
    
    // Gradients
    gradientPrimary: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    gradientCard: 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)',
    gradientSidebar: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    
    // Status colors
    success: '#059669',
    successDim: 'rgba(5, 150, 105, 0.1)',
    warning: '#d97706',
    warningDim: 'rgba(217, 119, 6, 0.1)',
    error: '#dc2626',
    errorDim: 'rgba(220, 38, 38, 0.1)',
    info: '#2563eb',
    infoDim: 'rgba(37, 99, 235, 0.1)',
    
    // Shadows
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.08)',
    shadowLg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    shadowXl: '0 16px 48px rgba(0, 0, 0, 0.15)',
    shadowGlow: '0 0 20px rgba(245, 158, 11, 0.1)',
    shadowInset: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.4)',
    overlayBlur: 'rgba(248, 250, 252, 0.8)',
  },
};

// Status configurations
export const dealStatuses = {
  new: { 
    color: '#3b82f6', 
    bg: 'rgba(59, 130, 246, 0.12)', 
    label: 'New',
    icon: 'Sparkles'
  },
  hot: { 
    color: '#ef4444', 
    bg: 'rgba(239, 68, 68, 0.12)', 
    label: 'Hot',
    icon: 'Flame'
  },
  warm: { 
    color: '#f59e0b', 
    bg: 'rgba(245, 158, 11, 0.12)', 
    label: 'Warm',
    icon: 'Sun'
  },
  cold: { 
    color: '#6b7280', 
    bg: 'rgba(107, 114, 128, 0.12)', 
    label: 'Cold',
    icon: 'Snowflake'
  },
  dead: { 
    color: '#374151', 
    bg: 'rgba(55, 65, 81, 0.12)', 
    label: 'Dead',
    icon: 'XCircle'
  },
  closed_won: { 
    color: '#10b981', 
    bg: 'rgba(16, 185, 129, 0.12)', 
    label: 'Closed Won',
    icon: 'Trophy'
  },
};

// Stage configurations
export const dealStages = {
  prospect: { order: 1, label: 'Prospect', color: '#6366f1' },
  outreach: { order: 2, label: 'Outreach', color: '#8b5cf6' },
  tour: { order: 3, label: 'Tour', color: '#a855f7' },
  loi: { order: 4, label: 'LOI', color: '#d946ef' },
  due_diligence: { order: 5, label: 'Due Diligence', color: '#ec4899' },
  contract: { order: 6, label: 'Contract', color: '#f43f5e' },
  closing: { order: 7, label: 'Closing', color: '#10b981' },
};

// Common style mixins
export const mixins = {
  // Glass effect
  glass: (theme) => ({
    background: theme.bgGlass,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  }),
  
  // Card with glow on hover
  cardHover: (theme) => ({
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadowLg,
    },
  }),
  
  // Focus ring
  focusRing: (theme) => ({
    outline: 'none',
    boxShadow: `0 0 0 2px ${theme.bgCard}, 0 0 0 4px ${theme.accent}`,
  }),
  
  // Text gradient
  textGradient: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  
  // Scrollbar styling
  scrollbar: (theme) => ({
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.borderLight} transparent`,
    '&::-webkit-scrollbar': {
      width: 6,
      height: 6,
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.borderLight,
      borderRadius: 3,
    },
  }),
};

// Animation keyframes
export const animations = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideInUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideInDown {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 5px rgba(245, 158, 11, 0.3); }
    50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.5); }
  }
`;

export default themes;
