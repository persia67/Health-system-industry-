
export const theme = {
  colors: {
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
    slate950: '#020617',
    
    cyan500: '#06b6d4',
    cyan600: '#0891b2',
    blue500: '#3b82f6',
    blue600: '#2563eb',
    emerald500: '#10b981',
    emerald600: '#059669',
    red500: '#ef4444',
    red600: '#dc2626',
    amber500: '#f59e0b',
    amber600: '#d97706',
    purple500: '#8b5cf6',
    purple600: '#7c3aed',
    
    white: '#ffffff',
    black: '#000000',
  },
  borderRadius: {
    md: '6px',
    lg: '8px',
    xl: '12px',
    xxl: '16px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  }
};

export const baseStyles = {
  container: {
    width: '100%',
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 1.5rem',
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: '1.5rem',
    border: `1px solid ${theme.colors.slate200}`,
    boxShadow: theme.shadows.sm,
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.slate200}`,
    backgroundColor: theme.colors.slate50,
    outline: 'none',
    fontSize: '0.9rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    borderRadius: theme.borderRadius.lg,
    border: 'none',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
  },
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }
};
