var crypto = require('crypto');

module.exports = function (what) {
	var hash = crypto.createHash('sha256');
	return hash.update(what).digest('hex');
};