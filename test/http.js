/**
 * Module dependencies.
 */

let fs = require('fs');
let st = require('st');
let path = require('path');
let http = require('http');
let assert = require('assert');
let streamToArray = require('stream-to-array');
let getUri = require('../');

describe('get-uri', function() {
	describe('"http:" protocol', function() {
		let port;
		let cache;
		let server;

		before(function(done) {
			// setup target HTTP server
			server = http.createServer(st(__dirname));
			server.listen(function() {
				port = server.address().port;
				done();
			});
		});

		after(function(done) {
			server.once('close', function() {
				done();
			});
			server.close();
		});

		it('should work for HTTP endpoints', function(done) {
			let uri = `http://127.0.0.1:${port}/${path.basename(__filename)}`;
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
			let uri = `http://127.0.0.1:${port}/does-not-exist`;
			getUri(uri, function(err, rs) {
				assert(err);
				assert.equal('ENOTFOUND', err.code);
				done();
			});
		});

		it('should return ENOTMODIFIED for the same URI with `cache`', function(done) {
			let uri = `http://127.0.0.1:${port}/${path.basename(__filename)}`;
			getUri(uri, { cache }, function(err, rs) {
				assert(err);
				assert.equal('ENOTMODIFIED', err.code);
				done();
			});
		});
	});
});
