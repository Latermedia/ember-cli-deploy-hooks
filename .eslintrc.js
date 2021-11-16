module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  extends: ["eslint:recommended", "plugin:node/recommended"],
  env: {
    node: true,
    mocha: true
  },
};
