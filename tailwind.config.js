const colors = require("tailwindcss/colors");

const primary = {
  DEFAULT: "#00D18C",
  50: "#8AFFD8",
  100: "#75FFD2",
  200: "#4CFFC4",
  300: "#24FFB7",
  400: "#00FAA7",
  500: "#00D18C",
  600: "#009966",
  700: "#006141",
  800: "#00291B",
  900: "#000000",
};

const accent = {
  DEFAULT: "#9945FF",
  50: "#FEFDFF",
  100: "#F2E8FF",
  200: "#DCBFFF",
  300: "#C697FF",
  400: "#AF6EFF",
  500: "#9945FF",
  600: "#7A0DFF",
  700: "#6000D4",
  800: "#46009C",
  900: "#2D0064",
};

const coolGray = {
  DEFAULT: "#6e7582",
  50: "#f9fafb",
  100: "#f0f1f3",
  150: "#eff1f4",
  200: "#d9dbdf",
  300: "#AAB8C1",
  400: "#9CA3AF",
  500: "#6B7280",
  600: "#4B5563",
  700: "#374151",
  800: "#161E26",
  900: "#050505",
};

const warmGray = {
  DEFAULT: "#6e7582",
  50: "#f9fafb",
  100: "#f0f1f3",
  150: "#eff1f4",
  200: "#d9dbdf",
  300: "#b7bbc2",
  400: "#8f959f",
  500: "#6e7582",
  600: "#555e6e",
  700: "#3e4859",
  800: "#222222",
  850: "#181818",
  900: "#050505",
};

const grays = {
  DEFAULT: "#6e7582",
  50: "#f9fafb",
  100: "#f0f1f3",
  150: "#eff1f4",
  200: "#d9dbdf",
  300: "#b7bbc2",
  400: "#8f959f",
  500: "#6e7582",
  600: "#555e6e",
  700: "#3e4859",
  800: "#283242",
  850: "#1f2023",
  900: "#131f30",
};

const textColor = {
  DEFAULT: grays[800],
  secondary: grays[500],
};

module.exports = {
  content: ["./src/**/*.{html,ts,tsx}"],
  darkMode: "class",

  theme: {
    screens: {
      sm: "480px",
      md: "768px",
      lg: "976px",
      xl: "1220px",
    },
    extend: {
      fontSize: {
        sm: ".8125rem",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        ...colors,
        primary,
        accent,
        gray: grays,
        warmGray,
        coolGray,
      },
      textColor,
      scale: {
        98: ".98",
        102: "1.02",
      },
      borderColor: {
        DEFAULT: grays[150],
      },
      typography: {
        sm: {
          css: {
            fontSize: ".8125rem",
            h1: {
              fontSize: ".8125rem",
            },
            h2: {
              fontSize: ".8125rem",
            },
            h3: {
              fontSize: ".8125rem",
            },
          },
        },
        DEFAULT: {
          css: {
            color: grays[500],
            strong: {
              color: grays[800],
            },
            h1: {
              color: grays[800],
              fontWeight: 500,
            },
            h2: {
              color: grays[800],
              fontWeight: 500,
            },
            h3: {
              color: grays[800],
              fontWeight: 500,
            },
            code: {
              color: grays[500],
            },
          },
        },
        light: {
          css: {
            color: grays[300],
            strong: {
              color: grays[50],
            },
            h1: {
              color: grays[50],
              fontWeight: 500,
            },
            h2: {
              color: grays[50],
              fontWeight: 500,
            },
            h3: {
              color: grays[50],
              fontWeight: 500,
            },
            code: {
              color: grays[300],
            },
          },
        },
      },
    },
  },
  variants: {
    extend: {
      typography: ["dark"],
    },
  },
  plugins: [
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};