
/**
 * Module dependencies.
 */

var PassThrough = require('stream').PassThrough;
var FTP = require('ftp');

/**
 * Module exports.
 */

module.exports = get;

/**
 * Returns a Readable stream from a "ftp:" URI.
 *
 * @api protected
 */

function get (parsed, opts) {
  var client = new FTP();
  var filepath = parsed.pathname;
  var passthrough = new PassThrough();

  client.on('ready', onready);

  function onready () {
    client.get(filepath, onfile);
  }

  function onfile (err, stream) {
    if (err) return passthrough.emit('error', err);
    stream.once('end', onend);
    stream.pipe(passthrough);
  }

  function onend () {
    console.error('stream "end" event');
    client.end();
  }

  opts.host = parsed.hostname || parsed.host || 'localhost';
  opts.port = parseInt(parsed.port, 10) || 21;
  // TODO: add auth
  client.connect(opts);

  return passthrough;
}
