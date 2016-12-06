// !!! Don not edit this file. Make changes in one of the following paths
// - /etc/cronerd/config.json, 
// - /etc/cronerd/conf.d/*.json, 
// - <working directory>/conf.d/*.json, 
// - <home directory>/conf.d/*.json, 

var defaults = {
	users: {
		allowed: "*"
	},
	log: {
		name: 'cronerd',
		streams: [
			{
				level: 'warn',
				path: 'logs/cronerd-error.log'  // log ERROR and above to a file
			}
		]
	},
	web: {
		name: 'cronerd',
		api: true,
		gui: true,			// gui: true forces api to true
		static: true,		// disable if serving ./public/ through another web server
		port: 8080,
		authentication: {
			enable: true,
			users: {
		        // default - admin:admin
			}
		}
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