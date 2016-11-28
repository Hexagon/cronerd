const
	ipc 	= require("crocket"),
	qbus 	= require("qbus"),

	help 	= require("./cli/help.js"),

	config	= require("./core/config.js");

function remote (command, payload, callback) {

	var client = new ipc();
	client.use(qbus);
	client.connect( config.socket , function (e) {
		
		// IPC Connect eror
		if(e) {
			callback && callback('Could not communicate with host process, are cronerd started?', e);
			client.close();
			return;
		}

		// Handle communication errors
		client.on('error', function (e) {
			callback && callback('Invalid response', e);
			client.close();
		});

		client.on(command, function (data) {
			callback && callback(undefined, data);
			client.close();	
		});

		client.emit(command, payload, function (clientErr) {
			// IPC Communication error
			if(clientErr) {
				callback && callback('Could not communicate with host process, data could not be sent.', clientErr);
				client.close();
				return
			}
		});

	});

}

if (process.argv.length <= 2) {
	return help();

} else {

	var command = process.argv[2],
		payload = process.argv.slice(3, process.argv.length);
	
	if ( command == "list" ) {

		remote("/jobs/list", undefined, function (error, response) {
			if (error) {
				console.error(error);
				response && console.error(response);
				return;
			}

			// Show list
			response.forEach( (job) => {
				console.log('');
				console.log(job.config.name);
				job.config.description && console.log(job.config.description);
				console.log('');
				console.log('    Enabled:\t' + job.config.enabled);
				console.log('    State:\t' + job.state.state);
				console.log('    Started:\t' + job.state.started);
				console.log('    Finished:\t' + job.state.finished);
				console.log('    Next:\t' + job.state.next);
				console.log('');
			});
		});

	} else if ( command == "reload" ) {

		remote("/jobs/reload", undefined, function (error, response) {
			if (error) {
				console.error(error);
				response && console.error(response);
				return;
			}
			console.log('Jobs reloaded from disk');
		});

	} else {
		console.log('Unknown command: ' + command);
		return help();

	}

}

