/**
 * Module dependencies.
 */

var fs = require('fs')

/**
 * Module exports.
 */

module.exports = get;

/**
 * 
 */

function get (parsed, opts) {

	//verify path with thrown err
	fs.stat(parsed.path,function(err){
		 if(err) {
		 	console.log('incorrect file path')
		 	throw err;
		 }
	})

	if (typeof arguments[1] != 'object'){
		throw new TypeError('pass an object instead of: '+opts);
	} else {

		if(Object.keys(opts).length < 1){
			return fs.createReadStream(arguments[0].path)
		} else {
			return fs.createReadStream(arguments[0].path,opts)
		}

	}
}
