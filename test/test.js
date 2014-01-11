
/**
 * Module dependencies.
 */

var fs = require('fs');
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

    it('should work for URL-encoded data', function (done) {
      getUri('data:,Hello%2C%20World!', function (err, rs) {
        if (err) return done(err);
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

  });

  describe('"file:" protocol', function () {

    it('should work for local files', function (done) {
      var uri = 'file://' + __filename;
      fs.readFile(__filename, 'utf8', function (err, real) {
        if (err) return done(err);
        getUri(uri, function (err, rs) {
          if (err) return done(err);
          streamToArray(rs, function (err, array) {
            if (err) return done(err);
            var str = Buffer.concat(array).toString('utf8');
            assert.equal(str, real);
            done();
          });
        });
      });
    });

  });

  describe('"ftp:" protocol', function () {

    it('should work for ftp endpoints', function (done) {
      var uri = 'ftp://ftp.kernel.org/pub/site/README';
      getUri(uri, function (err, rs) {
        if (err) return done(err);
        streamToArray(rs, function (err, array) {
          if (err) return done(err);
          var buf = Buffer.concat(array);
          assert(buf.length > 0);
          done();
        });
      });
    });

  });

});
