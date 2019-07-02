path = require('path');

module.exports = {
	entry: './public/src/js/index.js',
	module: {
		rules: [
			{
	        	test: /\.(js|jsx)$/,
	        	exclude: /node_modules/,
	        	use: {
	          	loader: "babel-loader"
	        	}
	        }
		]		
	},
	resolve: {
		extensions: ['*', '.js', '.jsx']
	},
	output: {
		path: __dirname + '/build',
		publicPath: '/',
		filename: 'bundle.js'
	},
	devServer: {
		contentBase: './dist'
	}
}