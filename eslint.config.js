// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

const paddingRules = {
    'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        { blankLine: 'any', prev: ['case', 'default'], next: 'break' },
        { blankLine: 'any', prev: 'case', next: 'case' },
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: 'block', next: '*' },
        { blankLine: 'always', prev: '*', next: 'block' },
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: 'block-like' },
        { blankLine: 'always', prev: ['import'], next: ['const', 'let', 'var'] }
    ]
};

export default defineConfig([
    {
        ignores: ['**/dist/**', '**/node_modules/**', '**/.angular/**']
    },
    {
        files: ['**/*.ts'],
        extends: [
            eslint.configs.recommended,
            tseslint.configs.recommended,
            angular.configs.tsRecommended,
            eslintConfigPrettier
        ],
        plugins: {
            prettier: eslintPluginPrettier
        },
        processor: angular.processInlineTemplates,
        rules: {
            ...paddingRules,
            'prettier/prettier': 'warn',
            '@angular-eslint/component-selector': [
                'error',
                {
                    type: ['element', 'attribute'],
                    prefix: 'app',
                    style: 'kebab-case'
                }
            ],
            '@angular-eslint/directive-selector': [
                'error',
                {
                    type: 'attribute',
                    prefix: 'app',
                    style: 'camelCase'
                }
            ],
            '@angular-eslint/component-class-suffix': [
                'error',
                {
                    suffixes: ['']
                }
            ],
            '@angular-eslint/no-host-metadata-property': 'off',
            '@angular-eslint/no-output-on-prefix': 'off',
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            'arrow-body-style': ['error', 'as-needed'],
            curly: 'off',
            '@typescript-eslint/member-ordering': [
                'error',
                {
                    default: ['public-static-field', 'static-field', 'instance-field', 'public-instance-method', 'public-static-field']
                }
            ],
            'no-console': 'off',
            'prefer-const': 'off'
        }
    },
    {
        files: ['**/*.html'],
        extends: [angular.configs.templateRecommended, eslintConfigPrettier],
        rules: {
            '@angular-eslint/template/eqeqeq': [
                'error',
                {
                    allowNullOrUndefined: true
                }
            ]
        }
    },
    {
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
        rules: {
            'arrow-body-style': 'off'
        }
    }
]);
