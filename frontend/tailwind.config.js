/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    screens: {
      'xxs': '320px',   // Small phones
      'xs': '475px',    // Large phones
      'sm': '640px',    // Small tablets
      'md': '768px',    // Tablets
      'lg': '1024px',   // Small laptops
      'xl': '1280px',   // Laptops
      '2xl': '1536px',  // Large screens
      '3xl': '1920px',  // Extra large screens
      // Custom breakpoints for specific use cases
      'mobile': {'max': '767px'},     // Mobile-only styles
      'tablet': {'min': '768px', 'max': '1023px'}, // Tablet-only styles
      'desktop': {'min': '1024px'},   // Desktop and up
      'touch': {'max': '1023px'},     // Touch devices (mobile + tablet)
      'hover': {'min': '1024px'},     // Devices with hover capability
    },
    extend: {
      colors: {
        primary: {
          50: '#fffdf0',
          100: '#fefce8',
          200: '#fef3c7',
          300: '#fde68a',
          400: '#fcd34d',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        // Mobile-specific spacing
        'mobile-xs': '0.75rem',  // 12px
        'mobile-sm': '1rem',     // 16px
        'mobile-md': '1.5rem',   // 24px
        'mobile-lg': '2rem',     // 32px
        'mobile-xl': '3rem',     // 48px
        // Container spacing
        'container-xs': '1rem',   // 16px
        'container-sm': '1.5rem', // 24px
        'container-md': '2rem',   // 32px
        'container-lg': '3rem',   // 48px
      },
      minHeight: {
        'touch': '44px', // iOS minimum touch target
        'touch-sm': '36px',
        'touch-lg': '52px',
        'screen-mobile': '100vh',
        'screen-tablet': '100vh',
        'screen-desktop': '100vh',
      },
      maxWidth: {
        'mobile': '100vw',
        'tablet': '768px',
        'desktop': '1200px',
        'container-mobile': 'calc(100vw - 2rem)',
        'container-tablet': 'calc(100vw - 4rem)',
        'container-desktop': '1200px',
      },
      fontSize: {
        'touch': ['16px', '1.5'], // Prevent zoom on iOS
        // Responsive font scales
        'xxs': ['0.625rem', '0.875rem'],   // 10px
        'xs-mobile': ['0.75rem', '1rem'],   // 12px mobile
        'sm-mobile': ['0.875rem', '1.25rem'], // 14px mobile
        'base-mobile': ['1rem', '1.5rem'],    // 16px mobile
        'lg-mobile': ['1.125rem', '1.75rem'], // 18px mobile
        'xl-mobile': ['1.25rem', '1.75rem'],  // 20px mobile
        // Fluid typography
        'fluid-xs': 'clamp(0.75rem, 2vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 2.5vw, 1rem)',
        'fluid-base': 'clamp(1rem, 3vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 3.5vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 4vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 5vw, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 6vw, 2.5rem)',
        'fluid-4xl': 'clamp(2.25rem, 7vw, 3rem)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'hard': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 25px -5px rgba(0, 0, 0, 0.1)',
        // Mobile-optimized shadows
        'mobile-soft': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'mobile-medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'mobile-hard': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        'mobile': '0.5rem',    // 8px for mobile
        'tablet': '0.75rem',   // 12px for tablet
        'desktop': '1rem',     // 16px for desktop
      },
      gridTemplateColumns: {
        // Responsive grid templates
        'mobile-1': 'repeat(1, minmax(0, 1fr))',
        'mobile-2': 'repeat(2, minmax(0, 1fr))',
        'tablet-2': 'repeat(2, minmax(0, 1fr))',
        'tablet-3': 'repeat(3, minmax(0, 1fr))',
        'desktop-3': 'repeat(3, minmax(0, 1fr))',
        'desktop-4': 'repeat(4, minmax(0, 1fr))',
        'auto-fit-mobile': 'repeat(auto-fit, minmax(280px, 1fr))',
        'auto-fit-tablet': 'repeat(auto-fit, minmax(320px, 1fr))',
        'auto-fit-desktop': 'repeat(auto-fit, minmax(350px, 1fr))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
