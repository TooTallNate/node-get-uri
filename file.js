
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

  var fd;
  var cache = opts.cache;

  // same as in fs.ReadStream's constructor
  var flags = opts.hasOwnProperty('flags') ? options.flags : 'r';
  var mode = opts.hasOwnProperty('mode') ? options.mode : 438; /*=0666*/

  // convert URI → Path
  // TODO: will probably need better Windows support for this someday (see #3)
  var filepath = path.normalize(decodeURIComponent(parsed.pathname));
  debug('normalized pathname: %j', filepath);

  // open() first to get a fd and ensure that the file exists
  fs.open(filepath, flags, mode, onopen);

  function onopen (err, _fd) {
    if (err) {
      if ('ENOENT' == err.code) {
        err = new NotFoundError();
      }
      return fn(err);
    }
    fd = _fd;

    // now fstat() to check the `mtime` and store the stat object for the cache
    fs.fstat(fd, onstat);
  }

  function onstat (err, stat) {
    if (err) return fn(err);

    // if a `cache` was provided, check if the file has not been modified
    if (cache && cache.stat && stat && isNotModified(cache.stat, stat)) {
      return fn(new NotModifiedError());
    }

    // `fs.ReadStream` takes care of calling `fs.close()` on the
    // fd after it's done reading
    opts.fd = fd;
    var rs = fs.createReadStream(null, opts);
    rs.stat = stat;

    fn(null, rs);
  }

  // returns `true` if the `mtime` of the 2 stat objects are equal
  function isNotModified (prev, curr) {
    return +prev.mtime == +curr.mtime;
  }
}
