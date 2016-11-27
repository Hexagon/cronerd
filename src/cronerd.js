var ipc = require("crocket"),
	qbus = require("qbus"),

	config = require('./core/config.js'),

	log = require('bunyan').createLogger(config.log),

	jobs = require('./core/jobs.js'),
	jobs = new jobs(log.child({section: 'core/jobs'})),

	web = require('./web/index.js')(log, jobs);

function cronerd() {

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
			console.error('FATAL: IPC server could not listen on requested socket.');
			console.error(e.toString());
			return false;
		}
		console.log('IPC server listening at ' + address.toString() );
	});

	// Reqest for all jobs received
	server.on('/jobs/list', function (d, socket) {
		// Respond!
		server.emit('/jobs/list', {
			job1: 'lol', job2: 'löl'
		}, socket);
	});

	server.on('error', function (e) {
		console.error('Communication error: ' + e.toString);
	});

}

if (require.main === module) {
    cronerd();
} else {
    module.exports = cronerd;
}

