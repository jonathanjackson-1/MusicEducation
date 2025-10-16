module.exports = {
  root: true,
  extends: ["@soundstudio/config/eslint/base"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"]
  }
};
