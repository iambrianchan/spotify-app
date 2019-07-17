path = require('path');

module.exports = {
	entry: './public/src/js/index.js',
	module: {
		rules: [
			{ test: /\.css$/, use: [{ loader: 'style-loader' }, { loader: 'css-loader' }] },
			{
	        	test: /\.(js|jsx)$/,
	        	exclude: /node_modules/,
	        	use: ['babel-loader']
	        },
		]		
	},
	resolve: {
		extensions: ['.css', '.js', '.jsx'],
		modules: [
          'node_modules'
        ]
	},
	output: {
		path: __dirname + '/build',
		publicPath: '/',
		filename: '[name].bundle.js',
        chunkFilename: "[name].bundle.js"
	},
	devServer: {
		contentBase: './dist'
	}
}