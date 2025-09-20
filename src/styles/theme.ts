// Clothify Design System - Unified Theme
export const theme = {
  colors: {
    // Primary Gradient (Purple to Pink like landing)
    primary: {
      50: '#f8f4ff',
      100: '#f0e8ff', 
      200: '#e4d4ff',
      300: '#d1b3ff',
      400: '#b885ff',
      500: '#9c4dff', // Main purple
      600: '#8b2cff',
      700: '#7b1cff',
      800: '#6b0dff',
      900: '#5a00ff',
    },
    
    // Secondary (Pink accents)
    secondary: {
      50: '#fff0f8',
      100: '#ffe0f1',
      200: '#ffc2e4',
      300: '#ff94d1',
      400: '#ff5cb8', // Main pink
      500: '#ff2da0',
      600: '#ff0d88',
      700: '#e6006b',
      800: '#cc0052',
      900: '#b30042',
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
      secondary: '#fafafa',
      tertiary: '#f4f4f5',
      dark: '#18181b',
      gradient: 'linear-gradient(135deg, #9c4dff 0%, #ff5cb8 100%)',
    }
  },

  gradients: {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500',
    primaryHover: 'bg-gradient-to-r from-purple-600 to-pink-600',
    text: 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent',
    subtle: 'bg-gradient-to-br from-purple-50 to-pink-50',
    card: 'bg-gradient-to-br from-white to-purple-50/30',
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
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl',
    secondary: 'bg-white border-2 border-purple-200 hover:border-purple-300 text-purple-600 font-semibold py-3 px-6 rounded-xl transition-all duration-200',
    ghost: 'bg-transparent hover:bg-purple-50 text-purple-600 font-medium py-2 px-4 rounded-lg transition-all duration-200',
  },

  // Cards
  card: {
    primary: 'bg-white border border-purple-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300',
    gradient: 'bg-gradient-to-br from-white to-purple-50/30 border border-purple-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300',
    glass: 'bg-white/80 backdrop-blur-sm border border-purple-100 rounded-2xl shadow-lg',
  },

  // Inputs  
  input: 'w-full px-4 py-3 border-2 border-purple-100 focus:border-purple-300 rounded-xl bg-white/80 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-100',

  // Text styles
  text: {
    heading: 'text-3xl md:text-4xl font-bold text-gray-900',
    subheading: 'text-xl font-semibold text-gray-800',
    body: 'text-gray-600 leading-relaxed',
    gradient: 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold',
  }
}
