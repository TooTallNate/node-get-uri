/**
 * Module dependencies.
 */

let fs = require('fs');
let st = require('st');
let path = require('path');
let https = require('https');
let assert = require('assert');
let streamToArray = require('stream-to-array');
let getUri = require('../');

describe('get-uri', function() {
	describe('"https:" protocol', function() {
		let port;
		let cache;
		let server;

		before(function(done) {
			// setup target HTTPS server
			let options = {
				key: fs.readFileSync(`${__dirname}/server.key`),
				cert: fs.readFileSync(`${__dirname}/server.crt`)
			};
			server = https.createServer(options, st(__dirname));
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

		it('should work for HTTPS endpoints', function(done) {
			let uri = `https://127.0.0.1:${port}/${path.basename(__filename)}`;
			fs.readFile(__filename, 'utf8', function(err, real) {
				if (err) return done(err);
				getUri(uri, { rejectUnauthorized: false }, function(err, rs) {
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
			let uri = `https://127.0.0.1:${port}/does-not-exist`;
			getUri(uri, { rejectUnauthorized: false }, function(err, rs) {
				assert(err);
				assert.equal('ENOTFOUND', err.code);
				done();
			});
		});

		it('should return ENOTMODIFIED for the same URI with `cache`', function(done) {
			let uri = `https://127.0.0.1:${port}/${path.basename(__filename)}`;
			getUri(uri, { cache, rejectUnauthorized: false }, function(
				err,
				rs
			) {
				assert(err);
				assert.equal('ENOTMODIFIED', err.code);
				done();
			});
		});
	});
});
