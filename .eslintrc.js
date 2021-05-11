module.exports = {
  parser: '@babel/eslint-parser',
  extends: [
    'standard',
    'standard-jsx'
  ],
  rules: {
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off'
  }
}
