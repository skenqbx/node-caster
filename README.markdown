# node-caster
_Multicast Service Discovery_

[Caster](#caster---a-multicast-server) provides a multicast server with [middleware](#middleware) support.
[json](#middlewarejson), [hash](#middlewarehashopt_options), and [crypto](#middlewarecryptoopt_options) middleware is included.

[Node](#node---a-service-discovery-server) implements service discovery on top of Caster.

## install

    npm install caster

## api
### Caster - a multicast server

    Stability: 2 - Unstable

#### example

```js
var caster = require('caster');

var server = caster.create();

server.use(
    caster.middleware.json(),
    caster.middleware.hash({secret: 'mySecretHashPrefix'}),
    caster.middleware.crypto({key: 'mySecretKey'})
);

server.on('message', function(message, remote) {
  console.log(message, remote);
});

server.bind(function(err) {
  if (err) {
    console.log(err);
  } else {
    server.send({hello: 'world'}, function(err, bytes) {
      console.log(err, bytes);
      server.close();
    });
  }
});
```

#### caster.create(opt_options)
Creates a new `Caster` server. `Caster` is an `EventEmitter`.

`opt_options` is an optional `Object`.

```js
{
  multicast: '224.0.0.42',
  address: '0.0.0.0',
  port: 10101,
  loopback: true,
  ttl: 64
}
```

_Note:_ All nodes have to use the same multicast address & port to be able to communicate.

#### server.use(var_middleware)
Adds [middleware](#middleware).

```js
server.use(
    caster.middleware.json(),
    caster.middleware.hash(),
    caster.middleware.crypto()
);
```
The middleware execution order, resulting from the above example, would be `json.tx -> hash.tx -> crypto.tx` for outgoing, and `crypto.rx -> hash.rx -> json.rx` for incoming messages.

#### server.send(message, opt_callback)
Sends a message to all listening multicast servers.

`message` is a `Buffer`.

`opt_callback` is an optional `function(err, bytes)`.
A possible error is emitted when no callback is set.

#### server.bind(opt_callback)
Enables the multicast udp socket.

`opt_callback` is an optional `function(err)`.
A possible error is emitted when no callback is set.

#### server.close(opt_callback)
Closes the socket. Allows to `bind()` again with the same caster object.

`opt_callback` is an optional `function()`.

#### Event: 'message'
`function(message, remote)`

`message` is a `Buffer`.

`remote` is an object with `address` and `port`.

#### Event: 'error'
`function(err)`

### middleware

An example middleware object:

```js
{
  name: 'json',
  tx: function(message, next) {...},
  rx: function(message, remote, next) {...}
}
```

#### middleware.crypto(opt_options)
Creates a new crypto middleware to encrypt outgoing & decrypt incoming messages.

`opt_options` is an optional `Object`.

```js
{
  key: '09dfDim3ZqzXvfkun6',
  algorithm: 'aes256'
}
```

#### middleware.hash(opt_options)
Creates a new hash middleware to hash outgoing & verify incoming messages.

`opt_options` is an optional `Object`.

```js
{
  secret: '9ve2cND;d3"Vs',
  algorithm: 'sha1'
}
```

#### middleware.json()
Creates a new json middleware to allow usage of a stringifyable object instead of a `Buffer` as message.

### Node - a service discovery server

    Stability: 2 - Unstable

#### example

```js
var node = require('caster').createNode({
  meta: {
    type: 'http',
    port: 8080
  }
});

node.on('up', function(remote) {
  console.log('node up:', remote.id, remote.meta);
});

node.on('down', function(remote) {
  console.log('node down:', remote.id, remote.meta);
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
```

#### caster.createNode(opt_options)
Creates a new `Node` object. `Node` is an `EventEmitter` and uses `Caster`.

`opt_options` is an optional `Object`.

```js
{
  id: null, // your node's id, randomized if not set
  meta: null, // your node's metadata that is transmitted with every heartbeat
  expose: true, // when false, no heartbeat messages are send
  heartbeat: 1000, // heartbeat interval in ms
  timeout: 2000, // timeout until a remote node is declared down

  // caster options
  multicast: '224.0.0.42',
  port: 10101,
  ttl: 64,

  // caster middleware options
  hash: true, // enable message hashing
  hashSecret: null, // hash secret
  hashAlgorithm: 'sha1', // hash algorithm
  crypto: false, // enable message encryption
  cryptoKey: null, // encryption key
  cryptoAlgorithm: 'aes256' // encryption algorithm
}
```

#### node.up(opt_callback)
Starts up the node.

`opt_callback` is an optional `function(err)`.
A possible error is emitted when no callback is set.

#### node.down(opt_callback)
Shuts down the node.

`opt_callback` is an optional `function()`.

#### node.send(message, opt_callback)
Sends a message to other multicast nodes.

`message` is a `String`, `Number` or `Object`.

`opt_callback` is an optional `function(err, bytes)`.
A possible error is emitted when no callback is set.

#### node.nodes
An object with all currently seen nodes.

```js
{
  node857631295: {
    id: 'node857631295',
    address: '10.0.0.23',
    firstSeen: 1340351517064,
    lastSeen: 1340351517064,
    meta: {...}
  },
  ...
}
```

#### Event: 'message'
`function(message, remote)`

`message` is the received & parsed json object.

`remote` is the object stored in [node.nodes](#nodenodes).

#### Event: 'error'
`function(Error)`

#### Event: 'up'
Emitted when a remote node is _discovered_.

`function(remote)`

`remote` is the object stored in [node.nodes](#nodenodes).

#### Event: 'down'
Emitted when a remote node _disappeared_.

`function(remote)`

`remote` is the object just removed from [node.nodes](#nodenodes).

## tests
```
make install
make jshint
make test
make test-cov
```

## license
```
(The MIT License)

Copyright (c) 2012 Malte-Thorben Bruns <skenqbx@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
