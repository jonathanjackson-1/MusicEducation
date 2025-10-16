module.exports = {
  root: true,
  extends: ["@soundstudio/config/eslint/nest"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"]
  }
};
