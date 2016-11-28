var config = require('./core/config.js'),

	log = require('bunyan').createLogger(config.log),

	jobs = require('./core/jobs.js').init(log.child({section: 'core/jobs'})),

	web = require('./web/index.js')(log, jobs),
	ipc = require('./ipc/index.js')(log, jobs);