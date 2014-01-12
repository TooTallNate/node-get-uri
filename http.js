
/**
 * Module dependencies.
 */

var http = require('http');
var extend = require('extend');
var NotFoundError = require('./notfound');
var NotModifiedError = require('./notmodified');
var debug = require('debug')('get-uri:http');

/**
 * Module exports.
 */

module.exports = get;

/**
 * Returns a Readable stream from an "http:" URI.
 *
 * @api protected
 */

function get (parsed, opts, fn) {

  var cache = opts.cache;
  var options = extend({}, opts, parsed);

  var mod;
  if (opts.http) {
    // the `https` module passed in from the "http.js" file
    mod = opts.http;
    delete opts.http;
    debug('using secure `https` core module');
  } else {
    mod = http;
    debug('using `http` core module');
  }

  var req = mod.get(options);
  req.once('error', onerror);
  req.once('response', onresponse);

  function onerror (err) {
    debug('http.Request "error" event: %s', err.stack || err);
    fn(err);
  }

  function onresponse (res) {
    var err = null;

    var code = res.statusCode;
    debug('got %d response status code', code);

    // any 2xx response is a "success" code
    var success = 2 == (code / 100 | 0);

    if (!success) {
      if (304 == code) {
        err = new NotModifiedError();
      } else if (404 == code) {
        err = new NotFoundError();
      } else {
        // other HTTP-level error
        var message = http.STATUS_CODES[code];
        err = new Error(message);
        err.statusCode = code;
        err.code = code;
      }
    }

    fn(err, res);
  }
}
