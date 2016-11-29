var bunyan = require('bunyan'),
	bunyanps = require('bunyan-prettystream'),
	config = require('./config.js').log,
	bus = require("./bus.js"),
	stream = require('stream');

function log () {

	var streamOut = new bunyanps({mode: 'short'}),
		logger;

	// Pipe pretty printed stream to stdout 
	streamOut.pipe(process.stdout);

	// Also pipe pretty printed stream to bus
	streamOut.on('data', function (message) {
		bus.emit('/log/pretty', { message: message });
	})

	config.streams.push({
		level: 'debug',
		type: 'raw',
		stream: streamOut
	});

	logger = bunyan.createLogger(config);

	return function (module) {
		if (module) {
			return logger.child({module: module});
		} else {
			return logger;
		}
	}

}

module.exports = new log(); 