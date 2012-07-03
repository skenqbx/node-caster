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
var middleware = require('./middleware');


/**
 * Handle incoming messages.
 */
function onMessage(message, remote) {
  /*jshint validthis:true */
  // discard invalid messages
  if (!message.id) {
    return;
  }

  // create the node
  if (!this.nodes.hasOwnProperty(message.id)) {
    if (!message.suicide) {
      var now = (new Date()).getTime();

      this.nodes[message.id] = {
        id: message.id,
        address: remote.address,
        firstSeen: now,
        lastSeen: now,
        meta: message.meta
      };

      this.emit('up', this.nodes[message.id]);
    }
  } else if (message.suicide) {
    var node = this.nodes[message.id];
    delete this.nodes[message.id];
    this.emit('down', node);
    return;
  } else {
    this.nodes[message.id].lastSeen = (new Date()).getTime();
  }

  // emit message
  if (message.message) {
    this.emit('message', message.message, this.nodes[message.id]);
  }
}


/**
 * Execute heartbeat tasks.
 */
function onHeartbeatInterval() {
  /*jshint validthis:true */
  var nodes = this.nodes;

  // send heartbeat
  if (this.expose) {
    this.caster.send({id: this.id, meta: this.meta});
  }

  // check for timed out nodes
  var i, node, keys = Object.keys(nodes);
  var length = keys.length;
  var min = (new Date()).getTime() - this.timeout;

  for (i = 0; i < length; i++) {
    if (nodes[keys[i]].lastSeen < min) {
      node = nodes[keys[i]];
      delete nodes[keys[i]];
      this.emit('down', node);
    }
  }
}


/**
 * @param {Object.<string, *>=} opt_options Multicast configuration object.
 * @constructor
 * @extends {events.EventEmitter}
 */
function Node(opt_options) {
  events.EventEmitter.call(this);

  opt_options = opt_options || {};
  this.id = opt_options.id ||
      'node' + Math.random().toString().substr(2);
  this.meta = opt_options.meta || {};
  this.expose = typeof opt_options.expose !== 'undefined' ?
      opt_options.expose : true;
  this.heartbeat = opt_options.heartbeat || 2000;
  this.timeout = opt_options.timeout || 3000;

  this._interval = null;
  this.nodes = {};

  // create multicast server
  this.caster = new Caster({
    multicast: opt_options.multicast,
    port: opt_options.port,
    ttl: opt_options.ttl
  });

  // add multicast middleware
  this.caster.use(middleware.json());
  if (!opt_options.hash) {
    this.caster.use(middleware.hash({
      secret: opt_options.hashSecret,
      algorithm: opt_options.hashAlgorithm
    }));
  }
  if (opt_options.crypto) {
    this.caster.use(middleware.crypto({
      key: opt_options.cryptoKey,
      algorithm: opt_options.cryptoAlgorithm
    }));
  }

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
 * Send a json message to all listening remote nodes.
 * @param {String|Number|Object} message The message to send.
 * @param {function(Error, Number)=} opt_callback
 *    An optional callback returning on error or when message is sent.
 */
Node.prototype.send = function(message, opt_callback) {
  this.caster.send({id: this.id, message: message}, opt_callback);
};


/**
 * Start up the node.
 * @param {function(Error)=} opt_callback
 *    An optional callback returning on error or when the node is up.
 */
Node.prototype.up = function(opt_callback) {
  var self = this;

  opt_callback = opt_callback || function(err) {
    if (err) {
      self.emit('error', err);
    }
  };

  if (this._interval) {
    opt_callback(new Error('Node already up'));
    return;
  }

  this.caster.bind(function(err) {
    if (err) {
      opt_callback(err);
    } else {
      self.caster.on('message', onMessage.bind(self));
      self._interval =
          setInterval(onHeartbeatInterval.bind(self), self.heartbeat);
      opt_callback(null);
    }
  });
};


/**
 * Shut down the node.
 * @param {function()=} opt_callback
 *    An optional callback returning when the node is down.
 */
Node.prototype.down = function(opt_callback) {
  var self = this;

  opt_callback = opt_callback || function(err) {
    if (err) {
      self.emit('error', err);
    }
  };

  if (!this._interval) {
    opt_callback(new Error('Node is not up'));
    return;
  }

  clearInterval(this._interval);
  this._interval = null;
  this.caster.removeAllListeners('message');
  this.caster.send({id: this.id, suicide: true}, function(err) {
    self.caster.close();
    opt_callback(err);
  });
};
