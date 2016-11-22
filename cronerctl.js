const
	ipc 	= require("crocket"),
	qbus 	= require("qbus"),

	cronerd	= require("./cronerd.js"),
	help 	= require("./help.js"),

	config	= require("./config.js"),
	package = require("./package.json");

function handle (command, payload) {

	var request = function (callback) {

		var client = new ipc();
		client.use(qbus);
		client.connect( config.socket , function (e) {
			
			// IPC Connect eror
			if(e) {
				console.error('\nCould not communicate with host process, are cronerd started?\n');
				console.error(e.toString());
				client.close();
				return;
			}

			// Handle communication errors
			client.on('error', function (e) {
				console.error('Invalid message received: ', e.toString());
			});

			// List jobs
			if (command === 'list') {
				client.emit('/jobs/list', payload, function (clientErr) {
					// IPC Communication error
					if(clientErr) {
						console.error('Could not communicate with host process, data could not be sent.');
						console.error(e.toString());
						client.close();	
					}
				});
				client.on('/jobs/list', function (data) {
					console.log('Jobs:', data);
					client.close();	
				});

			// Fallback
			} else {
				console.error('Invalid operation requested: ' + command + '.');
				client.close();
			}
			

		});
	};

	// Start master process
	if (command === "init") {
		cronerd();
		return;


	// List available jobs
	} else if (command === "list") {
		request("list", undefined, function (response) {
			console.log('List of jobs: ', response);
		});
		return;


	// Fallback
	} else {

		return help();


	}

};

if (process.argv.length <= 2) {
	return help();

} else {
	console.log(package.name + ' ' + package.version);	
	handle(process.argv[2], process.argv.slice(3, process.argv.length));

}

