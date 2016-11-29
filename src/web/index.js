var restify = require('restify'),
	log = require("../core/log.js")("web"),
	config = require('../core/config.js');

function web(jobs) {

	var server = restify.createServer();

	server.get('/jobs/list', function(req, res, next) {
	  res.send({"code": "success", "message": jobs.list() });
	  next();
	});

	server.get('/jobs/reload', function(req, res, next) {
	  res.send({"code": "success", "message": jobs.reload() });
	  next();
	});

	server.listen(config.web.port, function() {
	  log.info('%s listening at %s', server.name, server.url);
	});

};

module.exports = web;