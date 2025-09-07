/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand Color Palette
        "deep-space-black": "#030304",
        "lumen-green": "#8DE971",
        "iridescent-pearl": "#F6F2F4",
        "neon-violet": "#AD96DC",
        // Tertiary accents (for charts/infographics only)
        "brand-yellow": "#ECF166",
        "brand-cyan": "#74D1EA",
        "brand-coral": "#FF7276",

        // Keep existing brand colors for backward compatibility
        brand: {
          pearl: "#F6F2F4",
          black: "#030304",
          green: "#8DE971",
          violet: "#AD96DC",
          blue: "#6B9BFF",
          yellow: "#FFD93D",
          red: "#FF6B6B",
        },
        hover: {
          primary: "#9FEF85",
          secondary: "#BFA8E8",
          danger: "#FF8585",
        },
        ui: {
          primary: "#F6F2F4",
          secondary: "#F0EDF0",
          tertiary: "#E8E4E6",
          background: "#F6F2F4",
        },
        state: {
          hover: "#8DE971",
          pressed: "#7AD45F",
          focused: "#8DE971",
          active: "#4CAF50",
        },
        transparency: {
          10: "rgba(246, 242, 244, 0.1)",
          20: "rgba(246, 242, 244, 0.2)",
          30: "rgba(246, 242, 244, 0.3)",
          40: "rgba(246, 242, 244, 0.4)",
          50: "rgba(246, 242, 244, 0.5)",
          60: "rgba(246, 242, 244, 0.6)",
          70: "rgba(246, 242, 244, 0.7)",
          80: "rgba(246, 242, 244, 0.8)",
          90: "rgba(246, 242, 244, 0.9)",
        },
      },
      backgroundColor: {
        DEFAULT: "#F6F2F4", // make Iridescent Pearl the default
      },
    },
  },
  plugins: [],
};
