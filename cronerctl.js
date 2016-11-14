var 
	config = require("./config.js"),
	ipc=require('./ipc.js'),
	help = require("./help.js");

function handle (command, payload) {

	// Start master process
	if (command === "init") {
		var server = new ipc()
			.on('error', (e) => console.error('Could not start IPC server: ', e) )
			.on('listening', (o) => console.log('IPC server listening at ' + o.path) )
			.on('data', (d, socket) => {
				console.log('Data received', d);
				server.write(socket, {data: 'Well hello there!'}, function(e) {
					if(e) {
						console.error('Send error: ', e);
					}
				});
			})
			.listen({path: '/cronerd/main.sock'});
		return;


	// List available jobs
	} else if (command === "list") {
		var client = new ipc()
			.on('error', (e) => {
				console.error('IPC Socket error: ', e);
				socket.close();
			})
			.on('connect', (s) => client.write(undefined, function (e) {
				console.error('Send error: ', e);
				client.close();	
			}) )
			.on('data', (d) => {
				console.log('Data received', d.data);
				client.close();
			})
			.connect({path: '/cronerd/main.sock'});
		return;


	// Fallback
	} else {

		return help();


	}

};

if (process.argv.length <= 2) {
	return help();

} else {
	handle(process.argv[2], process.argv.slice(3, process.argv.length));

}

