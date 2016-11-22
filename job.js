var 
	extend = require("util")._extend,
	croner = require("croner"),

	defaultConfig = {

		name: "unnamed-process",
		description: "",

		enabled: null,

		on: {
			forever: false,
			event: null,
			cron: {
				pattern: undefined,
				start: undefined,
				end: undefined,
				maxRuns: undefined
			}
		},

		process: {
			mode: 'fork',		// fork, spawn, exec
			command: '',		
			options: {
								// regular options object for fork, spawn, exec etc. 
								// Plus user: "username" sets uid, group: "groupname" sets gid
			} 
		}

	};

function job (path) {

	var 
		config,
		valid = false,
		controller,

		reset = function () {
			
			config = undefined;
			valid = false;
			
			controller && controller.stop();
			controller = undefined;

		},

		validateConfig = function () {
			// Look for keys not in configDefaults, test pattern, test dates, etc.
			return true;
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
			config = extend(extend({}, defaultConfig), tmpConfig);
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
				execute();
			} else if ( config.on.cron.pattern ) {
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
		};

	this.isValid = () => { return valid };

	this.reload = function () {

		reset();

		if(loadConfig()) {
			schedule(this);
		}

	};

	this.stop = () => reset();

	this.execute = function ( force ) {
		
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

		// Ok, do run!
		console.log(config.name + 'Running...');

	};


	this.reload();

	return this;
};

module.exports = job;