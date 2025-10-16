const path = require('path');
const js = require('../../packages/config/node_modules/@eslint/js');
const { FlatCompat } = require('../../packages/config/node_modules/@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: path.resolve(__dirname, '../../packages/config/node_modules'),
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

module.exports = [
  ...compat.extends(path.resolve(__dirname, '../../packages/config/eslint/react.cjs')),
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname
      }
    }
  }
];
