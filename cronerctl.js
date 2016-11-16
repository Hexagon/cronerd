var 
	config	= require("./config.js"),
	cronerd	= require("./cronerd.js"),
	ipc 	= require('./ipc.js'),
	help 	= require("./help.js");

function handle (command, payload) {

	var request = function (topic, payload, callback) {
		var client = new ipc()
			.on('error', (e) => {
				console.error('IPC Socket error: ', e);
				client.close();
			})
			.on('connect', (s) => client.write({topic: topic, payload: payload}, function (e) {
				if(e) {
					console.error('Send error: ', e);
					client.close();	
				}
			}) )
			.on('data', (d) => {
				if (d.topic === topic) {
					callback(d.payload);
					client.close();
				}
			})
			//.connect({path: '/cronerd/main.sock'});
			.connect( config.socket );
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
	handle(process.argv[2], process.argv.slice(3, process.argv.length));

}

