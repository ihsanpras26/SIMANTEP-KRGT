import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// ESLint's core unused-variable rule does not count JSX tag references.
// Mark both <Component /> and member tags such as <motion.div /> as usage.
const jsxUsage = {
  rules: {
    'uses-vars': {
      create(context) {
        return {
          JSXOpeningElement(node) {
            let name = node.name
            while (name.type === 'JSXMemberExpression') name = name.object
            if (name.type === 'JSXIdentifier' && (/^[A-Z]/.test(name.name) || node.name.type === 'JSXMemberExpression')) {
              context.sourceCode.markVariableAsUsed(name.name, node)
            }
          },
        }
      },
    },
  },
}

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
      }],
    },
  },
  {
    files: ['*.js', 'scripts/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [reactHooks.configs['recommended-latest'], reactRefresh.configs.vite],
    plugins: { jsx: jsxUsage },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: { 'jsx/uses-vars': 'error' },
  },
])
