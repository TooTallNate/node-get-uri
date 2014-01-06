
/**
 * Module dependencies.
 */

var parse = require('url').parse;

/**
 * Module exports.
 */

module.exports = getUri;

/**
 * Supported "protocols".
 */

getUri.protocols = {
  data: require('./data'),
  file: require('./file'),
  ftp: require('./ftp'),
  http: require('./http'),
  https: require('./https')
};

/**
 * Returns a ReadStream "gets" a URI from its 
 *
 * @param {String} uri URI to retrieve
 * @param {Object} opts optional "options" object
 * @return {ReadStream}
 * @api public
 */

function getUri (uri, opts, fn) {
  if (!uri) throw new TypeError('must pass in a URI to "get"');
  if ('function' == typeof opts) {
    fn = opts;
    opts = null;
  }

  var parsed = parse(uri);
  var protocol = parsed.protocol;
  if (!protocol) throw new TypeError('URI does not contain a protocol: ' + uri);

  // strip trailing :
  protocol = protocol.replace(/\:$/, '');

  var getter = getUri.protocols[protocol];

  if ('function' != typeof getter)
    throw new TypeError('unsupported protocol "' + protocol + '" specified in URI: ' + uri);

  return getter(parsed, opts || {}, fn);
}
