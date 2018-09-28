const path = require('path');

module.exports = {
  entry: {
    entries: [
      './scripts/branchingScenario.js',
      './scripts/genericScreen.js',
      './scripts/libraryScreen.js',
      './scripts/scoring.js'
    ]
  },
  output: {
    filename: 'dist.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
};
