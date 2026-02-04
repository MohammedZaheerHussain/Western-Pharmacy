/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            gridTemplateColumns: {
                '13': 'repeat(13, minmax(0, 1fr))',
            },
            colors: {
                medical: {
                    blue: '#0066CC',
                    'blue-dark': '#004C99',
                    'blue-light': '#E6F0FA',
                }
            }
        },
    },
    plugins: [],
}

