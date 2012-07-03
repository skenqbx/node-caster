# node-caster
_A collection of multicast servers_

## install

    npm install caster

## api
» [Caster](#caster---a-multicast-server) » [middleware](#middleware) » [Node](#node---a-network-discovery-server)

### Caster - a multicast server

    Stability: 2 - Unstable

#### example

```javascript
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

```javascript
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

```javascript
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

```javascript
{
  name: 'json',
  tx: function(message, next) {...},
  rx: function(message, remote, next) {...}
}
```

#### middleware.crypto(opt_options)
Creates a new crypto middleware to encrypt outgoing & decrypt incoming messages.

`opt_options` is an optional `Object`.

```javascript
{
  key: '09dfDim3ZqzXvfkun6',
  algorithm: 'aes256'
}
```

#### middleware.hash(opt_options)
Creates a new hash middleware to hash outgoing & verify incoming messages.

`opt_options` is an optional `Object`.

```javascript
{
  secret: '9ve2cND;d3"Vs',
  algorithm: 'sha1'
}
```

#### middleware.json()
Creates a new json middleware to allow usage of a stringifyable object instead of a `Buffer` as message.

### Node - a network discovery server

    Stability: 2 - Unstable

#### example

```javascript
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

```javascript
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

```javascript
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
