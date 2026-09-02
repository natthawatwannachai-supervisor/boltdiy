/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kanit', 'Prompt', 'Sarabun', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Kanit', 'Prompt', 'sans-serif'],
        body: ['Prompt', 'Kanit', 'sans-serif'],
      },
      colors: {
        // Neumorphic base surface
        neu: {
          50: '#F2F5F9',
          100: '#EDF1F6',
          200: '#E0E5EC', // primary base
          300: '#D6DCE5',
          400: '#C8D0DA',
          light: '#FFFFFF',
          dark: '#BEC8D2',
        },
        // Emerald -> Teal accent ramp
        brand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        teal: {
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
        ink: {
          400: '#8A97A8',
          500: '#6B7A90',
          600: '#4B5A70',
          700: '#334155',
          800: '#1F2937',
          900: '#111827',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #34D399 0%, #2DD4BF 100%)',
        'brand-gradient-deep': 'linear-gradient(135deg, #047857 0%, #0F766E 100%)',
        'neu-surface': 'linear-gradient(145deg, #f0f4f9, #cfd6e0)',
        'mesh-glow':
          'radial-gradient(60rem 40rem at 10% -10%, rgba(45,212,191,0.20), transparent 60%), radial-gradient(50rem 35rem at 110% 10%, rgba(16,185,129,0.18), transparent 60%)',
      },
      boxShadow: {
        // Outset (raised) neumorphism
        neu: '8px 8px 16px #c8c8c8, -8px -8px 16px #ffffff',
        'neu-sm': '4px 4px 8px #c8ced8, -4px -4px 8px #ffffff',
        'neu-lg': '14px 14px 28px #c3c9d3, -14px -14px 28px #ffffff',
        'neu-xl': '22px 22px 44px #bfc6d1, -22px -22px 44px #ffffff',
        // Inset (pressed) neumorphism
        'neu-inset': 'inset 6px 6px 12px #c8ced8, inset -6px -6px 12px #ffffff',
        'neu-inset-sm': 'inset 3px 3px 6px #c8ced8, inset -3px -3px 6px #ffffff',
        'neu-inset-lg': 'inset 10px 10px 20px #c3c9d3, inset -10px -10px 20px #ffffff',
        // Accent glows
        'brand-glow': '0 10px 30px -8px rgba(16,185,129,0.55)',
        'brand-glow-lg': '0 22px 48px -12px rgba(20,184,166,0.6)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-22px) rotate(3deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.25)', opacity: '0' },
          '100%': { transform: 'scale(1.25)', opacity: '0' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
      },
      borderRadius: {
        neu: '1.5rem',
        'neu-lg': '2rem',
        'neu-xl': '2.75rem',
      },
    },
  },
  plugins: [],
};
