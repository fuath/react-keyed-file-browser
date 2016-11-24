var path = require('path');
var NodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/browser.jsx',
  output: {
    path: __dirname + '/dist',
    filename: 'react-keyed-file-browser.js',
    library: 'react-keyed-file-browser',
    libraryTarget: 'umd',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        loader: 'babel',
        query: {
          presets: [
            'react',
            'es2015',
            'stage-0',
          ],
        },
      },
    ],
  },
  externals: NodeExternals(),
};
