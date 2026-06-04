/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background scale
        'bg-base':    '#09090B',
        'bg-raised':  '#111113',
        'bg-overlay': '#18181B',
        'bg-subtle':  '#27272A',
        'bg-muted':   '#3F3F46',
        // Text
        'text-primary':   '#FAFAFA',
        'text-secondary': '#A1A1AA',
        'text-tertiary':  '#71717A',
        'text-disabled':  '#52525B',
        // Accents
        'accent-cyan':   '#00D4FF',
        'accent-violet': '#7C3AED',
        'accent-green':  '#22C55E',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:  ['IBM Plex Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'xs':  ['11px', { lineHeight: '1.4' }],
        'sm':  ['13px', { lineHeight: '1.5' }],
        'base':['15px', { lineHeight: '1.6' }],
      },
      borderRadius: {
        'sm':   '8px',
        'md':   '12px',
        'lg':   '16px',
        'xl':   '24px',
        '2xl':  '32px',
      },
      boxShadow: {
        'sm':     '0 1px 2px rgba(0,0,0,0.5)',
        'md':     '0 4px 16px rgba(0,0,0,0.4)',
        'lg':     '0 8px 40px rgba(0,0,0,0.5)',
        'glow-cyan':   '0 0 32px rgba(0,212,255,0.12)',
        'glow-violet': '0 0 32px rgba(124,58,237,0.15)',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-strong': '40px',
      },
      transitionTimingFunction: {
        'out-expo':  'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring':    'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'in-out':    'cubic-bezier(0.76, 0, 0.24, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '350ms',
      },
      animation: {
        'fade-in':       'fadeIn 0.3s ease-out forwards',
        'slide-up':      'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'skeleton':      'skeleton-shimmer 1.8s ease-in-out infinite',
        'pulse-dot':     'pulse-dot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'skeleton-shimmer': {
          '0%':   { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.5 },
        },
      },
      screens: {
        'xs':  '375px',
        'sm':  '640px',
        'md':  '768px',
        'lg':  '1024px',
        'xl':  '1280px',
        '2xl': '1440px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
};
