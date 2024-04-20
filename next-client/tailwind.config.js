// @ts-check

import typography from '@tailwindcss/typography'
import daisyui from "daisyui";
import themes from "daisyui/src/theming/themes";
import { fontFamily } from "tailwindcss/defaultTheme";

const defaultThemes = /** @type {import('daisyui').Theme[]} */ (
  Object.keys(themes)
);

/**
 * @type {import('tailwindcss').Config}
 */
const config = {
  content: [
    "./src/**/*.{html,js,svelte,ts,tsx,md}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        heading: ["var(--font-heading)", ...fontFamily.sans],
      },
    },
  },

  /**
   * @type {import('daisyui').Config}
   */
  daisyui: {
    themes: [
      ...defaultThemes,
      {
        light: themes.cupcake,
        dark: themes.forest,
      },
    ],
  },

  plugins: [daisyui, typography],
};

export default config;
