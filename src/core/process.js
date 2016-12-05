const
	child_process = require('child_process');

module.exports = function (config, callback) {

	// Exec
	if ( config.mode == 'exec') {

		return child_process.exec(config.command, config.options, (error, stdout, stderr) => {
		  
		  var exitCode = error ? error.code : 0;

		  // exitCode, stdout, stderr
		  callback(exitCode, stdout, stderr, error);

		});

	// Spawn / Fork
	} else {
		try {
			var p = child_process.spawn(config.command, config.arguments, config.options),
				stdout = [],
				stderr = [];

			p.on("error", (err) => {
				// Exit code 71: Can not fork
				callback(71, "", "",  err);
			});

			p.stdout.on('data', (data) => {
			  stdout.push(data);
			});

			p.stderr.on('data', (data) => {
			  stderr.push(data);
			});

			p.on('exit', (code) => {
			   callback(code, stdout.join('\n'), stderr.join('\n'));
			});

			return p;

		} catch (e) {
			
			// Exit code 71: Can not fork
			callback(71, "", "",  e);

		}

	}

}