/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
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
