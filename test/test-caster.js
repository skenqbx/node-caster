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

describe('Caster', function() {
  var caster = require('../lib');

  var options = {
    port: 43214
  };

  var socketA = caster.create(options);
  var socketB = caster.create(options);
  var socketC = caster.create(options);

  describe('#bind()', function() {
    it('socket A', function(done) {
      socketA.bind(done);
    });
    it('socket B', function(done) {
      socketB.bind(done);
    });
    it('socket C', function(done) {
      socketC.bind(done);
    });
  });

  describe('#send()', function() {
    it('socket A', function(done) {
      socketA.send(new Buffer('test message'), done);
    });
    it('socket B', function(done) {
      socketB.send(new Buffer('test message'), done);
    });
    it('socket C', function(done) {
      socketC.send(new Buffer('test message'), done);
    });

    describe('#onMessage()', function() {
      it('binary', function(done) {
        var count = 0;

        function add() {
          if (++count === 9) {
            done();
          }
        }

        socketA.on('message', add);
        socketB.on('message', add);
        socketC.on('message', add);
        socketA.send(new Buffer('test message'));
        socketB.send(new Buffer('test message'));
        socketC.send(new Buffer('test message'));
      });
      after(function() {
        socketA.removeAllListeners('message');
        socketB.removeAllListeners('message');
        socketC.removeAllListeners('message');
      });

      it('middleware.json', function(done) {
        var count = 0;

        function add() {
          if (++count === 9) {
            done();
          }
        }

        var middleware = caster.middleware.json();
        socketA.use(middleware);
        socketB.use(middleware);
        socketC.use(middleware);
        socketA.on('message', add);
        socketB.on('message', add);
        socketC.on('message', add);
        socketA.send({hello: 'world'});
        socketB.send({hello: 'world'});
        socketC.send({hello: 'world'});
      });

      after(function() {
        socketA.removeAllListeners('message');
        socketA._middleware = {};
        socketA._rx = [];
        socketA._tx = [];
        socketB.removeAllListeners('message');
        socketB._middleware = {};
        socketB._rx = [];
        socketB._tx = [];
        socketC.removeAllListeners('message');
        socketC._middleware = {};
        socketC._rx = [];
        socketC._tx = [];
      });
    });
  });
});
