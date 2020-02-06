/**
 * Module dependencies.
 */

let fs = require('fs');
let assert = require('assert');
let streamToArray = require('stream-to-array');
let getUri = require('../');

describe('get-uri', function() {
	describe('"file:" protocol', function() {
		let cache;
		let sep = require('path').sep || '/';

		// TODO: move this out into a more full-featured module some day…
		// i.e. the inverse of https://github.com/TooTallNate/file-path-to-uri
		function path2uri(p) {
			if (sep == '\\') {
				// windows
				return `file:///${p}`;
			}
			// unix
			return `file://${p}`;
		}

		it('should work for local files', function(done) {
			let uri = path2uri(__filename);
			fs.readFile(__filename, 'utf8', function(err, real) {
				if (err) return done(err);
				getUri(uri, function(err, rs) {
					if (err) return done(err);
					cache = rs;
					streamToArray(rs, function(err, array) {
						if (err) return done(err);
						let str = Buffer.concat(array).toString('utf8');
						assert.equal(str, real);
						done();
					});
				});
			});
		});

		it('should return ENOTFOUND for bad filenames', function(done) {
			let uri = path2uri(`${__filename}does-not-exist`);
			getUri(uri, function(err, rs) {
				assert(err);
				assert.equal('ENOTFOUND', err.code);
				done();
			});
		});

		it('should return ENOTMODIFIED for the same URI with `cache`', function(done) {
			let uri = path2uri(__filename);
			getUri(uri, { cache }, function(err, rs) {
				assert(err);
				assert.equal('ENOTMODIFIED', err.code);
				done();
			});
		});
	});
});
