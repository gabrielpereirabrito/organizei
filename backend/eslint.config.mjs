// Flat config (ESLint 10). Substitui o .eslintrc.json, que o ESLint 10 ignora
// silenciosamente — o formato eslintrc foi removido na v10, então as regras do
// ADR 0009 nunca chegaram a rodar. Ver docs/adr/0009-padronizacao-de-codigo-e-linting.md.
import js from '@eslint/js'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['build/**', 'node_modules/**', 'src/generated/**']),

  js.configs.recommended,

  {
    files: ['src/**/*.ts', 'prisma.config.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2022 },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // Equivalente ao "plugin:@typescript-eslint/recommended" do eslintrc antigo.
      ...tsPlugin.configs.recommended.rules,
      // Desliga as regras de formatação que conflitam com o Prettier.
      ...prettierConfig.rules,

      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      // O TS já reporta redeclaração/uso antes da definição com mais precisão;
      // a versão base do core dá falso positivo em enums e sobrecargas.
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },

  {
    // Os testes usam globals do Vitest importados explicitamente, mas também
    // console para diagnóstico — não faz sentido cobrar no-console aqui.
    files: ['src/**/*.test.ts', 'src/test/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
])
