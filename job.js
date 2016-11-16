var 
	fs = require('fs'),
	extend = require('util')._extend;

var configDefaults = {

	user: null,
	
	name: null,
	description: null,

	pattern: null,
	begins: null,
	ends: null,

	enabled: false,

	script: null,
	command: null,
	parameters: null,

	workingDirectory: null,

};

function job (path) {

	var 
		configPath = path,

		config,
		valid = false;
		nextExecutionTimer,

		reset = function () {
			
			config = undefined;
			valid = false;
			
			if (nextExecutionTimer) {
				clearTimeout(nextExecutionTimer);	
			}

		},

		validateConfig = function () {
			// Look for keys not in configDefaults, test pattern, test dates, etc.
			return true;
		},

		loadConfig = function () {
			config = extend(extend({}, configDefaults), {} /* Actual config here */);
			return (valid = validateConfig());
			//metaData = readFule...
		},

		schedule = function () {
			// Start scheduler
		},

		execute = function () {

		};

	this.reload();
};

job.prototype.reload = function () {

	reset();

	if(loadConfig()) schedule();

};

job.prototype.execute = function ( force ) {
	
	if ( !valid ) {
		console.warn('Job invalid, could not start.');
		return false;
	}

	if( !config.enabled ) {
		if ( force ) {
			console.log('Forcefully starting disabled job.');
		} else {
			console.warn('Job disabled, could not start.');
			return false;	
		}
	}

	if( config.begins /* ... */ ) {
		return false;
	}

	// Execute
	force();

};

module.exports = job;