/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/internal",
  ],
  plugins: ["prefer-let"],
  rules: {
    "prefer-let/prefer-let": "error",
    "prefer-const": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^ignored",
        args: "after-used",
        ignoreRestSiblings: true,
      },
    ],
  },
};
