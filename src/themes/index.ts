// Tema para Barbearia
export const barberTheme = {
  colors: {
    primary: '#d4af37', // Ouro
    secondary: '#111111', // Preto escuro
    tertiary: '#1a1a1a',
    background: '#050505',
    text: '#ffffff',
    textSecondary: '#888888',
    success: '#4caf50',
    danger: '#ff4d4d',
    warning: '#ffc107',
    border: '#d4af37',
    hover: 'rgba(212, 175, 55, 0.1)',
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    sizes: {
      h1: 'clamp(2.5rem, 8vw, 4rem)',
      h2: '2.2rem',
      h3: '1.8rem',
      h4: '1.4rem',
      body: '1rem',
      small: '0.875rem',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    round: '50px',
  },
  name: 'barber',
  label: 'Barbearia',
};

// Tema para Esteticista
export const estheticianTheme = {
  colors: {
    primary: '#e91e63', // Rosa
    secondary: '#f8f8f8', // Branco off
    tertiary: '#f5f5f5',
    background: '#fafafa',
    text: '#333333',
    textSecondary: '#666666',
    success: '#4caf50',
    danger: '#ff5252',
    warning: '#fb8c00',
    border: '#e91e63',
    hover: 'rgba(233, 30, 99, 0.08)',
  },
  typography: {
    fontFamily: "'Poppins', 'Inter', sans-serif",
    sizes: {
      h1: 'clamp(2.5rem, 8vw, 4rem)',
      h2: '2.2rem',
      h3: '1.8rem',
      h4: '1.4rem',
      body: '1rem',
      small: '0.875rem',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    small: '12px',
    medium: '16px',
    large: '20px',
    round: '50px',
  },
  name: 'esthetician',
  label: 'Esteticista',
};

// Tema para Manicure/Pedicure
export const nailsTheme = {
  colors: {
    primary: '#00bcd4', // Ciano clean
    secondary: '#ffffff',
    tertiary: '#f0f9fa',
    background: '#fafbfc',
    text: '#1a1a1a',
    textSecondary: '#5a5a5a',
    success: '#26a69a',
    danger: '#ef5350',
    warning: '#ffa726',
    border: '#00bcd4',
    hover: 'rgba(0, 188, 212, 0.08)',
  },
  typography: {
    fontFamily: "'Segoe UI', 'Inter', sans-serif",
    sizes: {
      h1: 'clamp(2.5rem, 8vw, 4rem)',
      h2: '2rem',
      h3: '1.6rem',
      h4: '1.3rem',
      body: '0.95rem',
      small: '0.85rem',
    },
  },
  spacing: {
    xs: '6px',
    sm: '10px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    small: '10px',
    medium: '14px',
    large: '18px',
    round: '50px',
  },
  name: 'nails',
  label: 'Manicure/Pedicure',
};

export type Theme = typeof barberTheme;

export const THEMES = {
  barber: barberTheme,
  esthetician: estheticianTheme,
  nails: nailsTheme,
};

export type ThemeName = keyof typeof THEMES;
