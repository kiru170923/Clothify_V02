// Clothify Design System - Cream/Beige Theme
export const theme = {
  colors: {
    // Primary Cream/Beige palette based on #f6f1e9
    primary: {
      50: '#fdfcfa',
      100: '#f9f5f0', 
      200: '#f6f1e9', // Main color
      300: '#f0e8dc',
      400: '#e8dbc8',
      500: '#dcc9a8', // Darker cream
      600: '#c9b089',
      700: '#b5956b',
      800: '#9a7c52',
      900: '#7a5f3e',
    },
    
    // Secondary (Complementary warm tones)
    secondary: {
      50: '#fdf9f5',
      100: '#faf3ea',
      200: '#f5e6d3',
      300: '#efd7b8',
      400: '#e6c59a', // Warm beige
      500: '#d9b17c',
      600: '#c99a5e',
      700: '#b68343',
      800: '#9d6d2d',
      900: '#7f5419',
    },

    // Neutral (Modern grays)
    gray: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
    },

    // Success, Warning, Error
    success: '#10b981',
    warning: '#f59e0b', 
    error: '#ef4444',
    
    // Backgrounds
    background: {
      primary: '#ffffff',
      secondary: '#f6f1e9',
      tertiary: '#f9f5f0',
      dark: '#2c2317',
      gradient: 'linear-gradient(135deg, #dcc9a8 0%, #e6c59a 100%)',
    }
  },

  gradients: {
    primary: 'bg-gradient-to-r from-amber-200 to-yellow-200',
    primaryHover: 'bg-gradient-to-r from-amber-300 to-yellow-300',
    text: 'bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent',
    subtle: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    card: 'bg-gradient-to-br from-white to-amber-50/30',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
    glow: '0 0 20px rgba(156, 77, 255, 0.3)',
    glowPink: '0 0 20px rgba(255, 92, 184, 0.3)',
  },

  borderRadius: {
    sm: '6px',
    md: '8px', 
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '9999px',
  },

  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem', 
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    }
  }
}

// CSS Classes for easy usage
export const themeClasses = {
  // Buttons
  button: {
    primary: 'bg-gradient-to-r from-amber-300 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 text-amber-900 font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl',
    secondary: 'bg-white border-2 border-amber-200 hover:border-amber-300 text-amber-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200',
    ghost: 'bg-transparent hover:bg-amber-50 text-amber-700 font-medium py-2 px-4 rounded-lg transition-all duration-200',
  },

  // Cards
  card: {
    primary: 'bg-white border border-amber-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300',
    gradient: 'bg-gradient-to-br from-white to-amber-50/30 border border-amber-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300',
    glass: 'bg-white/80 backdrop-blur-sm border border-amber-100 rounded-2xl shadow-lg',
  },

  // Inputs  
  input: 'w-full px-4 py-3 border-2 border-amber-100 focus:border-amber-300 rounded-xl bg-white/80 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-amber-100',

  // Text styles
  text: {
    heading: 'text-3xl md:text-4xl font-bold text-gray-900',
    subheading: 'text-xl font-semibold text-gray-800',
    body: 'text-gray-600 leading-relaxed',
    gradient: 'bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent font-bold',
  }
}
