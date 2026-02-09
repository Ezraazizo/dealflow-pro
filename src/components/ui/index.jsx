// Premium UI Components for DealFlow Pro
// Reusable styled components with consistent design

import { forwardRef } from 'react';
import { Loader, ChevronDown } from 'lucide-react';

// ─── Button ────────────────────────────────────────────────

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  theme,
  style = {},
  ...props 
}) {
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12, gap: 6, iconSize: 14 },
    md: { padding: '10px 18px', fontSize: 14, gap: 8, iconSize: 16 },
    lg: { padding: '14px 24px', fontSize: 15, gap: 10, iconSize: 18 },
  };

  const variants = {
    primary: {
      background: theme.gradientPrimary,
      color: '#fff',
      border: 'none',
      boxShadow: theme.shadowMd,
    },
    secondary: {
      background: theme.bgElevated,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: theme.textSecondary,
      border: 'none',
      boxShadow: 'none',
    },
    danger: {
      background: theme.error,
      color: '#fff',
      border: 'none',
      boxShadow: theme.shadowMd,
    },
    outline: {
      background: 'transparent',
      color: theme.accent,
      border: `1px solid ${theme.accent}`,
      boxShadow: 'none',
    },
  };

  const s = sizes[size];
  const v = variants[variant];

  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        fontFamily: 'inherit',
        borderRadius: 10,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        width: fullWidth ? '100%' : 'auto',
        ...v,
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <Loader size={s.iconSize} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={s.iconSize} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={s.iconSize} />}
        </>
      )}
    </button>
  );
}

// ─── Input ─────────────────────────────────────────────────

export const Input = forwardRef(function Input({ 
  label,
  error,
  icon: Icon,
  theme,
  style = {},
  containerStyle = {},
  ...props 
}, ref) {
  return (
    <div style={containerStyle}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: theme.textDim,
          marginBottom: 6,
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: 14, 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: theme.textDim,
              pointerEvents: 'none',
            }} 
          />
        )}
        <input
          ref={ref}
          style={{
            width: '100%',
            padding: Icon ? '12px 14px 12px 42px' : '12px 14px',
            background: theme.bgElevated,
            border: `1px solid ${error ? theme.error : theme.border}`,
            borderRadius: 10,
            fontSize: 14,
            color: theme.text,
            outline: 'none',
            transition: 'all 0.15s ease',
            ...style,
          }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: 12, color: theme.error, marginTop: 4, display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  );
});

// ─── Select ────────────────────────────────────────────────

export function Select({ 
  label, 
  options = [], 
  theme, 
  style = {},
  ...props 
}) {
  return (
    <div>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: theme.textDim,
          marginBottom: 6,
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          style={{
            width: '100%',
            padding: '12px 40px 12px 14px',
            background: theme.bgElevated,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            fontSize: 14,
            color: theme.text,
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            ...style,
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={16} 
          style={{ 
            position: 'absolute', 
            right: 14, 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: theme.textDim,
            pointerEvents: 'none',
          }} 
        />
      </div>
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────

export function Card({ 
  children, 
  padding = 20, 
  hover = false,
  glow = false,
  theme,
  style = {},
  ...props 
}) {
  return (
    <div
      style={{
        background: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        padding,
        boxShadow: glow ? theme.shadowGlow : theme.shadowSm,
        transition: 'all 0.2s ease',
        ...(hover && {
          cursor: 'pointer',
        }),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────

export function Badge({ 
  children, 
  color = '#f59e0b',
  size = 'md',
  dot = false,
  theme,
  style = {},
}) {
  const sizes = {
    sm: { padding: '2px 6px', fontSize: 10 },
    md: { padding: '4px 10px', fontSize: 11 },
    lg: { padding: '6px 12px', fontSize: 12 },
  };

  const s = sizes[size];
  const bg = color.startsWith('#') ? `${color}20` : color;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        borderRadius: 6,
        background: bg,
        color: color.startsWith('#') ? color : theme.text,
        ...style,
      }}
    >
      {dot && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color.startsWith('#') ? color : 'currentColor',
        }} />
      )}
      {children}
    </span>
  );
}

// ─── Avatar ────────────────────────────────────────────────

export function Avatar({ 
  name, 
  src, 
  size = 40, 
  theme,
  style = {},
}) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const colors = [
    '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
    '#ec4899', '#ef4444', '#06b6d4', '#84cc16'
  ];
  
  const colorIndex = name 
    ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          ...style,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${colors[colorIndex]}20`,
        color: colors[colorIndex],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        ...style,
      }}
    >
      {initials}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────

export function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  change,
  color = '#f59e0b',
  theme,
}) {
  return (
    <Card theme={theme} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        borderRadius: '50%',
      }} />
      
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Icon size={24} color={color} />
        </div>
        
        <div style={{ 
          fontSize: 28, 
          fontWeight: 800, 
          marginBottom: 4,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: -1,
        }}>
          {value}
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <span style={{ 
            fontSize: 13, 
            color: theme.textSecondary,
            fontWeight: 500,
          }}>
            {label}
          </span>
          
          {change !== undefined && (
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: change >= 0 ? theme.success : theme.error,
            }}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Empty State ───────────────────────────────────────────

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  theme,
}) {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '60px 20px',
      maxWidth: 400,
      margin: '0 auto',
    }}>
      {Icon && (
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: theme.bgElevated,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <Icon size={36} color={theme.textDim} />
        </div>
      )}
      
      <h3 style={{ 
        fontSize: 18, 
        fontWeight: 700, 
        marginBottom: 8,
        color: theme.text,
      }}>
        {title}
      </h3>
      
      <p style={{ 
        fontSize: 14, 
        color: theme.textSecondary,
        lineHeight: 1.6,
        marginBottom: action ? 24 : 0,
      }}>
        {description}
      </p>
      
      {action}
    </div>
  );
}

// ─── Tabs ──────────────────────────────────────────────────

export function Tabs({ 
  tabs, 
  activeTab, 
  onChange, 
  theme,
  style = {},
}) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      padding: 4,
      background: theme.bgElevated,
      borderRadius: 12,
      ...style,
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: activeTab === tab.id ? theme.bgCard : 'transparent',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: activeTab === tab.id ? 600 : 500,
            color: activeTab === tab.id ? theme.text : theme.textSecondary,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === tab.id ? theme.shadowSm : 'none',
          }}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 10,
              background: activeTab === tab.id ? theme.accentDim : theme.bgElevated,
              color: activeTab === tab.id ? theme.accent : theme.textDim,
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Progress Bar ──────────────────────────────────────────

export function ProgressBar({ 
  value, 
  max = 100, 
  color = '#f59e0b',
  showLabel = true,
  size = 'md',
  theme,
}) {
  const percent = Math.min((value / max) * 100, 100);
  const heights = { sm: 4, md: 8, lg: 12 };

  return (
    <div>
      <div style={{
        width: '100%',
        height: heights[size],
        background: theme.bgElevated,
        borderRadius: heights[size] / 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: color,
          borderRadius: heights[size] / 2,
          transition: 'width 0.3s ease',
        }} />
      </div>
      {showLabel && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 11,
          color: theme.textDim,
        }}>
          <span>{value.toLocaleString()}</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
    </div>
  );
}

// ─── Tooltip ───────────────────────────────────────────────

export function Tooltip({ 
  children, 
  content, 
  position = 'top',
  theme,
}) {
  // Note: For a full tooltip implementation, you'd want to use a portal
  // This is a simplified inline version
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {children}
    </div>
  );
}

// ─── Divider ───────────────────────────────────────────────

export function Divider({ 
  label, 
  theme,
  style = {},
}) {
  if (label) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 16,
        margin: '20px 0',
        ...style,
      }}>
        <div style={{ flex: 1, height: 1, background: theme.border }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: theme.border }} />
      </div>
    );
  }

  return (
    <div style={{ 
      height: 1, 
      background: theme.border, 
      margin: '16px 0',
      ...style,
    }} />
  );
}

// ─── Skeleton ──────────────────────────────────────────────

export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  theme,
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: `linear-gradient(90deg, ${theme.bgElevated} 25%, ${theme.bgHover} 50%, ${theme.bgElevated} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

export default {
  Button,
  Input,
  Select,
  Card,
  Badge,
  Avatar,
  StatCard,
  EmptyState,
  Tabs,
  ProgressBar,
  Tooltip,
  Divider,
  Skeleton,
};
