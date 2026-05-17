/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0D14',
        midnight: '#111522',
        dusk: '#171C2A',
        ivory: '#F5F1E8',
        silver: '#B8BDC7',
        fog: '#8A9099',
        mist: '#D8DDE6',
        sage: '#7FA38A',
        warm: '#B89B6A',
        ember: '#A86A6A',
      },
    },
  },
  plugins: [],
};
