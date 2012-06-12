# node-caster
_A simple multicast server & client_

## install

    npm install caster

## example

    var caster = require('caster').create({
      multicast: '224.0.0.54',
      port: 41234
    });

    caster.on('message', function(message, rinfo) {
      console.log(message.toString(), rinfo);
    });

    caster.bind(function() {
      var message = new Buffer("Some bytes");
      caster.send(message, function(err, bytes) {
        console.log(err, bytes);
      });
    });

## api

### create(options)
Create a new `Caster` object. `Caster` is an `EventEmitter`.

#### options

    { multicast: '224.0.0.42',
      address: '0.0.0.0',
      port: null,
      addressType: 4,
      loopback: false,
      ttl: 64
    }

### caster.send(message, opt_callback)
Send a message to other multicast nodes. `message` is a `Buffer`.

### caster.bind(opt_callback)
Enable the multicast udp socket.

### Event: 'message'
`function(Buffer, Object.<string, *>)`

### Event: 'error'
`function(Error)`

### Event: 'close'
`function()`
