var config = require('../core/config.js'),
	log = require("../core/log.js")("ipc"),
	bus = require("../core/bus.js"),
	ipc = require("crocket"),
	qbus = require("qbus");

function ipcHandler(jobs) {

	var server = new ipc(),
		address;

	// Create a printable version of the socket address
	if( config.socket.port ) {
		address = (config.socket.host ? config.socket.host + ':' : '') + config.socket.port;
	} else {
		address = config.socket.path;
	}

	// Start server
	server.use(qbus);
	server.listen(config.socket, function (e) {
		if (e) {
			log.error('FATAL: IPC server could not listen on requested socket.');
			log.error(e.toString());
			return false;
		}
		log.info('IPC server listening at ' + address.toString() );
	});

	// Handle errors
	server.on('error', function (e) {
		log.error('Communication error: ' + e.toString());
	});

	// Set up handlers!

	server.on('/jobs/list', function (socket) {
		// Respond!
		server.emit('/jobs/list', jobs.list(), socket);
	});

	server.on('/jobs/reload', function (socket) {
		// Respond!
		server.emit('/jobs/reload', jobs.reload(), socket);
	});

	server.on('/job/start', function(params, socket) {

	});

	server.on('/log/pretty', function(params, socket) {
		var handler;
		handler = function(message) {
				if (socket.writable) {
					server.emit('/log/pretty', message.message, socket);
				} else {
					// Socket no longer writable, kill listener
					//bus.off('/log/pretty', handler);
				}
			};
		bus.on('/log/pretty', handler);
	});
}

module.exports = ipcHandler;