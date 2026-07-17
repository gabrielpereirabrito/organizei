/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        finance: {
          verde: '#00B074',
          vermelho: '#FF4C4C',
          alerta: '#FFB020',
          fundo: '#F8F9FA',
          card: '#FFFFFF',
          texto: '#1A1A1A',
          mutado: '#71717A',
        }
      }
    },
  },
  plugins: [],
}
