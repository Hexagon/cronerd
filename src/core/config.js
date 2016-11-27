// !!! Don not edit this file. Make changes in one of the following paths
// - /etc/cronerd/config.json, 
// - /etc/cronerd/conf.d/*.json, 
// - <working directory>/conf.d/*.json, 
// - <home directory>/conf.d/*.json, 
var ps = require('bunyan-prettystream'),
	psout = new ps();

psout.pipe(process.stdout);

var defaults = {
	users: {
		allowed: "*"
	},
	socket: {
		path: "/tmp/cronerd-ipc.sock",
		host: undefined,
		port: undefined,
		reconnect: 500
	},
	log: {
		name: 'cronerd',
		streams: [
			{
				level: 'debug',
				type: 'raw',
				stream: psout       // log INFO and above to stdout
			},
			{
				level: 'warn',
				path: 'logs/cronerd-error.log'  // log ERROR and above to a file
			}
		]
	},
	web: {
		port: 8080
	}
};

function config () {
	
	// Extend nothing with defaults
	
	// Look in /etc/cronerd/ for config.json
	// Look in /etc/cronerd/conf.d/*.json for configuration extensions
	// Look in <workingdir>/conf.d/*.json for configuration extensions

	// Check that all entries exist in defaults! Soft throw if not (console.error())

	return defaults;
}

module.exports = new config();