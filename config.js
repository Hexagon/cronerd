// All possible configuration values, with default value or null
var defaults = {
	users: {
		allowed: []
	}
};

function config () {
	// Extend nothing with defaults
	// Look in /etc/cronerd/ for config.json
	// Look in /etc/cronerd/conf.d/*.json for configuration extensions

	// Check that all entries exist in defaults! Soft throw if not (console.error())
}

module.exports = new config();