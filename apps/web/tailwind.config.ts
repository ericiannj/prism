import type { Config } from "tailwindcss";
import uiConfig from "../../packages/ui/tailwind.config.ts";

const config: Config = {
  presets: [uiConfig],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
