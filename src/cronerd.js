var config 	= require('./core/config.js'),

	jobs 	= require('./core/jobs.js'),
	
	web 	= require('./web/index.js'),
	ipc 	= require('./ipc/index.js');

web(jobs);
ipc(jobs);