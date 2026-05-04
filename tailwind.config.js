/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '14px'],
        xs:    ['12px', '16px'],
        sm:    ['13px', '18px'],
        base:  ['14px', '20px'],
        lg:    ['16px', '22px'],
        xl:    ['18px', '24px'],
        '2xl': ['22px', '28px'],
      },
      colors: {
        ph: {
          // Primário corporativo (navy graphite)
          primary:    '#1E2A38',
          'primary-2':'#2C3A4B',
          'primary-3':'#3A4A5C',
          // Acento dessaturado
          accent:     '#C84B16',
          'accent-h': '#A53D11',
          'accent-l': '#FBE8DD',
          // Superfícies
          bg:         '#F4F5F7',
          surface:    '#FFFFFF',
          'surface-2':'#F9FAFB',
          // Bordas
          border:     '#E1E4E8',
          'border-2': '#D1D5DA',
          'border-d': '#2C3A4B',
          // Texto
          text:       '#1F2328',
          muted:      '#57606A',
          soft:       '#8C959F',
          // Status
          success:    '#1A7F37',
          'success-l':'#DCFCE7',
          warning:    '#9A6700',
          'warning-l':'#FFF8C5',
          danger:     '#CF222E',
          'danger-l': '#FFEBE9',
          info:       '#0969DA',
          'info-l':   '#DDF4FF',
        },
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '2px',
        lg: '4px',
        xl: '6px',
        full: '9999px',
      },
      spacing: {
        4.5: '1.125rem',
        7.5: '1.875rem',
      },
    },
  },
  plugins: [],
};
