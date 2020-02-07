/**
 * Module dependencies.
 */

let assert = require('assert');
let streamToArray = require('stream-to-array');
let getUri = require('../');

describe('get-uri', function() {
	describe('"data:" protocol', function() {
		let cache;

		it('should work for URL-encoded data', function(done) {
			getUri('data:,Hello%2C%20World!', function(err, rs) {
				if (err) return done(err);
				cache = rs;
				streamToArray(rs, function(err, array) {
					if (err) return done(err);
					let buf = Buffer.concat(array);
					assert.equal('Hello, World!', buf.toString());
					done();
				});
			});
		});

		it('should work for base64-encoded data', function(done) {
			getUri('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D', function(
				err,
				rs
			) {
				if (err) return done(err);
				streamToArray(rs, function(err, array) {
					if (err) return done(err);
					let buf = Buffer.concat(array);
					assert.equal('Hello, World!', buf.toString());
					done();
				});
			});
		});

		it('should return ENOTMODIFIED for the same URI with `cache`', function(done) {
			getUri('data:,Hello%2C%20World!', { cache }, function(err, rs) {
				assert(err);
				assert.equal('ENOTMODIFIED', err.code);
				done();
			});
		});
	});
});
