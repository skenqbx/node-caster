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

var createCaster = require('./lib').create;

var bindCount = 3;
var msgCount = 9;
var testMessage = new Buffer("Some bytes");
var options = {
  port: 43214,
  loopback: true
};

var casterA, casterB, casterC;

function onMessage(message) {
  if (message.toString() !== testMessage.toString()) {
    throw new Error('Received corrupt message');
  }
  if (--msgCount === 0) {
    casterA.close();
    casterB.close();
    casterC.close();
    console.log('OK')
  }
}

casterA = createCaster(options, onMessage);
casterB = createCaster(options, onMessage);
casterC = createCaster(options, onMessage);

function onBind(err) {
  if (err) {
    throw err;
  } else if (--bindCount === 0) {
    casterA.send(testMessage);
    casterB.send(testMessage);
    casterC.send(testMessage);
  }
}

casterA.bind(onBind);
casterB.bind(onBind);
casterC.bind(onBind);
