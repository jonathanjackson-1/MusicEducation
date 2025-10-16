const baseConfig = require("./base.cjs");

module.exports = {
  ...baseConfig,
  env: {
    ...baseConfig.env,
    browser: true
  },
  plugins: [...baseConfig.plugins, "react", "react-hooks", "jsx-a11y"],
  extends: [
    ...baseConfig.extends,
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  settings: {
    ...baseConfig.settings,
    react: {
      version: "detect"
    }
  },
  rules: {
    ...baseConfig.rules,
    "react/react-in-jsx-scope": "off"
  }
};
