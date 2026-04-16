/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "monospace",
        ],
      },
      colors: {
        ink: {
          50: "#f7f8fa",
          100: "#eef0f4",
          200: "#dde2ea",
          300: "#bcc4d1",
          400: "#8a94a6",
          500: "#5b6577",
          600: "#3d4555",
          700: "#262c39",
          800: "#171b25",
          900: "#0c0f17",
          950: "#070912",
        },
        accent: {
          DEFAULT: "#7c5cff",
          400: "#9a82ff",
          500: "#7c5cff",
          600: "#6443e6",
          700: "#4f33c4",
        },
        emerald2: {
          DEFAULT: "#22c39a",
          400: "#3edab2",
          600: "#159b78",
        },
        amber2: {
          DEFAULT: "#f5a524",
          600: "#c9831a",
        },
        crimson: {
          DEFAULT: "#ef4f6c",
          600: "#c63b56",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,0.25), 0 8px 32px -8px rgba(124,92,255,0.45)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        fadeIn: "fadeIn 250ms ease-out",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};
