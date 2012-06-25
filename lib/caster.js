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
 * @param {Object.<string, *>=} opt_ions Multicast configuration object.
 * @constructor
 * @extends {events.EventEmitter}
 */
function Caster(opt_ions) {
  events.EventEmitter.call(this);

  opt_ions = opt_ions || {};
  this.multicast = opt_ions.multicast || '224.0.0.42';
  this.address = opt_ions.address || '0.0.0.0';
  this.port = opt_ions.port || null;
  this.addressType = net.isIP(this.address);
  this.loopback =
      typeof opt_ions.loopback === 'boolean' ? opt_ions.loopback : true;
  this.ttl = opt_ions.ttl || 64;
  this.socket = null;

  this._transmit = [];
  this._receive = [];
}
util.inherits(Caster, events.EventEmitter);
module.exports = Caster;


/**
 * Add receive and/or transmit middleware.
 * @param {?function(Buffer, Object.<string, *>)} receive
 *    Middleware for incoming messages.
 * @param {?function(Buffer)} transmit
 *    Middleware for outgoing messages.
 */
Caster.prototype.use = function(receive, transmit) {
  if (receive) {
    if (typeof receive !== 'function') {
      throw new TypeError('receive has to be a function(message) or NULL');
    } else if (this._receive.indexOf(receive) !== -1) {
      throw new Error('receive middleware already in use');
    } else {
      this._receive.push(receive);
    }
  }
  if (transmit) {
    if (typeof transmit !== 'function') {
      throw new TypeError('transmit has to be a function(message) or NULL');
    } else if (this._transmit.indexOf(transmit) !== -1) {
      throw new Error('transmit middleware already in use');
    } else {
      this._transmit.push(transmit);
    }
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
    var receive = self._receive;
    var len = receive.length;

    /**
     * @private
     */
    function next(err, msg) {
      if (err) {
        self.emit('error', err);
      } else if (++i < len) {
        receive[i](msg, remote, next);
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
  var transmit = this._transmit;
  var len = transmit.length;

  /**
   * @private
   */
  function next(err, msg) {
    if (err) {
      self.emit('error', err);
    } else if (++i < len) {
      transmit[i](msg, next);
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
