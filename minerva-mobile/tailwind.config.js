/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        obsidian: '#FFFFFF',
        midnight: '#FFFFFF',
        dusk: '#F8FAFC',
        ivory: '#0F172A',
        silver: '#475569',
        fog: '#94A3B8',
        mist: '#E2E8F0',
        sage: '#10B981',
        warm: '#F59E0B',
        ember: '#EF4444',
        primaryColor: '#4F46E5',
      },
    },
  },
  plugins: [],
};
