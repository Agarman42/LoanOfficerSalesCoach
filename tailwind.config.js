/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './js/**/*.{js,html}',
    './smart-savings/**/*.{js,html,css}',
    './realtor-sales-coach/index.html',
    './realtor-sales-coach/js/**/*.{js,html}',
    './recruiter-sales-coach/index.html',
    './recruiter-sales-coach/js/**/*.{js,html}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
