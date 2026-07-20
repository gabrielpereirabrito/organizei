/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        finance: {
          verde: 'var(--finance-verde)',
          vermelho: 'var(--finance-vermelho)',
          alerta: 'var(--finance-alerta)',
          fundo: 'var(--finance-fundo)',
          card: 'var(--finance-card)',
          texto: 'var(--finance-texto)',
          mutado: 'var(--finance-mutado)',
        }
      }
    },
  },
  plugins: [],
}
