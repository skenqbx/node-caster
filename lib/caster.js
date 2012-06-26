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
var util = require('util');
var events = require('events');
var dgram = require('dgram');
var net = require('net');



/**
 * @param {Object.<string, *>=} opt_options Multicast configuration object.
 * @constructor
 * @extends {events.EventEmitter}
 */
function Caster(opt_options) {
  events.EventEmitter.call(this);

  opt_options = opt_options || {};
  this.multicast = opt_options.multicast || '224.0.0.42';
  this.address = opt_options.address || '0.0.0.0';
  this.port = opt_options.port || null;
  this.addressType = net.isIP(this.address);
  this.loopback =
      typeof opt_options.loopback === 'boolean' ? opt_options.loopback : true;
  this.ttl = opt_options.ttl || 64;
  this.socket = null;

  this._middleware = {};
  this._rx = [];
  this._tx = [];
}
util.inherits(Caster, events.EventEmitter);
module.exports = Caster;


/**
 * Add middleware.
 */
Caster.prototype.use = function(middleware) {
  if (!middleware.name) {
    throw new Error('Middleware name not set');
  }

  if (middleware.rx && typeof middleware.rx !== 'function') {
    throw new Error('middleware.rx is not a function');
  }

  if (middleware.tx && typeof middleware.tx !== 'function') {
    throw new Error('middleware.tx is not a function');
  }

  if (!middleware.rx && !middleware.tx) {
    throw new Error('middleware has no functionality');
  }

  if (this._middleware[middleware.name]) {
    throw new Error('middleware already in use');
  }

  this._middleware[middleware.name] = middleware;

  if (middleware.rx) {
    this._rx.unshift(middleware.rx);
  }

  if (middleware.tx) {
    this._tx.push(middleware.tx);
  }
};


/**
 * Enable the multicast udp socket.
 * @param {function(Error)} opt_callback An optional callback.
 */
Caster.prototype.bind = function(opt_callback) {
  var self = this;
  var socket = dgram.createSocket('udp' + this.addressType);

  opt_callback = opt_callback || function(err) {
    if (err) {
      self.emit('error', err);
    }
  };

  /**
   * @private
   */
  function onMessage(message, remote) {
    var i = -1;
    var stack = self._rx;
    var len = stack.length;

    /**
     * @private
     */
    function next(err, msg) {
      if (err) {
        self.emit('error', err);
      } else if (++i < len) {
        stack[i](msg, remote, next);
      } else {
        self.emit('message', msg, remote);
      }
    }
    next(null, message);
  }

  /**
   * @private
   */
  function bindHandler(err) {
    if (err) {
      socket.removeListener('listening', bindHandler);
      opt_callback(err);
    } else {
      socket.removeListener('error', bindHandler);
      socket.on('message', onMessage);
      socket.on('error', self.emit.bind(self, 'error'));
      // configure multicast
      socket.setMulticastTTL(self.ttl);
      socket.setMulticastLoopback(self.loopback);
      socket.addMembership(self.multicast, self.address);
      // update references
      self.port = socket.address().port;
      self.socket = socket;
      opt_callback(null);
    }
  }
  socket.once('listening', bindHandler);
  socket.once('error', bindHandler);

  socket.bind(this.port, this.address);
};


/**
 * @param {Buffer} message The message to be send.
 * @param {function(Error, Number)} opt_callback An optional callback.
 */
Caster.prototype.send = function(message, opt_callback) {
  var self = this;

  opt_callback = opt_callback || function(err) {
    if (err) {
      self.emit('error', err);
    }
  };

  var i = -1;
  var stack = this._tx;
  var len = stack.length;

  /**
   * @private
   */
  function next(err, msg) {
    if (err) {
      self.emit('error', err);
    } else if (++i < len) {
      stack[i](msg, next);
    } else {
      self.socket.send(msg, 0, msg.length,
          self.port, self.multicast, opt_callback);
    }
  }
  next(null, message);
};


/**
 * Close the socket.
 * @param {function(Error, Number)} opt_callback An optional callback.
 */
Caster.prototype.close = function(opt_callback) {
  if (this.socket) {
    this.socket.dropMembership(this.multicast, this.address);
    this.socket = null;
  }
  if (opt_callback) {
    opt_callback();
  }
};
