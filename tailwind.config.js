/**  @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable dark mode support
  theme: {
    extend: {
      colors: {
        sony: '#1A237E',
        sonyLight: '#3949AB'
      }
    },
  },
  plugins: [],
};
 