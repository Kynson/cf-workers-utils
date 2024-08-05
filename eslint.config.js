import generateESLintConfigurations from '@kynsonszetau/lint/typescript';

/** @type { import('eslint').Linter.Config } */
export default [
  ...generateESLintConfigurations(
    ['{src,tests}/**/*.ts'],
    new URL(import.meta.url).pathname,
    {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  ),
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
];
