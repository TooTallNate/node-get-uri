
/**
 * Module dependencies.
 */

var inherits = require('util').inherits;

/**
 * Module exports.
 */

module.exports = NotFoundError;

/**
 * Error subclass to use when the source has not been modified.
 *
 * @param {String} message optional "message" property to set
 * @api protected
 */

function NotFoundError (message) {
  this.name = 'NotFoundError';
  this.code = 'ENOTFOUND';
  this.message = message || 'File does not exist at the specified endpoint';
  Error.captureStackTrace(this, NotFoundError);
}

inherits(NotFoundError, Error);
