module.exports = {
  root: true,
  extends: ["next", "next/core-web-vitals", "@soundstudio/config/eslint/react"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"]
  }
};
