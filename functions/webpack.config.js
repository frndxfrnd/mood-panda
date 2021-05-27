const path = require('path')

// @ts-ignore
const nodeExternals = require('webpack-node-externals')
const CopyPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs'
  },
  target: 'node',
  resolve: {
    extensions: ['.js']
  },
  externalsPresets: {
    node: true
  },
  externals: [nodeExternals()],
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { from: 'package(-lock)?.json' }
      ]
    })
  ]
}
