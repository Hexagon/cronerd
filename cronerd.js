var ipc = require('./ipc.js'),
	jobs = require('./jobs.js'),
	config = require('./config.js');

function cronerd() {

	var server = new ipc(),
		address;

	// IPC Server
	if( config.socket.port ) {
		address = (config.socket.host ? config.socket.host + ':' : '') + config.socket.port;
	} else {
		address = config.socket.path;
	}
	server
		.on('error', (e) => console.error('IPC server error: ', e) )
		.on('failed', (e) => console.error('Failed to communicate with client: ', e) )
		.on('listening', (o) => console.log('IPC server listening at ' + address ))
		.on('data', (d, socket) => {
			if (d.topic === 'list') {
				server.write(socket, {
					topic: 'list',
					payload: jobs.list() 
				});
			}
		})
		.listen(config.socket);

	// Start job scheduler
	jobs.init();

}

if (require.main === module) {
    cronerd();
} else {
    module.exports = cronerd;
}

