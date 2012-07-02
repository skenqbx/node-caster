// Copyright (c) 2012 Malte-Thorben Bruns <skenqbx@googlemail.com>

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// 'Software'), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/* enable ECMA-262 strict mode */
'use strict';

/* load node modules */
var crypto = require('crypto');


/**
 * @param {Object} opt_options
 */
function hashMiddleware(opt_options) {
  opt_options = opt_options || {};
  var secret = opt_options.secret || '9ve2cND;d3"Vs';
  var algorithm = opt_options.algorithm || 'sha1';

  function digest(data) {
    var hash = crypto.createHash(algorithm);
    hash.update(secret + data);
    return hash.digest('binary');
  }

  var length = digest('').length;

  function tx(message, next) {
    var hash = digest(message.toString('binary'));
    var buf = new Buffer(message.length + length);
    buf.write(hash, 0, length, 'binary');
    message.copy(buf, length, 0);
    next(null, buf);
  }

  function rx(message, remote, next) {
    var hash = digest(message.toString('binary', length));
    if (message.toString('binary', 0, length) !== hash) {
      return next(new Error('Hash does not match'), null);
    }
    next(null, message.slice(length));
  }

  return {name: 'hash', tx: tx, rx: rx};
}
module.exports = hashMiddleware;
