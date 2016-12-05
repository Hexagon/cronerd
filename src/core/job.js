const
	child_process = require('child_process'),
	croner = require("croner"),
	clone = require("klon"),
	proc = require("./process.js"),
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
			timeout: null,		// Timeout in seconds, if process runs for longer than this, it will be terminated. It is highly recommended to set this on all jobs
			command: '',
			arguments: [],		// Only applicable for fork and spawn
			options: {
				// regular options object for fork, spawn, exec etc. 
				// Plus user: "username" sets uid, group: "groupname" sets gid
			} 
		}

	};

function requireUncached(module){
    delete require.cache[require.resolve(module)]
    return require(module)
}

function job (path) {

	var 
		self = this,
		errors = [],

		scheduler,
		controller,
		child,

		timeout75Percent,
		timeout100Percent,

		reset = function () {
			
			self.config = undefined;
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
			if(		(self.config.on.forever && self.config.on.trigger) 
				|| 	(self.config.on.forever && self.config.on.cron.pattern) ) {
				raiseError('on.forever cannot be combined with on.cron.pattern or on.trigger.');
			}

			// Check that cron pattern is valid
			if ( self.config.on.cron && self.config.on.cron.pattern ) {
				try {
					var cronTest = croner( self.config.on.cron.pattern );
				} catch (e) {
					raiseError(e.toString());
				}
			}

			// Check that process.mode is valid
			if ( !child_process[self.config.process.mode] ) {
				raiseError(self.config.process.mode + ' is not a valid entry for process.mode');
			}

			return errors.length > 0 ? false : true;
		},

		loadConfig = function () {
			try {
				var tmpConfig = requireUncached(path);
			} catch (e) {
				log.error('Job at ' + path + ' is not loaded due to invalid JSON.', 'Detailed error:', e);
				return false;
			}
			var whut = clone(defaultConfig, {});
			self.config = clone(tmpConfig, whut);
			if ((valid = validateConfig())) {
				log.info('%s: Configuration loaded from %s.', self.config.name, path);
				log = log.child({job: self.config.name});
			} else {
				log.warn('Configuration loaded, but will not start due to invalid self.configuration.');
			}
			return valid;
			//metaData = readFule...
		};


	self.config;

	this.state = {
		
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

	};

	this.isValid = () => { return errors.length > 0 ? false : true; };
	
	this.reload = function () {

		reset();
		loadConfig();

		if(self.config.enabled) {

			// Run forever
			if ( self.config.on.forever ) {
				this.execute(false, 'forever');

			// Run on cron pattern
			} else if ( self.config.on.cron && self.config.on.cron.pattern ) {
				scheduler = croner( self.config.on.cron.pattern );
				controller = scheduler.schedule({
						startAt: self.config.on.cron.start,
						stopAt: self.config.on.cron.end,
						maxRuns: self.config.on.cron.maxRuns
					},
					() => this.execute(false, 'scheduler')
				);

				self.state.next = scheduler.next();

			// Not scheduled
			} else {
				log.info('%s: not scheduled.', self.config.name);

			}
		}

		return this.isValid();

	};

	this.stop = () => reset();

	this.execute = function ( force, starter ) {
		
		// Run some sanity checks before forking away

		// Must be a valid job
		if ( !this.isValid() ) {
			log.warn('%s: Job invalid, could not start.', self.config.name);
			return false;
		}

		// Must be enabled, or forced
		if( !self.config.enabled ) {
			if ( force ) {
				log.info('%s: Forcefully starting disabled job.', self.config.name);
			} else {
				log.warn('%s: Job disabled, could not start.', self.config.name);
				return false;	
			}
		}

		// Cannot already be running
		if (this.state.state == 'running') {
			log.warn('%s: Job already running, can not start.', self.config.name);
			return false;
		}

		// Everything seems to be in order, go on forking
		log.info('%s: Started by %s', self.config.name, starter);

		// Update state
		self.state.started = new Date();
		self.state.finished = null;
		self.state.state = 'running';

		// Register process
		child = proc(self.config.process, (exitCode, stdout, stderr, error) => {

			// Reset timeouts
			clearTimeout(timeout75Percent);
			clearTimeout(timeout100Percent);

			self.state.finished = new Date();

			if (self.state.runs > 0) {
				self.state.averageRuntime = ((self.state.averageRuntime * self.state.runs) + (self.state.finished - self.state.started)) / (self.state.runs + 1);
			} else {
				self.state.averageRuntime = (self.state.finished - self.state.started);
			}
			self.state.runs++;

			// If error is defined, this indicates failure while forking
			if (error) {
				log.info('%s Could not start. Error: %s', self.config.name , error);
				self.state.logs.lastFailed = { at: self.state.started, stdout: stdout, stderr: stderr, error: error && error.toString(), exitCode: exitCode };

			// An exit code other than 0 indicates that the child process failed in one way or another
			} else if (exitCode !== 0) {
				if (exitCode === null ) {
					error = "Process had to be forcefully killed.";
				} else {
					error = "Exit code indicated an error.";
				}
				log.error('%s exited with code %s', self.config.name, exitCode);
				self.state.logs.lastFailed = { at: self.state.started, stdout: stdout, stderr: stderr, error: error && error.toString(), exitCode: exitCode };
				if (stdout && stdout != "") {
					log.error('%s stdout: %s', self.config.name, stdout.toString());
				}
				if (stderr && stderr != "") {
					log.error('%s stderr: %s', self.config.name, stderr.toString());
				}

			// Content in stderr calls for a warning
			} else {

				if (stderr && stderr != "") {
					log.warn('%s: Placed information in stderr: %s', self.config.name, stderr);
				}

				log.info('%s: Finished successfully.', self.config.name);

			}

			// Instantly restart, if needed
			if( self.config.on.forever ) {
				setTimeout(() => this.execute(false, forever), self.config.restartMs);
			}

			self.state.logs.last = { at: this.state.started, stdout: stdout, stderr: stderr, error: error,exitCode: exitCode };
			this.state.state  = 'ready';

			// Log next run
			if( starter=='scheduler' ) {

				self.state.next = scheduler.next();
				if(self.state.next) {
					log.info('%s: Next scheduled run is at %s', self.config.name, self.state.next);	
				} else {
					log.info('%s: Job has expired.',self.config.name);
				}

			}


		});

		if (self.config.process.timeout) {
			
			timeout75Percent = setTimeout(function () {
				log.warn('75% of allowed run time has passed.');
			}, self.config.process.timeout * 0.75 * 1000);

			timeout100Percent = setTimeout(function () {
				log.warn('Job timed out, forcefully killing process.');
				child.kill();
			}, self.config.process.timeout * 1000);	

		}

		return true;

	};

	this.reload();

	return this;
};

module.exports = job;