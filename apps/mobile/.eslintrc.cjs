module.exports = {
  root: true,
  extends: ["@soundstudio/config/eslint/react"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"]
  }
};
