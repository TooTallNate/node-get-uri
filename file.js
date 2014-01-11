
/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var NotFoundError = require('./notfound');
var NotModifiedError = require('./notmodified');
var debug = require('debug')('get-uri:file');

/**
 * Module exports.
 */

module.exports = get;

/**
 * Returns a `fs.ReadStream` instance from a "file:" URI.
 *
 * @api protected
 */

function get (parsed, opts, fn) {

  var filepath = path.normalize(parsed.pathname);
  debug('normalized pathname: %j', filepath);

  fs.stat(filepath, function (err){
    if(err) {
      throw new NotFoundError('file does not exist at the path specified:\n\n'+filepath+'\n');
    }
  });

  if (typeof opts == 'string'){
    // as a shorthand option, pass a string to the file API
    // a string in leiu of the options object sets encoding
    opts = { encoding: opts };
  }

  return fn(null, fs.createReadStream(filepath,opts));

}
