var 
	croner = require("croner"),
	clone = require("./clone.js"),
	child_process = require('child_process'),
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
			mode: 'fork',		// fork, spawn, exec
			command: '',
			arguments: [],		
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
			if(config.on.forever && config.on.trigger || config.on.forever && config.on.cron && config.on.cron.pattern ) {
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
		},

		schedule = function (self) {
			if ( config.on.forever ) {
				self.execute();
			} else if ( config.on.cron && config.on.cron.pattern ) {
				var scheduler = croner( config.on.cron.pattern );
				controller = scheduler.schedule(
					{
						startAt: config.on.cron.start,
						stopAt: config.on.cron.end,
						maxRuns: config.on.cron.maxRuns
					},
					() => self.execute()
				);
			} else {
				console.log(config.name + ' not scheduled.');
			}
		},

		start = function (self) {
			if(loadConfig()) {
				schedule(self);
			}
		},

		done = function (self, exitCode, stdout, stderr) {
			if ( exitCode ) {
				console.error(config.name + ' failed with exit code ' + exitCode);	
				stdout && console.log(stdout);
				stderr && console.error(stderr);
			} else {
				console.log(config.name + ' finished successfully');
				stdout && console.log(stdout);
				stderr && console.error(stderr);
			}
			if( config.on.forever ) {
				setTimeout(() => self.execute(), 10);
			}
		}

	this.isValid = () => { return errors.length > 0 ? false : true; };

	this.reload = function () {

		reset();

		start(this);

	};

	this.stop = () => reset();

	this.execute = function ( force ) {
		
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

		// Ok, do run!
		console.log(config.name + ' is starting.');

		// Exec
		if ( config.process.mode == 'exec') {
			child_process.exec(config.process.command, config.process.options, (error, stdout, stderr) => {
			  
			  var exitCode = 0;

			  if (error) {
			    exitCode = error.code;
			  }

			  // exitCode, stdout, stderr
			  done(this, exitCode, stdout, stderr);

			});

		// Spawn / Fork
		} else {
			try {
				var p = child_process.spawn(config.process.command, config.process.arguments, config.process.options),
					stdout = [],
					stderr = [];

				p.on("error", (err) => {
					done(this, '1', "Process failed. ",  err);
				});

				p.stdout.on('data', (data) => {
				  stdout.push(data);
				});

				p.stderr.on('data', (data) => {
				  stderr.push(data);
				});

				p.on('exit', (code) => {
				   done(this, code, stdout.join('\n'), stderr.join('\n'));
				});
			} catch (e) {
				done(this, '1', "Process could not be started. ",  e);
			}
		}

	};

	this.reload();

	return this;
};

module.exports = job;