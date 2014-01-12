
/**
 * Module dependencies.
 */

var fs = require('fs');
var st = require('st');
var ftpd = require('ftpd');
var http = require('http');
var https = require('https');
var getUri = require('../');
var assert = require('assert');
var streamToArray = require('stream-to-array');

describe('get-uri', function () {

  describe('bad input', function () {
    it('should throw a TypeError when callback function is given', function () {
      assert.throws(function () {
        getUri();
      }, TypeError);
    });

    it('should return a TypeError when no URI is given', function (done) {
      getUri(null, function (err) {
        assert.equal(err.name, 'TypeError');
        done();
      });
    });
  });

  describe('"data:" protocol', function () {

    var cache;

    it('should work for URL-encoded data', function (done) {
      getUri('data:,Hello%2C%20World!', function (err, rs) {
        if (err) return done(err);
        cache = rs;
        streamToArray(rs, function (err, array) {
          if (err) return done(err);
          var buf = Buffer.concat(array);
          assert.equal('Hello, World!', buf.toString());
          done();
        });
      });
    });

    it('should work for base64-encoded data', function (done) {
      getUri('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D', function (err, rs) {
        if (err) return done(err);
        streamToArray(rs, function (err, array) {
          if (err) return done(err);
          var buf = Buffer.concat(array);
          assert.equal('Hello, World!', buf.toString());
          done();
        });
      });
    });

    it('should return ENOTMODIFIED for the same URI with `cache`', function (done) {
      getUri('data:,Hello%2C%20World!', { cache: cache }, function (err, rs) {
        assert(err);
        assert.equal('ENOTMODIFIED', err.code);
        done();
      });
    });

  });

  describe('"file:" protocol', function () {

    var cache;

    it('should work for local files', function (done) {
      var uri = 'file://' + __filename;
      fs.readFile(__filename, 'utf8', function (err, real) {
        if (err) return done(err);
        getUri(uri, function (err, rs) {
          if (err) return done(err);
          cache = rs;
          streamToArray(rs, function (err, array) {
            if (err) return done(err);
            var str = Buffer.concat(array).toString('utf8');
            assert.equal(str, real);
            done();
          });
        });
      });
    });

    it('should return ENOTFOUND for bad filenames', function (done) {
      var uri = 'file://' + __filename + 'does-not-exist';
      getUri(uri, function (err, rs) {
        assert(err);
        assert.equal('ENOTFOUND', err.code);
        done();
      });
    });

    it('should return ENOTMODIFIED for the same URI with `cache`', function (done) {
      var uri = 'file://' + __filename;
      getUri(uri, { cache: cache }, function (err, rs) {
        assert(err);
        assert.equal('ENOTMODIFIED', err.code);
        done();
      });
    });

  });

  describe('"ftp:" protocol', function () {

    var port;
    var cache;
    var server;

    before(function (done) {
      var options = {
        logLevel: -1,
        getInitialCwd: function (socket, fn) {
          fn(null, '/');
        },
        getRoot: function (socket) {
          return __dirname;
        }
      };

      var host = '127.0.0.1';
      server = new ftpd.FtpServer(host, options);

      server.on('client:connected', function(conn){
        var username;
        conn.on('command:user', function(user, success, failure) {
          username = user;
          success();
        });
        conn.on('command:pass', function(pass, success, failure){
          success(username);
        });
      });

      server.listen(0, function () {
        port = server.server.address().port;
        done();
      });
    });

    after(function (done) {
      server.server.once('close', function () {
        done();
      });
      server.server.close();
    });

    it('should work for ftp endpoints', function (done) {
      var uri = 'ftp://127.0.0.1:' + port + '/test.js';
      fs.readFile(__filename, 'utf8', function (err, real) {
        if (err) return done(err);
        getUri(uri, function (err, rs) {
          if (err) return done(err);
          cache = rs;
          streamToArray(rs, function (err, array) {
            if (err) return done(err);
            var str = Buffer.concat(array).toString('utf8');
            assert.equal(str, real);
            done();
          });
        });
      });
    });

    it('should return ENOTFOUND for bad filenames', function (done) {
      var uri = 'ftp://127.0.0.1:' + port + '/does-not-exist';
      getUri(uri, function (err, rs) {
        assert(err);
        assert.equal('ENOTFOUND', err.code);
        done();
      });
    });

    it('should return ENOTMODIFIED for the same URI with `cache`', function (done) {
      var uri = 'ftp://127.0.0.1:' + port + '/test.js';
      getUri(uri, { cache: cache }, function (err, rs) {
        assert(err);
        assert.equal('ENOTMODIFIED', err.code);
        done();
      });
    });

  });

  describe('"http:" protocol', function () {

    var port;
    var cache;
    var server;

    before(function (done) {
      // setup target HTTP server
      server = http.createServer(st(__dirname));
      server.listen(function () {
        port = server.address().port;
        done();
      });
    });

    after(function (done) {
      server.once('close', function () { done(); });
      server.close();
    });

    it('should work for HTTP endpoints', function (done) {

      var uri = 'http://127.0.0.1:' + port + '/test.js';
      fs.readFile(__filename, 'utf8', function (err, real) {
        if (err) return done(err);
        getUri(uri, function (err, rs) {
          if (err) return done(err);
          cache = rs;
          streamToArray(rs, function (err, array) {
            if (err) return done(err);
            var str = Buffer.concat(array).toString('utf8');
            assert.equal(str, real);
            done();
          });
        });
      });
    });

    it('should return ENOTFOUND for bad filenames', function (done) {
      var uri = 'http://127.0.0.1:' + port + '/does-not-exist';
      getUri(uri, function (err, rs) {
        assert(err);
        assert.equal('ENOTFOUND', err.code);
        done();
      });
    });

    it('should return ENOTMODIFIED for the same URI with `cache`', function (done) {
      var uri = 'http://127.0.0.1:' + port + '/test.js';
      getUri(uri, { cache: cache }, function (err, rs) {
        assert(err);
        assert.equal('ENOTMODIFIED', err.code);
        done();
      });
    });

  });

  describe('"https:" protocol', function () {

    var port;
    var cache;
    var server;

    before(function (done) {
      // setup target HTTPS server
      var options = {
        key: fs.readFileSync(__dirname + '/server.key'),
        cert: fs.readFileSync(__dirname + '/server.crt')
      };
      server = https.createServer(options, st(__dirname));
      server.listen(function () {
        port = server.address().port;
        done();
      });
    });

    after(function (done) {
      server.once('close', function () { done(); });
      server.close();
    });

    it('should work for HTTPS endpoints', function (done) {

      var uri = 'https://127.0.0.1:' + port + '/test.js';
      fs.readFile(__filename, 'utf8', function (err, real) {
        if (err) return done(err);
        getUri(uri, { rejectUnauthorized: false }, function (err, rs) {
          if (err) return done(err);
          cache = rs;
          streamToArray(rs, function (err, array) {
            if (err) return done(err);
            var str = Buffer.concat(array).toString('utf8');
            assert.equal(str, real);
            done();
          });
        });
      });
    });

    it('should return ENOTFOUND for bad filenames', function (done) {
      var uri = 'https://127.0.0.1:' + port + '/does-not-exist';
      getUri(uri, { rejectUnauthorized: false }, function (err, rs) {
        assert(err);
        assert.equal('ENOTFOUND', err.code);
        done();
      });
    });

    it('should return ENOTMODIFIED for the same URI with `cache`', function (done) {
      var uri = 'https://127.0.0.1:' + port + '/test.js';
      getUri(uri, { cache: cache, rejectUnauthorized: false }, function (err, rs) {
        assert(err);
        assert.equal('ENOTMODIFIED', err.code);
        done();
      });
    });

  });

});
