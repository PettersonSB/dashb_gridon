/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                display: ["Space Grotesk", "system-ui", "sans-serif"],
            },
            colors: {
                background: "hsl(228 30% 6%)",
                foreground: "hsl(0 0% 98%)",
                card: "hsl(228 25% 10%)",
                "card-foreground": "hsl(0 0% 98%)",
                primary: "hsl(195 100% 50%)",
                "primary-foreground": "hsl(228 30% 6%)",
                secondary: "hsl(228 20% 15%)",
                "secondary-foreground": "hsl(0 0% 98%)",
                muted: "hsl(228 15% 18%)",
                "muted-foreground": "hsl(228 10% 55%)",
                accent: "hsl(220 80% 55%)",
                "accent-foreground": "hsl(0 0% 98%)",
                destructive: "hsl(0 62% 50%)",
                "destructive-foreground": "hsl(0 0% 98%)",
                border: "hsl(228 15% 15%)",
                input: "hsl(228 15% 15%)",
                ring: "hsl(195 100% 50%)",
            },
            borderRadius: {
                lg: "0.75rem",
                md: "0.5rem",
                sm: "0.375rem",
                xl: "1rem",
                "2xl": "1.25rem",
            },
            boxShadow: {
                glow: "0 0 20px hsl(195 100% 50% / 0.15)",
                "glow-lg": "0 0 40px hsl(195 100% 50% / 0.2)",
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-in-left": {
                    "0%": { transform: "translateX(-20px)", opacity: "0" },
                    "100%": { transform: "translateX(0)", opacity: "1" },
                },
            },
            animation: {
                "fade-in": "fade-in 0.5s ease-out",
                "slide-in-left": "slide-in-left 0.4s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
