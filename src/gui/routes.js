"use strict";

var log = require("../core/log.js")("api-routes");

module.exports = function (server) {

	server.get('/woop', function(req, res, next) {
		res.send(200, "<h1>Hellu</h1>");
		next();
	});

};