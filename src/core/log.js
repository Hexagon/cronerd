var bunyan = require('bunyan'),
	bunyanps = require('bunyan-prettystream'),
	config = require('./config.js').log,
	stream = require('stream');

function log () {

	var streamOut = new bunyanps({mode: 'short'}),
		logger;

	// Pipe pretty printed stream to stdout 
	streamOut.pipe(process.stdout);

	// Attach stream to log configuration object
	config.streams.push({
		level: 'debug',
		type: 'raw',
		stream: streamOut
	});

	// Create bunyan logger instance
	logger = bunyan.createLogger(config);

	// Return a function which gets the logger singleton, or a named child of it
	return function (module) {
		if (module) {
			return logger.child({module: module});
		} else {
			return logger;
		}
	}

}

module.exports = new log(); 