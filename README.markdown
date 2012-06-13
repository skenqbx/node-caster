# node-caster
_A simple multicast server & client_

    Stability: 1 Experimental

## install

    npm install caster

## examples

### Caster - a multicast server

    var caster = require('caster').create({
      multicast: '224.0.0.54',
      port: 41234
    });

    caster.on('message', function(message, rinfo) {
      console.log(message.toString(), rinfo);
    });

    caster.bind(function(err) {
      if (err) {
        console.log(err);
      } else {
        var message = new Buffer("Some bytes");
        caster.send(message, function(err, bytes) {
          console.log(err, bytes);
        });
      }
    });

### Node - a network discovery server

    var node = require('caster').createNode({
      multicast: '224.0.0.54',
      port: 41234
    });

    node.on('up', function(remote) {
      console.log('up:', remote.id);
    });

    node.on('down', function(remote) {
      console.log('down:', remote.id);
    });

    node.on('message', function(message, remote) {
      console.log(remote.id + ':', message);
    });

    node.up(function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log('caster node running on ' +
            node.multicast + ':' + node.port);
      }
    });

## api

### create(options)
Create a new `Caster` object. `Caster` is an `EventEmitter`.

#### options

    { multicast: '224.0.0.42',
      address: '0.0.0.0',
      port: null,
      loopback: true,
      ttl: 64
    }

#### caster.send(message, opt_callback)
Send a message to other multicast nodes. `message` is a `Buffer`.

#### caster.bind(opt_callback)
Enable the multicast udp socket.

#### Event: 'message'
`function(message, remote)`

`message` is a `Buffer`.
`remote` is an object and contains information on the remote node.

#### Event: 'error'
`function(err)`

### createNode(options)
Create a new `Node` object. `Node` is an `EventEmitter`.

#### options

    { id: 'your_unique_node_id', // randomized if not set
      heartbeat: 1000,
      timeout: 2000,
      expose: true,
      // and all options of Caster
      multicast: '224.0.0.42',
      address: '0.0.0.0',
      port: null,
      loopback: true,
      ttl: 64
    }

#### node.up(opt_callback)

#### node.down(opt_callback)

#### node.send(message, opt_callback)
Send a message to other multicast nodes.

`message` is a `String`, `Number` or `Object`.

#### node.nodes
An object with all currently seen nodes.

#### Event: 'message'
`function(message, remote)`

`message` is the received & parsed json object.
`remote` is an object that contains information on the remote node.

#### Event: 'error'
`function(Error)`

#### Event: 'up'
Emitted when a remote node is _discovered_.

`function(remote)`

`remote` is an object that contains information on the remote node.

#### Event: 'down'

Emitted when a remote node is _disapeared_.

`function(remote)`

`remote` is an object that contains information on the remote node.
