get-uri
=======
### Returns a ReadStream from a URI string
[![Build Status](https://travis-ci.org/TooTallNate/node-get-uri.png?branch=master)](https://travis-ci.org/TooTallNate/node-get-uri)

This high-level module accepts a URI string and returns a `Readable` stream
instance. There is built-in support for a variety of "protocols", and it's
easily extensible with more.

Installation
------------

Install with `npm`:

``` bash
$ npm install get-uri
```


Example
-------

``` js
var getUri = require('get-uri');

// maps to a `fs.ReadStream` instance
getUri('file:///Users/nrajlich/wat.json', function (err, rs) {
  if (err) throw err;
  rs.pipe(process.stdout);
});
```


Cacheability
------------

When calling `getUri()` with the same URI multiple times, the `get-uri` module
supports sending an indicator that the remote resource has not been modified
since the last time it has been retreived from that node process.

To do this, pass in a `cache` option to the "options object" argument
with the value set to the `stream.Readable` instance that was previously
returned. If the remote resource has not been changed since the last call for
that same URI, then a `NotModifiedError` instance will be returned with it's
`code` property set to `"ENOTMODIFIED"`.

When the `"ENOTMODIFIED"` error occurs, then you can safely re-use the
results from the previous `getUri()` call for that same URI.


API
---

### getUri(String uri[, Object options]) → stream.Readable

A `uri` String is required. An optional `options` object may be passed in:

 - `cache` - A `stream.Readable` instance from a previous call to `getUri()` with the same URI. If this option is passed in, and the destination endpoint has not been modified, then an `ENOTMODIFIED` error is returned

Any other options passed in to the `options` object will be passed through
to the low-level connection creation functions (`http.get()`, `ftp.connect()`,
etc).

License
-------

(The MIT License)

Copyright (c) 2014 Nathan Rajlich &lt;nathan@tootallnate.net&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
