/**
 * Tailwind v4 is applied as a PostCSS plugin, which is how this version of
 * Next expects it (node_modules/next/dist/docs, "How to add CSS").
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
