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
		throw new TypeError('that file path was wrong: '+err);
	})

	if (typeof arguments[1] != 'object'){
		throw new TypeError('pass an object instead of: '+opts);
	} else {

		if(Object.keys(opts).length < 1){
			//thanks for nothing
			return fs.createReadStream(arguments[0].path)
		} else {
			//and we're ready to pipe
			return fs.createReadStream(arguments[0].path,opts)
		}

	}
}
