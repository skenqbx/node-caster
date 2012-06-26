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
  var method = 'sha1';

  function rx(message, remote, next) {
    var hash = crypto.createHash(method);
    hash.update(secret + message.toString('binary', 0, message.length - 20));
    hash = hash.digest('binary');
    if (message.toString('binary', message.length - 20) !== hash) {
      return next(new Error('Hash does not match'), null);
    }
    next(null, message);
  }

  function tx(message, next) {
    var hash = crypto.createHash(method);
    hash.update(secret + message.toString('binary'));
    hash = hash.digest('binary');
    var buf = new Buffer(message.length + hash.length);
    message.copy(buf, 0, 0, message.length);
    buf.write(hash, message.length, hash.length, 'binary');
    next(null, buf);
  }

  return {name: 'hash', rx: rx, tx: tx};
}
module.exports = hashMiddleware;
