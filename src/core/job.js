const
	child_process = require('child_process'),
	croner = require("croner"),
	clone = require("klon"),
	proc = require("./process.js"),
	bus = require("./bus.js"),
	log = require("./log.js")("job"),

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
		scheduler,
		controller,

		state = {
			
			state: 'uninitialized',

			started: null,
			finished: null,

			next: null,
			
			runs: 0,
			averageRuntime: null,

			logs: {
				last: null,
				lastFailed: null
			}

		},

		reset = function () {
			
			config = undefined;
			errors = [];
			
			controller && controller.stop();
			controller = undefined;

		},

		raiseError = function (errStr) {
			log.error('Configuration error: ' + errStr);
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
				log.error('Job at ' + path + ' is not loaded due to invalid JSON.', 'Detailed error:', e);
				return false;
			}
			var whut = clone(defaultConfig, {});
			config = clone(tmpConfig, whut);
			if ((valid = validateConfig())) {
				log.info('%s: Configuration loaded from %s.', config.name, path);
				log = log.child({job: config.name});
			} else {
				log.warn('Configuration loaded, but will not start due to invalid configuration.');
			}
			return valid;
			//metaData = readFule...
		};

	this.isValid = () => { return errors.length > 0 ? false : true; };
	this.getConfig = () => { return config; };
	this.getState = () => { return state; };
	
	this.reload = function () {

		reset();

		if(loadConfig() && config.enabled) {

			// Run forever
			if ( config.on.forever ) {
				this.execute(false, 'forever');

			// Run on cron pattern
			} else if ( config.on.cron && config.on.cron.pattern ) {
				scheduler = croner( config.on.cron.pattern );
				controller = scheduler.schedule({
						startAt: config.on.cron.start,
						stopAt: config.on.cron.end,
						maxRuns: config.on.cron.maxRuns
					},
					() => this.execute(false, 'scheduler')
				);

				state.state = 'scheduled';
				state.next = scheduler.next();

			// Not scheduled
			} else {
				log.info('%s: not scheduled.', config.name);

			}
		}

	};

	this.stop = () => reset();

	this.execute = function ( force, starter ) {
		
		// Run some sanity checks before forking away
		if ( !this.isValid() ) {
			log.warn('%s: Job invalid, could not start.', config.name);
			return false;
		}
		if( !config.enabled ) {
			if ( force ) {
				log.info('%s: Forcefully starting disabled job.', config.name);
			} else {
				log.warn('%s: Job disabled, could not start.', config.name);
				return false;	
			}
		}

		// Everything seems to be in order, go on forking
		log.info('%s: Started by %s', config.name, starter);

		state.started = new Date();
		state.finished = null;
		state.state = 'running';

		proc(config.process, (exitCode, stdout, stderr, error) => {
			state.finished = new Date();
			if (state.runs > 0) {
				state.averageRuntime = ((state.averageRuntime * state.runs) + (state.finished - state.started)) / state.runs + 1;
			} else {
				state.averageRuntime = (state.finished - state.started);
			}
			state.runs++;
			state.logs.last = { stdout: stdout, stderr: stderr, error: error };

			// If error is defined, this indicates failure while forking
			if (error) {
				log.info('%s Could not start. Error: %s', config.name , error);
				state.state = 'fatal';
				state.logs.lastFailed = { at: state.started, stdout: stdout, stderr: stderr, error: error };

			// An exit code other than 0 indicates that the child process failed in one way or another
			} else if (exitCode !== 0) {
				log.error('%s exited with code %s', config.name, exitCode);
				state.state = 'error';
				state.logs.lastFailed = { at: state.started, stdout: stdout, stderr: stderr, error: error };
				if (stdout && stdout != "") {
					log.error('stdout:');
					log.error(stdout);
				}
				if (stderr && stderr != "") {
					log.error('stderr:');
					log.error(stderr);
				}

			// Content in stderr calls for a warning
			} else {

				state.state = 'success';

				if (stderr && stderr != "") {
					state.state = 'warning';
					log.warn('%s: Placed information in stderr: %s', config.name, stderr);
				}

				log.info('%s: Finished successfully.', config.name);

			}

			// Instantly restart, if needed
			if( config.on.forever ) {
				setTimeout(() => this.execute(false, forever), config.restartMs);
			}

			// Log next run
			if( starter=='scheduler' ) {

				state.next = scheduler.next();
				if(state.next) {
					log.info('%s: Next scheduled run is at %s', config.name, state.next);	
				} else {
					state.state = 'expired';
					log.info('%s: Job has expired.',config.name);
				}

			}

		});

	};

	this.reload();

	return this;
};

module.exports = job;