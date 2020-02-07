/**
 * Module dependencies.
 */

let assert = require('assert');
let getUri = require('../');

describe('get-uri', function() {
	it('should return promise when no callback function is given', function(done) {
		const p = getUri();
		assert.equal(typeof p.then, 'function');
		p.catch(err => {
			assert.equal(err.name, 'TypeError');
			done();
		});
	});

	it('should return a TypeError when no URI is given', function(done) {
		getUri(null, function(err) {
			assert.equal(err.name, 'TypeError');
			done();
		});
	});
});
