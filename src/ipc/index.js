var config = require('../core/config.js'),
	ipc = require("crocket"),
	qbus = require("qbus");

function ipcHandler(log, jobs) {
	log = log.child({module: 'ipc'});

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

	// Reqest for all jobs received
	server.on('/jobs/list', function (d, socket) {
		// Respond!
		server.emit('/jobs/list', jobs.list(), socket);
	});

	server.on('/jobs/reload', function (d, socket) {
		// Respond!
		server.emit('/jobs/reload', jobs.reload(), socket);
	});

	server.on('error', function (e) {
		log.error('Communication error: ' + e.toString());
	});

}

module.exports = ipcHandler;