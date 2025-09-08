/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand Color Palette - Primary Colors
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
          primary: "#AD96DC", // Neon Violet for primary button hover
          secondary: "#8DE971", // Lumen Green for secondary button hover
          danger: "#FF7276", // Brand Coral for danger hover
        },
        ui: {
          primary: "#F6F2F4",
          secondary: "#F0EDF0",
          tertiary: "#E8E4E6",
          background: "#F6F2F4",
        },
        state: {
          hover: "#AD96DC", // Neon Violet for hover states
          pressed: "#8DE971", // Lumen Green for pressed states
          focused: "#8DE971", // Lumen Green for focused states
          active: "#8DE971", // Lumen Green for active states
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
      fontFamily: {
        // Brand Typography System
        'heading': ['Canela', 'Times New Roman', 'serif'],
        'subheading': ['Corporative Sans Rounded', 'Arial Rounded MT Bold', 'Arial', 'sans-serif'],
        'body': ['Corporative Sans Rounded', 'Calibri', 'Arial', 'sans-serif'],
        'highlight': ['Testimonia', 'Brush Script MT', 'cursive'],
        
        // Web-safe alternatives for better compatibility
        'heading-safe': ['Times New Roman', 'serif'],
        'subheading-safe': ['Arial Rounded MT Bold', 'Arial', 'sans-serif'],
        'body-safe': ['Calibri', 'Arial', 'sans-serif'],
        'highlight-safe': ['Brush Script MT', 'cursive'],
      },
      fontSize: {
        // Brand Typography Scale
        'heading-xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '0' }],
        'heading-lg': ['2.5rem', { lineHeight: '1.2', letterSpacing: '0' }],
        'heading-md': ['2rem', { lineHeight: '1.3', letterSpacing: '0' }],
        'heading-sm': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0' }],
        'subheading-lg': ['1.25rem', { lineHeight: '1.3', letterSpacing: '0.1em' }],
        'subheading-md': ['1.125rem', { lineHeight: '1.4', letterSpacing: '0.1em' }],
        'subheading-sm': ['1rem', { lineHeight: '1.5', letterSpacing: '0.1em' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-md': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'highlight': ['1rem', { lineHeight: '1.4', letterSpacing: '0' }],
      },
      fontWeight: {
        'heading': '300', // Thin for Canela
        'subheading': '700', // Bold for Corporative Sans Rounded
        'body': '400', // Regular
        'highlight': '400', // Regular for Testimonia
      },
    },
  },
  plugins: [],
};
