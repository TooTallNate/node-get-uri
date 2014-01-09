
/**
 * Module dependencies.
 */

var getUri = require('../');
var assert = require('assert');
var toBuffer = require('suckstream');

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
        toBuffer(rs, function (err, buf) {
          if (err) return done(err);
          assert.equal('Hello, World!', buf.toString());
          done();
        });
      });
    });

    it('should work for base64-encoded data', function (done) {
      getUri('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D', function (err, rs) {
        if (err) return done(err);
        toBuffer(rs, function (err, buf) {
          if (err) return done(err);
          assert.equal('Hello, World!', buf.toString());
          done();
        });
      });
    });

  });

});
