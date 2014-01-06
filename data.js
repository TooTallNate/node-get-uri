
/**
 * Module dependencies.
 */

var Readable = require('stream').Readable;
var dataUriToBuffer = require('data-uri-to-buffer');

/**
 * Module exports.
 */

module.exports = get;

/**
 * Returns a Readable stream from a "data:" URI.
 *
 * @api protected
 */

function get (parsed, opts) {
  var uri = parsed.href;
  var buf = dataUriToBuffer(uri, opts);
  var rs = new Readable();
  rs._read = read(buf);
  return rs;
}

/**
 * Function that returns a Readable `_read` function implementation.
 *
 * @api private
 */

function read (buf) {
  return function (n) {
    this.push(buf);
    this.push(null);
    buf = null;
  };
}
