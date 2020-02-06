/**
 * Module dependencies.
 */

let fs = require('fs');
let st = require('st');
let path = require('path');
let http = require('http');
let https = require('https');
let assert = require('assert');
let streamToArray = require('stream-to-array');
let getUri = require('../');

describe('get-uri', function() {
	describe('http/https redirects', function() {
		let httpServer;
		let httpsServer;
		let httpPort;
		let httpsPort;

		before(function(done) {
			httpServer = http.createServer();
			httpServer.listen(function() {
				httpPort = httpServer.address().port;
				done();
			});
		});

		before(function(done) {
			let options = {
				key: fs.readFileSync(`${__dirname}/server.key`),
				cert: fs.readFileSync(`${__dirname}/server.crt`)
			};
			httpsServer = https.createServer(options);
			httpsServer.listen(function() {
				httpsPort = httpsServer.address().port;
				done();
			});
		});

		after(function(done) {
			httpsServer.once('close', function() {
				done();
			});
			httpsServer.close();
		});

		after(function(done) {
			httpServer.once('close', function() {
				done();
			});
			httpServer.close();
		});

		it('should handle http -> https redirect', function(done) {
			httpsServer.once('request', st(__dirname));
			httpServer.once('request', function(req, res) {
				res.writeHead(301, {
					Location: `https://127.0.0.1:${httpsPort}/${path.basename(
						__filename
					)}`
				});
				res.end('Moved');
			});
			let uri = `http://127.0.0.1:${httpPort}/${path.basename(
				__filename
			)}`;
			fs.readFile(__filename, 'utf8', function(err, real) {
				if (err) return done(err);
				getUri(uri, { rejectUnauthorized: false }, function(err, rs) {
					if (err) return done(err);
					streamToArray(rs, function(err, array) {
						if (err) return done(err);
						let str = Buffer.concat(array).toString('utf8');
						assert.equal(str, real);
						done();
					});
				});
			});
		});

		it('should handle https -> http redirect', function(done) {
			httpServer.once('request', st(__dirname));
			httpsServer.once('request', function(req, res) {
				res.writeHead(301, {
					Location: `http://127.0.0.1:${httpPort}/${path.basename(
						__filename
					)}`
				});
				res.end('Moved');
			});

			let uri = `http://127.0.0.1:${httpPort}/${path.basename(
				__filename
			)}`;
			fs.readFile(__filename, 'utf8', function(err, real) {
				if (err) return done(err);
				getUri(uri, function(err, rs) {
					if (err) return done(err);
					streamToArray(rs, function(err, array) {
						if (err) return done(err);
						let str = Buffer.concat(array).toString('utf8');
						assert.equal(str, real);
						done();
					});
				});
			});
		});
	});
});
