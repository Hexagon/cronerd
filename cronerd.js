var jobs 	= require('./src/core/jobs.js'),
	
	log 	= require("./src/core/log.js")(),

	web 	= require("./src/core/http.js"),
	api 	= require('./src/api/index.js'),
	gui 	= require('./src/gui/index.js'),
	
	config 	= require('./src/core/config.js'),

	restify	= require('restify'),
	
	server;

// Set up web server
server = web(restify);

// Set up /api/*
api(jobs, server);

// Set up web GUI
gui(server, restify);

// Start server
server.listen(config.web.port, function() {
  log.info('%s listening at %s', server.name, server.url);
});