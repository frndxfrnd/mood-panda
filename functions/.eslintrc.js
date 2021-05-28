module.exports = {
  root: true,
  env: {
    es6: true,
    node: true
  },
  extends: [
    'standard-with-typescript'
  ],
  parserOptions: {
    project: 'tsconfig.json'
  },
  rules: {
    '@typescript-eslint/strict-boolean-expressions': 'off'
  }
}
