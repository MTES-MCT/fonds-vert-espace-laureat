/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "postcss-import": {},
    "postcss-url": { url: "rebase" },
    tailwindcss: {},
  },
};

export default config;
