var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var config = {
  entry: [
    'webpack/hot/dev-server',
    './todo-demo.js'
  ],
  devServer: {
    contentBase: 'src/www',
    port: 3000,
    hot: true,
    inline: true,
    historyApiFallback: true,
    stats: 'errors-only'
  },
  devtool: '#source-map',
  output: {
    path: './build',
    filename: 'index.js',
    publicPath: '/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin()
  ],

  module: {
    preLoaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'eslint-loader',
        include: ["./src/js"],
        exclude: /node_modules/
      },
    ],
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loaders: ['react-hot', 'babel'],
        exclude: /node_modules/
      }
    ]
  },
  eslint: { configFile: '.eslintrc' }
};

module.exports = config;