var bunyan = require('bunyan'),
	bunyanps = require('bunyan-prettystream'),
	config = require('./config.js').log;

function log () {

	var streamOut = new bunyanps({mode: 'short'}),
		logger;

	streamOut.pipe(process.stdout);

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