"use strict";

var log = require("../core/log.js")("gui"),
	routes = require("./routes.js"),
	config = require("../core/config.js");

function gui(server, restify) {

	if( config.web.gui ) {

		// Set up routes
		routes(server);
		
		server.get(/\/?.*/, restify.serveStatic({
		  	directory: './src/gui/public',
		  	default: 'index.html'
		}));


		log.info('GUI Enabled');
	} else {
		log.info('GUI Disabled');
	}

};

module.exports = gui;