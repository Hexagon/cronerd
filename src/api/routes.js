"use strict";

var log = require("../core/log.js")("api-routes");

module.exports = function (server, jobs, respond) {

	server.get('/api/jobs/list', function(req, res, next) {
		let result = jobs.list();
		if( result ) {
			respond(res, next, 200, result);
		} else {
			respond(res, next, 500, null, "Could not list jobs");		
		}
	});

	server.get('/api/jobs/reload', function(req, res, next) {
		let result = jobs.reload();
		if( result ) {
			respond(res, next, 200, result);
		} else {
			respond(res, next, 500, null, "Could not reload jobs");		
		}
	});

	server.get('/api/timestamp', function(req, res, next) {
		var result = {
			server: new Date()
		}
		if ( req.params.client ) {
			result.client = req.params.client;
		}
		respond(res, next, 200, result);
	});

	server.get('/api/job/reload', function(req, res, next) {
		
		if (!req.params.name)
			return respond(res, next, 500, null, "No job specified." );

		var job = jobs.get(req.params.name),
			success;
		if ( job ) {
			success = job.reload();
			if ( success ) {
				respond(res, next, 200, success );
			} else {
				respond(res, next, 500, null, "Job reloaded, but configuration was invalid." );
			}
		} else {
			respond(res, next, 500, null, "Job not found");
		}
	});

	server.get('/api/job/start', function(req, res, next) {
		
		if (!req.params.name)
			return respond(res, next, 500, null, "No job specified." );

		var job = jobs.get(req.params.name),
			starter,
			success;
		if ( job ) {
			starter = req.params.starter || "api";
			success = job.execute(false, starter);
			if( success ) {
				respond(res, next, 200, success );
			} else {
				respond(res, next, 500, null, "Job could not be started." );
			}
			
		} else {
			respond(res, next, 500, null, "Job not found");
		}
	});

	server.get('/api/job/force', function(req, res, next) {

		if (!req.params.name)
			return respond(res, next, 500, null, "No job specified." );

		var job = jobs.get(req.params.name),
			starter,
			success;
		if ( job ) {
			starter = req.params.starter || "api";
			success = job.execute(true, starter);
			if( success ) {
				respond(res, next, 200, success );	
			} else {
				respond(res, next, 500, null, "Job could not be started." );	
			}
			
		} else {
			respond(res, next, 500, null, "Job not found");
		}
	});

	server.get('/api/job/status', function(req, res, next) {
		
		if (!req.params.name)
			return respond(res, next, 500, null, "No job specified." );

		var job = jobs.get(req.params.name),
			status;
		if ( job ) {
			respond(res, next, 200, job.state );
		} else {
			respond(res, next, 500, null, "Job not found");
		}
	});

	server.get('/api/job/config', function(req, res, next) {
		var job = jobs.get(req.params.name),
			status;
		if ( job ) {
			respond(res, next, 200, job.config );
		} else {
			respond(res, next, 500, null, "Job not found");
		}
	});
	

};