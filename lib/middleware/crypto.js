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
 * @param {Object.<string, *>=} opt_options Optional middleware options.
 */
function cryptoMiddleware(opt_options) {
  opt_options = opt_options || {};
  var key = new Buffer(opt_options.key || '09dfDim3ZqzXvfkun6', 'binary');
  var algorithm = opt_options.algorithm || 'aes256';

  function tx(message, next) {
    var cipher = crypto.createCipher(algorithm, key);
    var msg = cipher.update(message.toString('binary'), 'binary', 'binary');
    msg += cipher.final('binary');
    next(null, new Buffer(msg, 'binary'));
  }

  function rx(message, remote, next) {
    var decipher = crypto.createDecipher(algorithm, key);
    var msg = decipher.update(message.toString('binary'), 'binary', 'binary');
    msg += decipher.final('binary');
    next(null, new Buffer(msg, 'binary'));
  }

  return {name: 'crypto', tx: tx, rx: rx};
}
module.exports = cryptoMiddleware;
