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

describe('Node', function() {
  var caster = require('../lib');

  var options = {
    port: 43214
  };

  var nodeA = caster.createNode(options);
  var nodeB = caster.createNode(options);
  var nodeC = caster.createNode(options);

  describe('#up()', function() {
    it('node A', function(done) {
      nodeA.up(done);
    });
    it('node B', function(done) {
      nodeB.up(done);
    });
    it('node C', function(done) {
      nodeC.up(done);
    });
  });

  describe('#send()', function() {
    it('node A', function(done) {
      nodeA.send({hello: 'world'}, done);
    });
    it('node B', function(done) {
      nodeB.send({hello: 'world'}, done);
    });
    it('node C', function(done) {
      nodeC.send({hello: 'world'}, done);
    });

    describe('#onMessage()', function() {
      it('send 3x1 & receive 3x2', function(done) {
        var count = 0;

        function add() {
          if (++count === 6) {
            done();
          }
        }

        nodeA.on('message', add);
        nodeB.on('message', add);
        nodeC.on('message', add);
        nodeA.send({hello: 'world'});
        nodeB.send({hello: 'world'});
        nodeC.send({hello: 'world'});
      });
      after(function() {
        nodeA.removeAllListeners('message');
        nodeB.removeAllListeners('message');
        nodeC.removeAllListeners('message');
      });
    });
  });

  describe('#down()', function() {
    it('node A', function(done) {
      nodeA.down(done);
    });
    it('node B', function(done) {
      nodeB.down(done);
    });
    it('node C', function(done) {
      nodeC.down(done);
    });
  });
});
