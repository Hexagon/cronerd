"use strict";

var restify = require('restify'),
	log = require("../core/log.js")("api"),
	routes = require("./routes.js"),
	config = require('../core/config.js');

// REST Router
function api(jobs) {

	// Create restify server
	var server = restify.createServer({
			name: config.web.name,
			log: log
		}),

		// Interface for creating well formed REST responses
		respond = function (res, next, code, data, message) {

			var codeText;

			if (code == 200) {
				codeText = "OK";
			} else if (code > 200 && code < 400) {
				codeText = "Success";
			} else if (code>= 500) {
				codeText = "InternalError";
			} else {
				message = "Unknown HTTP response code set by server: " + code;
				codeText = "InternalError";
				code = 500;
			}

			res.send(code, {code: codeText, message: message, data: data });

			next();
		};

	// Append middleware
	server.use(restify.queryParser());
	server.use(restify.bodyParser());

	// Set up routes
	routes(server, jobs, respond);

	// Start server
	server.listen(config.web.port, function() {
	  log.info('%s listening at %s', server.name, server.url);
	});

};

module.exports = api;