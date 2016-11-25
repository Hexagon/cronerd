const
	child_process = require('child_process'),
	croner = require("croner"),
	clone = require("klon"),
	proc = require("./process.js"),

	// Default configuration for a job
	defaultConfig = {

		name: "unnamed-process",
		display: null,
		description: "",

		enabled: null,

		on: {

			forever: false,
			event: null,

			cron: {
				pattern: null,
				start: null,
				end: null,
				maxRuns: null
			}

		},

		process: {
			mode: 'fork',		// fork is specically for node processes, spawn is for shell-less processes, exec is for simple shell processes
			restartMs: 500,		// Wait this many seconds before restarting the process, in case of mode = forever
			command: '',
			arguments: [],		// Only applicable for fork and spawn
			options: {
				// regular options object for fork, spawn, exec etc. 
				// Plus user: "username" sets uid, group: "groupname" sets gid
			} 
		}

	};

function job (path) {

	var 
		config,
		errors = [],
		controller,

		reset = function () {
			
			config = undefined;
			errors = [];
			
			controller && controller.stop();
			controller = undefined;

		},

		raiseError = function (errStr) {
			console.error('Configuration error: ' + errStr);
			errors.push(errStr);
		},

		validateConfig = function () {

			var isValid = true;

			// Check that forever is not combined with any of the others
			if(		(config.on.forever && config.on.trigger) 
				|| 	(config.on.forever && config.on.cron.pattern) ) {
				raiseError('on.forever cannot be combined with on.cron.pattern or on.trigger.');
			}

			// Check that cron pattern is valid
			if ( config.on.cron && config.on.cron.pattern ) {
				try {
					var cronTest = croner( config.on.cron.pattern );
				} catch (e) {
					raiseError(e.toString());
				}
			}

			// Check that process.mode is valid
			if ( !child_process[config.process.mode] ) {
				raiseError(config.process.mode + ' is not a valid entry for process.mode');
			}

			return errors.length > 0 ? false : true;
		},

		loadConfig = function () {
			try {
				var tmpConfig = require(path);
			} catch (e) {
				console.log('Job at ' + path + ' is not loaded due to invalid JSON.');
				console.log('Detailed error:');
				console.error(e);
				return false;
			}
			var whut = clone(defaultConfig, {});
			config = clone(tmpConfig, whut);
			if ((valid = validateConfig())) {
				console.log(config.name + ' loaded from ' + path + '.');
			} else {
				console.log(config.name + ' loaded, but will not start due to invalid configuration.');
			}
			return valid;
			//metaData = readFule...
		};

	this.isValid = () => { return errors.length > 0 ? false : true; };

	this.reload = function () {

		reset();

		if(loadConfig() && config.enabled) {

			// Run forever
			if ( config.on.forever ) {
				this.execute();

			// Run on cron pattern
			} else if ( config.on.cron && config.on.cron.pattern ) {
				var scheduler = croner( config.on.cron.pattern );
				controller = scheduler.schedule({
						startAt: config.on.cron.start,
						stopAt: config.on.cron.end,
						maxRuns: config.on.cron.maxRuns
					},
					() => this.execute()
				);

			// Not scheduled
			} else {
				console.log(config.name + ' not scheduled.');

			}
		}

	};

	this.stop = () => reset();

	this.execute = function ( force ) {
		
		// Run some sanity checks before forking away
		if ( !this.isValid() ) {
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

		// Everything seems to be in order, go on forking
		console.log(config.name + ' is starting.');
		proc(config.process, (exitCode, stdout, stderr, error) => {
			
			// If error is defined, this indicates failure while forking
			if (error) {
				console.log(config.name + ' could not start. Error: ' , error);	

			// An exit code other than 0 indicates that the child process failed in one way or another
			} else if (exitCode !== 0) {
				console.log(config.name + ' exited with code ' + exitCode + '.');
				if (stdout && stdout != "") {
					console.log('stdout:');
					console.log(stdout);
				}
				if (stderr && stderr != "") {
					console.log('stderr:');
					console.log(stderr);
				}

			// Content in stderr calls for a warning
			} else {

				if (stderr && stderr != "") {
					console.warn(config.name + ' placed information in stderr: ');
					console.warn(stderr);
				}

				console.log(config.name + ' finished successfully.');

			}

			// Instantly restart, if needed
			if( config.on.forever ) {
				setTimeout(() => this.execute(), config.restartMs);
			}

		});

	};

	this.reload();

	return this;
};

module.exports = job;