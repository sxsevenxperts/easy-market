/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a',
        secondary: '#1e293b',
        accent: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#06b6d4',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'card-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
