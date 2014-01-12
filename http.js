
/**
 * Module dependencies.
 */

var url = require('url');
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
  debug('GET %s', parsed.href);

  var cache = opts.cache;
  var options = extend({}, opts, parsed);

  if (null == opts.redirects) {
    // 5 redirects allowed by default
    opts.redirects = 5;
  }

  var mod;
  if (opts.http) {
    // the `https` module passed in from the "http.js" file
    mod = opts.http;
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
    //console.log(res.headers);

    // any 2xx response is a "success" code
    var type = (code / 100 | 0);

    if (2 != type) {
      if (304 == code) {
        err = new NotModifiedError();
      } else if (404 == code) {
        err = new NotFoundError();
      } else if (3 == type && res.headers.location && opts.redirects > 0) {
        var location = res.headers.location;
        debug('got a "redirect" status code with Location: %j', location);

        // flush this response - we're not going to use it
        res.resume();

        var newUri = url.resolve(parsed, location);
        debug('resolved redirect URL: %j', newUri);

        opts.redirects--;
        debug('%d more redirects allowed after this one', opts.redirects);

        return get(url.parse(newUri), opts, fn);
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
