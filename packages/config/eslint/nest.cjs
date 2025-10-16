const baseConfig = require("./base.cjs");

module.exports = {
  ...baseConfig,
  env: {
    ...baseConfig.env,
    node: true
  },
  overrides: [
    {
      files: ["*.spec.ts", "*.test.ts"],
      env: {
        jest: true
      }
    }
  ]
};
