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

/* load modules */
var Caster = require('./caster');



/**
 * @param {Object.<string, *>=} opt_ions Multicast configuration object.
 * @constructor
 * @extends {events.EventEmitter}
 */
function Node(opt_ions) {
  events.EventEmitter.call(this);

  opt_ions = opt_ions || {};
  this.id = opt_ions.id || 'node' + Math.random().toString().substr(2);
  this.heartbeat = opt_ions.heartbeat || 1000;
  this.timeout = opt_ions.timeout || 2000;
  this._intervalId = null;
  this.expose = typeof opt_ions.expose === 'boolean' ? opt_ions.expose : true;

  this.nodes = {};
  this.caster = new Caster(opt_ions);
  var self = this;

  /**
   * @private
   */
  function onCasterMessage(message, rinfo) {
    try {
      message = JSON.parse(message);
    } catch (err) {
      self.emit('error', err);
      return;
    }

    if (!message.id) {
      self.emit('error', new Error('Invalid message'));
      return;
    }
    var id = message.id;
    if (message.id === self.id) {
      return;
    }

    if (self.nodes.hasOwnProperty(id)) {
      self.nodes[id].lastSeen = (new Date()).getTime();
    } else {
      self.nodes[id] = {
        id: id,
        address: rinfo.address,
        lastSeen: (new Date()).getTime()
      };
      self.emit('up', self.nodes[id]);
    }

    if (message.msg !== 'heartbeat') {
      self.emit('message', message.msg, self.nodes[id]);
    }
  }
  this._onCasterMessage = onCasterMessage;
  this._onCasterError = this.emit.bind(this, 'error');

  // register multicast event handlers
  this.caster.on('message', this._onCasterMessage);
  this.caster.on('error', this._onCasterError);

  // create getter for multicast address and port
  this.__defineGetter__('multicast', function() {
    return this.caster.multicast;
  });
  this.__defineGetter__('port', function() {
    return this.caster.port;
  });
}
util.inherits(Node, events.EventEmitter);
module.exports = Node;


/**
 * @param {String|Number|Object} message The message to send.
 * @param {function(Error, Number)} opt_callback
 *    An optional callback returning on error or when message is sent.
 */
Node.prototype.send = function(message, opt_callback) {
  var self = this;
  opt_callback = opt_callback || function(err) {
    if (err) {
      self.emit('error', err);
    }
  };

  try {
    message = JSON.stringify({id: this.id, msg: message});
  } catch (err) {
    return opt_callback(err);
  }
  this.caster.send(new Buffer(message, 'utf8'), opt_callback);
};


/**
 * @param {function(Error)} opt_callback
 *    An optional callback returning on error or when the node is up.
 */
Node.prototype.up = function(opt_callback) {
  var self = this;

  opt_callback = opt_callback || function(err) {
    if (err) {
      self.emit('error', err);
    }
  };

  /**
   * @private
   */
  function doHeartbeat() {
    self.send('heartbeat', function(err) {
      var i, keys = Object.keys(self.nodes);
      var length = keys.length;
      var low = (new Date()).getTime() - self.timeout;

      if (length > 0) {
        for (i = 0; i < length; ++i) {
          if (self.nodes[keys[i]].lastSeen < low) {
            self.emit('down', self.nodes[keys[i]]);
            delete self.nodes[keys[i]];
          }
        }
      }
    });
  }

  this.caster.bind(function(err) {
    if (err) {
      opt_callback(err);
    } else {
      if (self.expose) {
        self._intervalId = setInterval(doHeartbeat, self.heartbeat);
      }
      opt_callback(null);
    }
  });
};


/**
 * @param {function()} opt_callback
 *    An optional callback returning when the node is down.
 */
Node.prototype.down = function(opt_callback) {
  var self = this;

  if (self._intervalId) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  this.caster.close(function() {
    self.caster.removeListener('message', self._onCasterMessage);
    self.caster.removeListener('error', self._onCasterError);
    self.nodes = {};

    if (opt_callback) {
      opt_callback();
    }
  });
};
