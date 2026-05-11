import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import jestPlugin from 'eslint-plugin-jest';
import prettier from 'eslint-config-prettier';

import babelParser from '@babel/eslint-parser';

export default [
  {
    ignores: [
      'frontend/dist/**',
      'electron/build/**',
      'electron/out/**',
      '**/node_modules/**',
    ],
  },
  js.configs.recommended,
  prettier,

  // Frontend (React/Vite)
  {
    files: ['frontend/src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false, // Allows JSX without .babelrc
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      ...Object.fromEntries(
        Object.entries(jsxA11y.flatConfigs.recommended.rules)
          .map(([rule, level]) => {
            if (Array.isArray(level)) {
              const severity = (level[0] === 'error' || level[0] === 2) ? 'warn' : level[0];
              return [rule, [severity, ...level.slice(1)]];
            }
            return [rule, (level === 'error' || level === 2) ? 'warn' : level];
          })
      ),
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      indent: ['error', 2],
    },
  },

  // Electron (Node.js)
  {
    files: ['electron/**/*.js'],
    ignores: ['electron/build/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        console: true,
      },
    },
    rules: {
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
    },
  },

  // Electron CJS (Node.js)
  {
    files: ['electron/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
    },
  },

  // Tests (Jest)
  {
    files: ['**/__tests__/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        jest: true,
        describe: true,
        test: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
      },
    },
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
    },
  },
];
