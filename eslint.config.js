import generateESLintConfigurations from '@kynsonszetau/lint/typescript';

export default generateESLintConfigurations(
  ['{src,tests}/**/*.ts'],
  new URL(import.meta.url).pathname,
);
