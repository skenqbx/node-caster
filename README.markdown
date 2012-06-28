# node-caster
_A collection of multicast servers_

## install

    npm install caster

## api

### Caster - a multicast server

    Stability: 2 - Unstable

#### example

```javascript
var caster = require('caster');

var server = caster.create({
  multicast: '224.0.0.54',
  port: 41234
});

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

#### caster.create(options)
Create a new `Caster` server. `Caster` is an `EventEmitter`.

`opt_options` is an optional `Object`.

```javascript
{
  multicast: '224.0.0.42',
  address: '0.0.0.0',
  port: null,
  loopback: true,
  ttl: 64
}
```

_Note:_ All nodes have to use the same multicast address & port to be able to communicate.

#### server.use(var_middleware)
Add [middleware](#middleware).
The first used middleware is the first being executed on `server.send()` and the last on an incoming message. E.g. using json, hash & crypto in that order would pass messages like this:

```
incoming: crypto:rx -> hash:rx -> json:rx
outgoing: json:tx -> hash:tx -> crypto:tx
```

#### server.send(message, opt_callback)
Send a message to all listening multicast servers.

`message` is a `Buffer`.

`opt_callback` is an optional `function(err, bytes)`.
A possible error is emitted when no callback is set.

#### server.bind(opt_callback)
Enable the multicast udp socket.

`opt_callback` is an optional `function(err)`.
A possible error is emitted when no callback is set.

#### server.close(opt_callback)
Close the socket. Allows to `bind()` again with the same caster object.

`opt_callback` is an optional `function()`.

#### Event: 'message'
`function(message, remote)`

`message` is a `Buffer`.

`remote` is an object and contains information on the remote node.

#### Event: 'error'
`function(err)`

### middleware

```javascript
{
  name: 'json',
  tx: function(message, next) {...},
  rx: function(message, remote, next) {...}
}
```

#### crypto(opt_options)
Encrypt/decrypt messages.
This middleware is not suitable for streaming data.

`opt_options` is an optional `Object`.

```javascript
{
  key: '09dfDim3ZqzXvfkun6',
  algorithm: 'aes256'
}
```

#### hash(opt_options)
Hash & verify messages.

`opt_options` is an optional `Object`.

```javascript
{
  secret: '9ve2cND;d3"Vs'
}
```

#### json()
Allows to use a stringify-able object instead of a `Buffer` as message.

### Node - a network discovery server

    Stability: 2 - Unstable

#### example

```javascript
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
```

#### caster.createNode(opt_options)
Create a new `Node` object. `Node` is an `EventEmitter` and uses `Caster`.

`opt_options` is an optional `Object`.

```javascript
{
  id: 'your_unique_node_id', // randomized if not set
  heartbeat: 1000, // heartbeat interval in ms
  timeout: 2000, // timeout until a remote node is declared down
  expose: true, // when false, no heartbeats are send
  // and all options of Caster
  multicast: '224.0.0.42',
  address: '0.0.0.0',
  port: null, // randomized if not set
  loopback: true,
  ttl: 64
}
```

#### node.up(opt_callback)
Fire up the node.

`opt_callback` is an optional `function(err)`.
A possible error is emitted when no callback is set.

#### node.down(opt_callback)
Shut down the node.

`opt_callback` is an optional `function()`.

#### node.send(message, opt_callback)
Send a message to other multicast nodes.

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
    lastSeen: 1340351517064
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
Emitted when a remote node _disapeared_.

`function(remote)`

`remote` is the object just removed from [node.nodes](#nodenodes).
