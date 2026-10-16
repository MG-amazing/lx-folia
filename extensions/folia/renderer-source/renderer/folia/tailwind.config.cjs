/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {relative: true, files: [
    './src/**/*.{ts,tsx}',
    './vendor/src/components/visualizer/**/*.{ts,tsx}',
  ]},
  theme: { extend: {} },
  plugins: [],
};
