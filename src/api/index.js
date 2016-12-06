"use strict";

var log = require("../core/log.js")("api"),
	routes = require("./routes.js"),
	config = require("../core/config.js");

function api(jobs, server) {

	// Interface for creating well formed REST responses
	var respond = function (res, next, code, data, message) {

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

	// Set up routes
	if( config.web.api || config.web.gui ) {
		log.info('API Enabled');
		routes(server, jobs, respond);
	} else {
		log.info('API Disabled');
	}

};

module.exports = api;