const { Server } = require("socket.io");
const http = require("node:http");

const { get_conf, get_redis_subscriber } = require("../node_utils");
const conf = get_conf();

const server = http.createServer();

let io = new Server(server, {
	cors: {
		// Should be fine since we are ensuring whether hostname and origin are same before adding setting listeners for s socket
		origin: true,
		credentials: true,
	},
	cleanupEmptyChildNamespaces: true,
});

// <DFP logging
// Add Socket.IO connection logging
console.log('DFP logs enabled')
io.engine.on("connection_error", (err) => {
	console.log("Connection error:", err.req.url, err.code, err.message);
});

io.engine.on("headers", (headers, req) => {
	console.log(`\n--- DFP Socket.IO Headers ---`);
	console.log(`Host: ${req.headers.host}`);
	console.log(`Origin: ${req.headers.origin || 'N/A'}`);
	console.log(`User-Agent: ${req.headers['user-agent'] || 'N/A'}`);
	console.log(`Cookie: ${req.headers.cookie ? '[PRESENT]' : 'N/A'}`);
	console.log('--- DFP End Headers ---\n');
});
// DFP logging>

// Multitenancy implementation.
// allow arbitrary sitename as namespaces
// namespaces get validated during authentication.
const realtime = io.of(/^\/.*$/);

// load and register middlewares
const authenticate = require("./middlewares/authenticate");
realtime.use(authenticate);
// =======================

// load and register handlers
const frappe_handlers = require("./handlers/frappe_handlers");
function on_connection(socket) {
// <DFP más logs
	console.log(`\n--- DFP New Socket Connection ---`);
	console.log(`Socket ID: ${socket.id}`);
	console.log(`Namespace: ${socket.nsp.name}`);
	console.log(`IP: ${socket.handshake.address}`);
	console.log(`Headers: Host=${socket.handshake.headers.host}, Origin=${socket.handshake.headers.origin}`);
	console.log('--- DFP End Connection Info ---\n')
// DFP más logs>
	frappe_handlers(realtime, socket);

	// ESBUild "open in editor" on error
	socket.on("open_in_editor", async (data) => {
		await subscriber.connect();
		subscriber.publish("open_in_editor", JSON.stringify(data));
	});
}

realtime.on("connection", on_connection);
// =======================

// Consume events sent from python via redis pub-sub channel.
const subscriber = get_redis_subscriber();

(async () => {
	await subscriber.connect();
	subscriber.subscribe("events", (message) => {
		message = JSON.parse(message);
		let namespace = "/" + message.namespace;
		if (message.room) {
			io.of(namespace).to(message.room).emit(message.event, message.message);
		} else {
			// publish to ALL sites only used for things like build event.
			realtime.emit(message.event, message.message);
		}
	});
})();
// =======================

let uds = conf.socketio_uds;
let port = conf.socketio_port;
server.listen(uds || port, () => {
	console.log("Realtime service listening on: ", uds || port);
});
