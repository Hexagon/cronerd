const
	ipc 	= require("crocket"),
	qbus 	= require("qbus"),

	bus 	= require("./core/bus.js"),

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
			callback && callback('Invalid response', e.stack);
			if (payload && payload.retain !== true) {
				client.close();
			}
		});

		client.on(command, function (data) {
			if (!payload || (payload && payload.retain !== true)) {
				client.close();
			} 
			callback && callback(undefined, data);
		});

		client.emit(command, payload, function (clientErr) {
			// IPC Communication error
			if(clientErr) {
				callback && callback('Could not communicate with host process, data could not be sent.', clientErr);
				client.close();
			}
		});

	});

}

// No arguments passed, print help
if (process.argv.length <= 2)
	return help();


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
			console.log('\n'+ job.config.name);
			job.config.description && console.log(job.config.description);
			console.log('\n    Enabled:\t' + job.config.enabled);
			console.log('    State:\t' + job.state.state);
			console.log('    Started:\t' + job.state.started);
			console.log('    Finished:\t' + job.state.finished);
			console.log('    Next:\t' + job.state.next + '\n');
		});
	});
} else if ( command == "tail" ) {

	console.log('Reading server log in real time, press CTRL+C to exit.');

	remote("/log/pretty", { retain: true }, function (error, response) {

		if (error) {
			console.error(error);
			response && console.error(response);
		}

		console.log(response.trim('\n'));

	});
} else if ( command == "reload" ) {

	remote("/jobs/reload", undefined, function (error, response) {
		if (error) {
			console.error(error);
			response && console.error(response);
			return;
		}
		console.log('\nJobs reloaded from disk, found:\n')	;
		Object.keys(response).forEach(key => console.log('    %s',key));
	});

} else if ( command == "job" && payload.length > 1 ) {
	
	var jobName = payload[1];

	if( payload[0] == "start" ) {
		remote("/job/start", { name: jobName }, function (error, response) {
			if (error) {
				console.error('%s could not be started.', jobName);
				console.error('Error: ' + error);
				response && console.error('Output: ' + response);
				return;
			}
			console.log('%s is started, average run time is about %s seconds.')	;
			Object.keys(response).forEach(key => console.log('    %s',key));
		});

	} else if ( payload[0] == "force" ) {


	} else if ( payload[0] == "reload" ) {


	} else if ( pauload[0] == "status" ) {

	}


} else {
	console.log('\nUnknown command: ' + command);
	return help();

}

