/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'tech-dark': '#0f172a',
                'tech-card': '#1e293b',
                'neon-green': '#10b981',
                'neon-red': '#f43f5e',
                'neon-blue': '#3b82f6',
                'neon-purple': '#8b5cf6',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px #3b82f6' },
                    '100%': { boxShadow: '0 0 20px #3b82f6, 0 0 10px #8b5cf6' },
                }
            }
        },
    },
    plugins: [],
}
