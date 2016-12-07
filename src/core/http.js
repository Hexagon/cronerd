var log = require("./log.js")("http"),
	config 	= require('./config.js'),
	hash 	= require('./hash.js');

module.exports  = function (restify) {
	
	// Create restify server
	var server = restify.createServer({
		name: config.web.name,
		log: log
	});

	// Append middleware
	server.use(restify.queryParser());
	server.use(restify.bodyParser());
	server.use(restify.authorizationParser());

	// Enable authentication
	if( config.web.authentication.enable ) {

		server.use(function (req, res, next) {

			var auth = req.headers['authorization'],
				valid = false;

			// Check credentials
			if( 
				config.web.authentication.users[req.username] 	/* Check that user exists */
				&& req.authorization.basic.password				/* Check that authorization headers has a password */
				&& 												/* Check that hash of password matches config */
					hash(req.authorization.basic.password) === config.web.authentication.users[req.username].password) {
				valid = true;
			}

			// Log invalid login attempts
			if (auth && !valid) {
				log.warn("Invalid password for user '%s' from ip '%s'", req.username, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
			}

			// First entry or invalid authorization 
		    if (!auth || !valid) {
				res.statusCode = 401;
				res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

				// Block request
				return res.end('Lööh');

			// Valid authorization
			} else {

				// Allow request
		        next();

		    }

		});

		log.info('Authentication Enabled');
	} else {
		log.info('Authentication Disabled');
	}

	return server;

}