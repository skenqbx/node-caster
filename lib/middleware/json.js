// Copyright (c) 2012 Malte-Thorben Bruns <skenqbx@gmail.com>

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
'use strict';


function jsonMiddleware() {

  function tx(message, next) {
    if (Buffer.isBuffer(message)) {
      return next(null, message);
    }

    var json;
    try {
      json = JSON.stringify(message);
    } catch (err) {
      return next(err, null);
    }
    next(null, new Buffer(json, 'utf8'));
  }

  function rx(message, remote, next) {
    var json;
    try {
      json = JSON.parse(message.toString('utf8'));
    } catch (err) {
      return next(null, message);
    }
    next(null, json);
  }

  return {name: 'json', tx: tx, rx: rx};
}
module.exports = jsonMiddleware;
