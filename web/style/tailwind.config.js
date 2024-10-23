/** @type {import('tailwindcss').Config} */
module.exports = {
  relative: true,
  content: [
      "web/templates/**/*.html",
      "internal/templates/**/*.templ",
  ],
  theme: {
    extend: {
        colors: {}
    },
  },
  plugins: [],
}

