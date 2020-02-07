/**
 * Module dependencies.
 */

let fs = require('fs');
let ftpd = require('ftpd');
let path = require('path');
let assert = require('assert');
let streamToArray = require('stream-to-array');
let getUri = require('../');

describe('get-uri', function() {
	describe('"ftp:" protocol', function() {
		let port;
		let cache;
		let server;

		before(function(done) {
			let options = {
				logLevel: -1,
				getInitialCwd(socket, fn) {
					fn(null, '/');
				},
				getRoot(socket) {
					return __dirname;
				}
			};

			let host = '127.0.0.1';
			server = new ftpd.FtpServer(host, options);

			server.on('client:connected', function(conn) {
				let username;
				conn.on('command:user', function(user, success, failure) {
					username = user;
					success();
				});
				conn.on('command:pass', function(pass, success, failure) {
					success(username);
				});
			});

			server.listen(0, function() {
				port = server.server.address().port;
				done();
			});
		});

		after(function(done) {
			server.server.once('close', function() {
				done();
			});
			server.server.close();
		});

		it('should work for ftp endpoints', function(done) {
			let uri = `ftp://127.0.0.1:${port}/${path.basename(__filename)}`;
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
			let uri = `ftp://127.0.0.1:${port}/does-not-exist`;
			getUri(uri, function(err, rs) {
				assert(err);
				assert.equal('ENOTFOUND', err.code);
				done();
			});
		});

		it('should return ENOTMODIFIED for the same URI with `cache`', function(done) {
			let uri = `ftp://127.0.0.1:${port}/${path.basename(__filename)}`;
			getUri(uri, { cache }, function(err, rs) {
				assert(err);
				assert.equal('ENOTMODIFIED', err.code);
				done();
			});
		});
	});
});
